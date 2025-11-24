/* eslint-disable consistent-return, no-magic-numbers */
const Interview = require("../models/Interview");
const Question = require("../models/Question");
const mongoose = require("mongoose");
const aiQuestionService = require("../services/aiQuestionService");
const hybridQuestionService = require("../services/hybridQuestionService");
const evaluationService = require("../services/evaluationService");
const advancedFeedbackService = require("../services/advancedFeedbackService");
const aiProviderManager = require("../services/aiProviders");
const { destroyByPrefix } = require("./uploadController");
const C = require("../utils/constants");
const Logger = require("../utils/logger");
const { ok, fail, created } = require("../utils/responder");
const { consumeFreeInterview } = require("../utils/subscription");
const { mapDifficulty } = require("../utils/questionNormalization");
const FEATURES = require("../config/features");

// Helper function to update user analytics after interview completion
async function updateUserAnalytics(userId) {
  try {
    const UserProfile = require("../models/UserProfile");

    const userProfile = await UserProfile.findOne({ user: userId });
    if (!userProfile) {
      Logger.warn(
        `[updateUserAnalytics] UserProfile not found for user ${userId}`
      );
      return;
    }

    // Recalculate analytics from all interviews
    const allInterviews = await Interview.find({ user: userId });
    const completedInterviews = allInterviews.filter(
      (i) => i.status === "completed"
    );

    // Calculate average score from completed interviews
    const scores = completedInterviews
      .filter((i) => i.results?.overallScore != null)
      .map((i) => i.results.overallScore);
    const avgScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Update analytics
    userProfile.analytics = userProfile.analytics || {};
    userProfile.analytics.totalInterviews = allInterviews.length;
    userProfile.analytics.completedInterviews = completedInterviews.length;
    userProfile.analytics.averageScore = Math.round(avgScore);
    userProfile.analytics.lastCalculated = new Date();

    userProfile.markModified("analytics");
    await userProfile.save({ validateModifiedOnly: true });

    Logger.info(`[updateUserAnalytics] Updated analytics for user ${userId}`, {
      totalInterviews: allInterviews.length,
      completedInterviews: completedInterviews.length,
      averageScore: Math.round(avgScore),
    });
  } catch (error) {
    // Don't fail the request if analytics update fails
    Logger.error("[updateUserAnalytics] Failed to update analytics", {
      error: error.message,
      userId,
    });
  }
}

// Create new interview session
const createInterview = async (req, res) => {
  const userId = req.user?.id; // Keep this one
  const config = { ...(req.body?.config || req.body) };
  // Multilingual: capture language from request (body, header) with fallback
  const requestedLang = (
    req.body.language ||
    config.language ||
    req.headers["x-language"] ||
    "en"
  ).toLowerCase();
  config.language = requestedLang;
  const userProfile = req.userProfile;
  Logger.info("[createInterview] config received:", config);
  Logger.info("[createInterview] userProfile:", userProfile);
  try {
    // Provide tolerant defaults in non-production test/dev to avoid schema failures
    if (!config.duration) {
      // eslint-disable-next-line no-magic-numbers
      config.duration = 30; // minutes default for tests
    }
    if (!config.difficulty) {
      config.difficulty = "intermediate";
    }
    const userProfile = req.userProfile;

    if (
      !config ||
      !config.jobRole ||
      !config.experienceLevel ||
      !config.interviewType
    ) {
      return fail(
        res,
        400,
        "CONFIG_INVALID",
        "Missing required interview configuration"
      );
    }

    if (!userProfile) {
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
    }

    // Ensure subscription object exists with defaults
    if (!userProfile.subscription) {
      userProfile.subscription = {
        plan: "free",
        status: "active",
        interviewsUsedThisMonth: 0,
        lastInterviewReset: new Date(),
        interviewsRemaining: 10,
        cancelAtPeriodEnd: false,
      };
      await userProfile.save();
    }

    // Ensure analytics object exists with defaults
    if (!userProfile.analytics) {
      userProfile.analytics = {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        strongAreas: [],
        improvementAreas: [],
        streak: {
          current: 0,
          longest: 0,
        },
      };
      await userProfile.save();
    }

    if (
      userProfile.subscription.plan === "free" &&
      userProfile.subscription.interviewsRemaining <= 0
    ) {
      return fail(
        res,
        403,
        "INTERVIEW_LIMIT",
        "Interview limit reached. Please upgrade to continue."
      );
    }

    // ... rest of createInterview stays the same (no more req.auth references)
    // Just keep existing code for questions generation and interview creation

    let questions;
    const explicitQuestionIds = Array.isArray(req.body?.questionIds)
      ? req.body.questionIds.filter(Boolean)
      : [];
    const explicitQuestions = Array.isArray(req.body?.questions)
      ? req.body.questions
      : [];

    if (explicitQuestionIds.length > 0) {
      const found = await Question.find({ _id: { $in: explicitQuestionIds } });
      const foundMap = new Map(found.map((q) => [q._id.toString(), q]));
      questions = explicitQuestionIds
        .map((id, idx) => {
          const doc = foundMap.get(String(id));
          if (doc) return doc;
          const raw = explicitQuestions[idx];
          return raw
            ? {
                _id: new mongoose.Types.ObjectId(),
                text: raw.text || raw.questionText || `Question ${idx + 1}`,
                category: raw.category || raw.type || "general",
                difficulty: mapDifficulty(
                  raw.difficulty || config.difficulty || "intermediate"
                ),
                estimatedTime:
                  raw.estimatedTime ||
                  (raw.timeEstimate ? raw.timeEstimate * C.SEC_PER_MIN : 120),
                tags: raw.tags || [],
                source: raw.source || "provided",
              }
            : null;
        })
        .filter(Boolean);
      if (questions.length === 0) {
        return fail(
          res,
          400,
          "NO_QUESTIONS",
          "None of the provided questionIds resolved to questions"
        );
      }
    } else if (explicitQuestions.length > 0) {
      questions = explicitQuestions.map((raw, idx) => ({
        _id: new mongoose.Types.ObjectId(),
        text: raw.text || raw.questionText || `Question ${idx + 1}`,
        category: raw.category || raw.type || "general",
        difficulty: mapDifficulty(
          raw.difficulty || config.difficulty || "intermediate"
        ),
        estimatedTime:
          raw.estimatedTime ||
          (raw.timeEstimate ? raw.timeEstimate * C.SEC_PER_MIN : 120),
        tags: raw.tags || [],
        source: raw.source || "provided",
      }));
      if (questions.length === 0) {
        return fail(
          res,
          400,
          "NO_QUESTIONS",
          "Provided questions array was empty"
        );
      }
    } else {
      questions = await getQuestionsForInterview(config, userProfile);
      Logger.info(
        `[createInterview] Questions received from getQuestionsForInterview (language: ${config.language}):`,
        questions.map((q) => ({
          text: q.text?.substring(0, 60),
          questionText: q.questionText?.substring(0, 60),
        }))
      );

      if (questions.length === 0) {
        if (process.env.NODE_ENV !== "production") {
          const fallbackQuestions = [
            new Question({
              text: `Describe a challenge related to ${config.jobRole}.`,
              category: "communication",
              difficulty: config.difficulty || "intermediate",
              type: "behavioral",
              experienceLevel: [config.experienceLevel],
              estimatedTime: 120,
              source: "emergency-fallback",
              status: "active",
            }),
          ];

          // Translate fallback questions if needed
          if (config.language && config.language !== "en") {
            try {
              const translationService = require("../services/translationService");
              questions = await translationService.translateQuestions(
                fallbackQuestions,
                config.language
              );
              Logger.info(
                `[createInterview] Translated fallback question to ${config.language}`
              );
            } catch (err) {
              Logger.warn(
                `[createInterview] Fallback translation failed: ${err.message}`
              );
              questions = fallbackQuestions;
            }
          } else {
            questions = fallbackQuestions;
          }
        } else {
          return fail(
            res,
            400,
            "NO_QUESTIONS",
            "No suitable questions found for this configuration"
          );
        }
      }
    }

    // Remove the duplicate question logic - hybridQuestionService handles this
    // Questions are now properly generated with the right count

    // Log all values before creating interview
    Logger.info("[createInterview] Creating interview with:");
    Logger.info("  - userId:", userId);
    Logger.info("  - userProfile._id:", userProfile._id);
    Logger.info("  - config.jobRole:", config.jobRole);
    Logger.info("  - config.experienceLevel:", config.experienceLevel);
    Logger.info("  - config.interviewType:", config.interviewType);
    Logger.info("  - config.difficulty:", config.difficulty);
    Logger.info("  - config.duration:", config.duration);
    Logger.info("  - config.questionCount:", config.questionCount);
    Logger.info("  - questions.length:", questions.length);

    // CHANGED: userId → user in Interview creation
    const interview = new Interview({
      user: userId, // CHANGED from: userId: userId
      userProfile: userProfile._id,
      config: {
        ...config,
        questionCount: config.adaptiveDifficulty?.enabled
          ? config.questionCount || C.DEFAULT_QUESTION_COUNT
          : Math.max(
              5,
              Math.min(
                config.questionCount || C.DEFAULT_QUESTION_COUNT,
                questions.length
              )
            ),
        adaptiveDifficulty: config.adaptiveDifficulty?.enabled
          ? {
              enabled: true,
              initialDifficulty: config.difficulty,
              currentDifficulty: config.difficulty,
              difficultyHistory: [],
            }
          : { enabled: false },
        // Flag to explicitly request at least one coding question in the session
        coding: Boolean(config.coding) || undefined,
      },
      questions: questions
        .slice(
          0,
          // Always store full question count - adaptive mode will manage which questions
          // are shown/skipped dynamically, but we need all questions available upfront
          config.questionCount || C.DEFAULT_QUESTION_COUNT
        )
        .map((q) => {
          // Ensure question has an _id (create one if missing)
          const questionId = q._id || new mongoose.Types.ObjectId();

          return {
            questionId: questionId,
            questionText: q.questionText || q.text,
            category: q.category,
            difficulty: mapDifficulty(q.difficulty),
            timeAllocated: q.estimatedTime,
            hasVideo: false,
          };
        }),
      status: "scheduled",
    });

    // --- Auto-inject coding questions when explicitly requested ---
    // Only inject coding challenges when user explicitly enables them in interview setup
    // config.coding will be present with challengeCount, difficulty, language when enabled
    const wantsCoding = Boolean(config.coding);
    const hasCodingAlready = interview.questions.some(
      (q) =>
        (q.category || "").toLowerCase() === "coding" ||
        (q.type || "").toLowerCase() === "coding"
    );

    // Use backend feature flag name (CODING_CHALLENGES) instead of frontend alias
    if (wantsCoding && !hasCodingAlready && FEATURES.CODING_CHALLENGES) {
      try {
        // Determine how many coding questions to add
        const requestedCodingCount = config.coding?.challengeCount || 1;
        const totalQuestionCount = interview.questions.length;

        // Don't exceed total question count - replace some questions instead
        const codingCount = Math.min(
          requestedCodingCount,
          Math.floor(totalQuestionCount / 2)
        );

        const codingDifficulty = mapDifficulty(
          config.coding?.difficulty || config.difficulty || "intermediate"
        );

        // Professional coding question pools organized by difficulty
        const questionsByDifficulty = {
          beginner: [
            {
              title: "Array Element Removal",
              questionText: `Write a function to remove duplicates from an array and return the unique elements in their original order.

**Problem Statement:**
Given an array that may contain duplicate values, create a function that returns a new array with only the unique elements, preserving the order of their first appearance.

**Constraints:**
• Array length: 0 ≤ n ≤ 10,000
• Elements can be numbers or strings
• Time Complexity: O(n)
• Space Complexity: O(n)

**Function Signature:**
\`\`\`javascript
function removeDuplicates(arr)
\`\`\`

**Hint:** Consider using a Set or an object to track seen elements.`,
              examples: [
                { input: "[1, 2, 2, 3, 4, 4, 5]", output: "[1, 2, 3, 4, 5]" },
                { input: "[1, 1, 1]", output: "[1]" },
                { input: "['a', 'b', 'a', 'c']", output: "['a', 'b', 'c']" },
              ],
              tags: ["arrays", "hash-table"],
            },
            {
              title: "String Reversal",
              questionText: `Implement a function that reverses a string without using built-in reverse methods.

**Problem Statement:**
Write a function that takes a string as input and returns it reversed. You should implement this using basic string manipulation.

**Constraints:**
• String length: 0 ≤ n ≤ 10,000
• Can contain letters, numbers, spaces, and special characters
• Time Complexity: O(n)
• Space Complexity: O(n)

**Function Signature:**
\`\`\`javascript
function reverseString(str)
\`\`\`

**Hint:** You can iterate from the end to the beginning, or use array methods.`,
              examples: [
                { input: "'hello'", output: "'olleh'" },
                { input: "'Interview'", output: "'weivretnI'" },
                {
                  input: "'A man, a plan, a canal: Panama'",
                  output: "'amanaP :lanac a ,nalp a ,nam A'",
                },
              ],
              tags: ["string", "two-pointers"],
            },
            {
              title: "Palindrome Checker",
              questionText: `Write a function to check if a given string is a palindrome.

**Problem Statement:**
A palindrome is a string that reads the same forward and backward (ignoring spaces, punctuation, and case). Determine if the input string is a palindrome.

**Constraints:**
• String length: 0 ≤ n ≤ 10,000
• Consider only alphanumeric characters
• Ignore cases
• Time Complexity: O(n)
• Space Complexity: O(1)

**Function Signature:**
\`\`\`javascript
function isPalindrome(str)
\`\`\`

**Hint:** Clean the string first, then use two pointers from both ends.`,
              examples: [
                { input: "'racecar'", output: "true" },
                { input: "'A man, a plan, a canal: Panama'", output: "true" },
                { input: "'hello'", output: "false" },
              ],
              tags: ["string", "two-pointers"],
            },
            {
              title: "Find Maximum in Array",
              questionText: `Implement a function that finds the maximum number in an array without using built-in Math.max().

**Problem Statement:**
Given an array of numbers, find and return the largest value. Handle edge cases like empty arrays.

**Constraints:**
• Array length: 0 ≤ n ≤ 10,000
• Numbers can be positive, negative, or zero
• Return -Infinity for empty arrays
• Time Complexity: O(n)
• Space Complexity: O(1)

**Function Signature:**
\`\`\`javascript
function findMax(arr)
\`\`\`

**Hint:** Initialize with the first element and compare with each subsequent element.`,
              examples: [
                { input: "[1, 5, 3, 9, 2]", output: "9" },
                { input: "[10, 20, 15]", output: "20" },
                { input: "[-5, -2, -10, -1]", output: "-1" },
              ],
              tags: ["arrays", "math"],
            },
          ],
          intermediate: [
            {
              title: "Two Sum Problem",
              questionText: `Given an array of integers and a target sum, find two numbers that add up to the target.

**Problem Statement:**
Return the indices of the two numbers such that they add up to the target. You may assume that each input has exactly one solution, and you cannot use the same element twice.

**Constraints:**
• Array length: 2 ≤ n ≤ 10,000
• -10^9 ≤ arr[i] ≤ 10^9
• -10^9 ≤ target ≤ 10^9
• Exactly one solution exists
• Time Complexity: O(n)
• Space Complexity: O(n)

**Function Signature:**
\`\`\`javascript
function twoSum(nums, target)
\`\`\`

**Hint:** Use a hash map to store values you've seen and their indices.`,
              examples: [
                {
                  input: "nums = [2, 7, 11, 15], target = 9",
                  output: "[0, 1]",
                },
                { input: "nums = [3, 2, 4], target = 6", output: "[1, 2]" },
                { input: "nums = [3, 3], target = 6", output: "[0, 1]" },
              ],
              tags: ["arrays", "hash-table"],
            },
            {
              title: "Valid Anagram",
              questionText: `Determine if two strings are anagrams of each other.

**Problem Statement:**
Two strings are anagrams if they contain the same characters with the same frequencies. Write a function to check if two given strings are anagrams.

**Constraints:**
• String length: 0 ≤ n ≤ 50,000
• Strings contain only lowercase English letters
• Case-sensitive comparison
• Time Complexity: O(n)
• Space Complexity: O(1) - fixed alphabet size

**Function Signature:**
\`\`\`javascript
function isAnagram(s, t)
\`\`\`

**Hint:** Count character frequencies or sort both strings.`,
              examples: [
                { input: "s = 'listen', t = 'silent'", output: "true" },
                { input: "s = 'anagram', t = 'nagaram'", output: "true" },
                { input: "s = 'rat', t = 'car'", output: "false" },
              ],
              tags: ["string", "hash-table", "sorting"],
            },
            {
              title: "First Non-Repeating Character",
              questionText: `Find the first character in a string that doesn't repeat.

**Problem Statement:**
Given a string, find the first non-repeating character and return its index. If all characters repeat, return -1.

**Constraints:**
• String length: 1 ≤ n ≤ 100,000
• String contains only lowercase English letters
• Time Complexity: O(n)
• Space Complexity: O(1) - fixed alphabet size

**Function Signature:**
\`\`\`javascript
function firstUniqChar(s)
\`\`\`

**Hint:** Make two passes - first to count frequencies, second to find the first unique character.`,
              examples: [
                { input: "'leetcode'", output: "0 (character 'l')" },
                { input: "'loveleetcode'", output: "2 (character 'v')" },
                { input: "'aabb'", output: "-1" },
              ],
              tags: ["string", "hash-table", "queue"],
            },
            {
              title: "Array Rotation",
              questionText: `Rotate an array to the right by k steps.

**Problem Statement:**
Given an array, rotate it to the right by k steps, where k is non-negative. Implement this in-place with O(1) extra space.

**Constraints:**
• Array length: 1 ≤ n ≤ 100,000
• 0 ≤ k ≤ 100,000
• -2^31 ≤ arr[i] ≤ 2^31 - 1
• Time Complexity: O(n)
• Space Complexity: O(1)

**Function Signature:**
\`\`\`javascript
function rotate(nums, k)
\`\`\`

**Hint:** Use array reversal technique - reverse entire array, then reverse first k and last n-k elements.`,
              examples: [
                {
                  input: "nums = [1,2,3,4,5,6,7], k = 3",
                  output: "[5,6,7,1,2,3,4]",
                },
                {
                  input: "nums = [-1,-100,3,99], k = 2",
                  output: "[3,99,-1,-100]",
                },
              ],
              tags: ["arrays", "math", "two-pointers"],
            },
          ],
          advanced: [
            {
              title: "Longest Substring Without Repeating Characters",
              questionText: `Find the length of the longest substring without repeating characters.

**Problem Statement:**
Given a string, find the length of the longest substring that contains all unique characters. Use the sliding window technique for optimal performance.

**Constraints:**
• String length: 0 ≤ n ≤ 50,000
• String consists of English letters, digits, symbols and spaces
• Time Complexity: O(n)
• Space Complexity: O(min(m, n)) where m is charset size

**Function Signature:**
\`\`\`javascript
function lengthOfLongestSubstring(s)
\`\`\`

**Hint:** Use sliding window with a hash set to track characters in current window.`,
              examples: [
                { input: "'abcabcbb'", output: "3 (substring: 'abc')" },
                { input: "'bbbbb'", output: "1 (substring: 'b')" },
                { input: "'pwwkew'", output: "3 (substring: 'wke')" },
              ],
              tags: ["string", "hash-table", "sliding-window"],
            },
            {
              title: "Container With Most Water",
              questionText: `Find two lines that together with the x-axis form a container that holds the most water.

**Problem Statement:**
You are given an array of heights where each element represents a vertical line. Find two lines that form a container with the maximum area of water it can hold.

**Constraints:**
• Array length: 2 ≤ n ≤ 100,000
• 0 ≤ height[i] ≤ 10,000
• Time Complexity: O(n)
• Space Complexity: O(1)

**Function Signature:**
\`\`\`javascript
function maxArea(height)
\`\`\`

**Hint:** Use two pointers starting from both ends, move the pointer with smaller height.`,
              examples: [
                { input: "[1,8,6,2,5,4,8,3,7]", output: "49" },
                { input: "[1,1]", output: "1" },
                { input: "[4,3,2,1,4]", output: "16" },
              ],
              tags: ["arrays", "two-pointers", "greedy"],
            },
            {
              title: "Valid Parentheses",
              questionText: `Determine if a string containing brackets is valid.

**Problem Statement:**
Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if:
1. Open brackets are closed by the same type of brackets
2. Open brackets are closed in the correct order
3. Every close bracket has a corresponding open bracket

**Constraints:**
• String length: 1 ≤ n ≤ 10,000
• Time Complexity: O(n)
• Space Complexity: O(n)

**Function Signature:**
\`\`\`javascript
function isValid(s)
\`\`\`

**Hint:** Use a stack to track opening brackets.`,
              examples: [
                { input: "'()'", output: "true" },
                { input: "'()[{}]'", output: "true" },
                { input: "'(]'", output: "false" },
                { input: "'([)]'", output: "false" },
              ],
              tags: ["string", "stack"],
            },
            {
              title: "Merge Intervals",
              questionText: `Merge all overlapping intervals.

**Problem Statement:**
Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of the non-overlapping intervals.

**Constraints:**
• 1 ≤ intervals.length ≤ 10,000
• intervals[i].length == 2
• 0 ≤ start_i ≤ end_i ≤ 10,000
• Time Complexity: O(n log n)
• Space Complexity: O(n)

**Function Signature:**
\`\`\`javascript
function merge(intervals)
\`\`\`

**Hint:** Sort intervals by start time, then merge overlapping ones.`,
              examples: [
                {
                  input: "[[1,3],[2,6],[8,10],[15,18]]",
                  output: "[[1,6],[8,10],[15,18]]",
                },
                { input: "[[1,4],[4,5]]", output: "[[1,5]]" },
              ],
              tags: ["arrays", "sorting"],
            },
          ],
        };

        // Select questions based on difficulty
        const codingQuestionPool =
          questionsByDifficulty[codingDifficulty] ||
          questionsByDifficulty.intermediate;

        // Select random questions from the pool
        const selectedQuestions = [];
        const poolCopy = [...codingQuestionPool];
        const numToAdd = Math.min(codingCount, poolCopy.length);

        for (let i = 0; i < numToAdd; i++) {
          const randomIndex = Math.floor(Math.random() * poolCopy.length);
          selectedQuestions.push(poolCopy[randomIndex]);
          poolCopy.splice(randomIndex, 1); // Remove to avoid duplicates
        }

        // Translate coding questions if language is not English
        let translatedCodingQuestions = selectedQuestions;
        const codingLang = (requestedLang || "en").toLowerCase();
        if (codingLang !== "en" && selectedQuestions.length > 0) {
          try {
            const translationService = require("../services/translationService");

            // Extract text fields for translation
            const titles = selectedQuestions.map((q) => q.title || "");
            const questionTexts = selectedQuestions.map(
              (q) => q.questionText || ""
            );

            // Translate in batches
            const [translatedTitles, translatedTexts] = await Promise.all([
              translationService.translateArray(titles, codingLang),
              translationService.translateArray(questionTexts, codingLang),
            ]);

            // Reconstruct questions with translations
            translatedCodingQuestions = selectedQuestions.map((q, i) => ({
              ...q,
              title: translatedTitles[i] || q.title,
              questionText: translatedTexts[i] || q.questionText,
            }));

            Logger.info(
              `[createInterview] Translated ${selectedQuestions.length} coding questions to ${codingLang}`
            );
          } catch (transErr) {
            Logger.warn(
              `[createInterview] Coding question translation failed: ${transErr.message}`
            );
            // Continue with original English questions
          }
        }

        // Replace last N questions with coding questions to maintain total count
        // Remove the last N non-coding questions
        interview.questions.splice(-numToAdd, numToAdd);

        // Add the selected coding questions with professional formatting
        translatedCodingQuestions.forEach((q, idx) => {
          interview.questions.push({
            questionId: new mongoose.Types.ObjectId(),
            title: q.title || `Challenge #${idx + 1}`,
            questionText: q.questionText,
            category: "coding", // signals frontend to render coding UI
            type: "coding", // explicit type for future checks
            difficulty: codingDifficulty,
            timeAllocated:
              codingDifficulty === "beginner"
                ? 600
                : codingDifficulty === "intermediate"
                ? 900
                : 1200, // 10/15/20 min based on difficulty
            hasVideo: false,
            examples: q.examples,
            tags: q.tags || ["coding"],
            hints: q.hints,
          });
        });

        Logger.info(
          `[createInterview] Injected ${translatedCodingQuestions.length} coding question(s) for session (replaced last ${numToAdd} questions)`
        );
      } catch (injectErr) {
        Logger.warn(
          "[createInterview] Failed to inject coding questions:",
          injectErr
        );
      }
    }

    await interview.save();
    return created(res, interview, "Interview created successfully");
  } catch (error) {
    Logger.error("============================================");
    Logger.error("CREATE INTERVIEW ERROR:");
    Logger.error("Error name:", error.name);
    Logger.error("Error message:", error.message);
    Logger.error("Error stack:", error.stack);
    Logger.error("============================================");

    const meta = {};
    if (process.env.NODE_ENV !== "production") {
      meta.detail = error?.message;
      meta.errorName = error?.name;
      meta.stack = error?.stack?.split("\n").slice(0, 10).join("\n");
      meta.configReceived = req.body?.config || req.body;
      meta.userProfile = req.userProfile
        ? {
            id: req.userProfile._id,
            hasSubscription: !!req.userProfile.subscription,
            hasAnalytics: !!req.userProfile.analytics,
            subscriptionPlan: req.userProfile.subscription?.plan,
          }
        : null;
      meta.dbConnected = require("../config/database").isDbConnected?.();

      // If validation error, include validation details
      if (error.name === "ValidationError") {
        meta.validationErrors = Object.keys(error.errors || {}).reduce(
          (acc, key) => {
            acc[key] = error.errors[key].message;
            return acc;
          },
          {}
        );
      }
    }
    return fail(
      res,
      500,
      "INTERVIEW_CREATE_FAILED",
      "Failed to create interview",
      Object.keys(meta).length ? meta : undefined
    );
  }
};

// Start interview session
const startInterview = async (req, res) => {
  try {
    const userId = req.user?.id; // CHANGED
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId, // CHANGED from: userId: userId
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status !== "scheduled")
      return fail(res, 400, "INVALID_STATE", "Interview cannot be started");

    interview.status = "in-progress";
    if (!interview.timing) interview.timing = {};
    interview.timing.startedAt = new Date();

    // Initialize remaining time based on interview duration (minutes -> seconds)
    const durationMinutes =
      interview.config?.duration || interview.duration || 30;
    interview.timing.remainingSeconds = durationMinutes * 60;
    interview.timing.lastUpdated = new Date();

    await interview.save();

    await consumeFreeInterview(userId, interview._id.toString());

    return ok(res, interview, "Interview started successfully");
  } catch (error) {
    Logger.error("Start interview error:", error);
    return fail(res, 500, "START_FAILED", "Failed to start interview");
  }
};

// Submit answer to question
const submitAnswer = async (req, res) => {
  try {
    const userId = req.user?.id; // CHANGED
    const interviewId = req.params.interviewId || req.params.id;
    const { questionIndex } = req.params;
    const { answer, timeSpent, notes, facialMetrics, skip, code } = req.body;

    if (skip === true) {
      if (answer && answer.trim().length > 0) {
        return fail(
          res,
          400,
          "SKIP_WITH_ANSWER",
          "Provide either an answer or skip, not both."
        );
      }
    } else {
      if (typeof answer !== "string" || !answer.trim()) {
        return fail(
          res,
          400,
          "EMPTY_ANSWER",
          "Answer cannot be empty. Provide a response before submitting or use skip."
        );
      }
      if (answer.trim().length < 3) {
        return fail(
          res,
          400,
          "ANSWER_TOO_SHORT",
          "Answer is too short. Add more detail before submitting."
        );
      }
    }

    // CHANGED: userId → user
    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status !== "in-progress")
      return fail(res, 400, "INVALID_STATE", "Interview is not in progress");

    const qIndex = Number.parseInt(questionIndex, 10);
    if (Number.isNaN(qIndex) || qIndex < 0) {
      return fail(res, 400, "BAD_INDEX", "Question index missing or invalid");
    }
    if (qIndex >= interview.questions.length) {
      return fail(res, 400, "BAD_INDEX", "Question index out of range");
    }

    Logger.info("[submitAnswer] processing", {
      interviewId,
      userId,
      questionIndex: qIndex,
      isSkip: !!skip,
      answerLength: answer ? answer.length : 0,
      hasFacial: !!facialMetrics,
      status: interview.status,
    });

    if (skip === true) {
      interview.questions[qIndex].skipped = true;
      interview.questions[qIndex].skippedAt = new Date();
      interview.questions[qIndex].timeSpent = timeSpent || 0;
      if (code && typeof code === "object") {
        interview.questions[qIndex].code = {
          language: code.language,
          snippet: code.snippet || code.text || code.code || "",
          updatedAt: new Date(),
        };
      }
      await interview.save();
      return ok(
        res,
        { questionIndex: qIndex, skipped: true },
        "Question skipped"
      );
    } else {
      interview.questions[qIndex].response = {
        text: answer,
        notes: notes || "",
        submittedAt: new Date(),
      };
      interview.questions[qIndex].timeSpent = timeSpent || 0;
      if (facialMetrics && typeof facialMetrics === "object") {
        interview.questions[qIndex].facial = {
          eyeContact: facialMetrics.eyeContact,
          blinkRate: facialMetrics.blinkRate,
          smilePercentage: facialMetrics.smilePercentage,
          headSteadiness: facialMetrics.headSteadiness,
          offScreenPercentage: facialMetrics.offScreenPercentage,
          confidenceScore: facialMetrics.confidenceScore,
          capturedAt: new Date(),
        };
      }
    }

    // Use AI-powered evaluation with full context
    let evaluation;
    const questionObj = {
      text: interview.questions[qIndex].questionText,
      questionText: interview.questions[qIndex].questionText,
      category: interview.questions[qIndex].category,
      type: interview.questions[qIndex].type || "general",
      difficulty: interview.questions[qIndex].difficulty,
      tags: interview.questions[qIndex].tags || [],
    };
    const answerObj = {
      text: answer,
      answerText: answer,
    };

    // Prepare evaluation context with job role and interview details
    const evalConfig = {
      jobRole: interview.config.jobRole || "General",
      experienceLevel: interview.config.experienceLevel || "Intermediate",
      interviewType: interview.config.interviewType || "Technical",
      questionNumber: qIndex + 1,
      totalQuestions: interview.questions.length,
    };

    // Use AI evaluation with robust error handling
    let aiEval;
    try {
      Logger.info(`[submitAnswer] Starting AI evaluation for Q${qIndex + 1}`, {
        interviewId,
        questionIndex: qIndex,
        answerLength: answer.length,
        config: evalConfig,
      });

      aiEval = await evaluationService.evaluateAnswerWithAI(
        questionObj,
        answerObj,
        evalConfig
      );

      Logger.info(`[submitAnswer] AI evaluation completed for Q${qIndex + 1}`, {
        score: aiEval.score,
        method: aiEval.evaluation_method,
        hasFeedback: !!aiEval.feedback,
        feedbackLength: aiEval.feedback?.length || 0,
      });
    } catch (evalError) {
      Logger.error(`[submitAnswer] AI evaluation failed for Q${qIndex + 1}:`, {
        error: evalError.message,
        stack: evalError.stack,
        interviewId,
        questionIndex: qIndex,
      });

      // Fallback to basic evaluation if AI fails
      Logger.warn(
        `[submitAnswer] Using basic fallback evaluation for Q${qIndex + 1}`
      );
      aiEval = await evaluationService.basicEvaluation(questionObj, answerObj);
    }
    evaluation = {
      score: aiEval.score || 0,
      rubricScores: aiEval.rubricScores || {
        relevance: Math.ceil((aiEval.score / 100) * 5),
        clarity: Math.ceil((aiEval.score / 100) * 5),
        depth: Math.ceil((aiEval.score / 100) * 5),
        structure: Math.ceil((aiEval.score / 100) * 5),
      },
      breakdown: aiEval.breakdown || {},
      strengths: Array.isArray(aiEval.strengths) ? aiEval.strengths : [],
      improvements: Array.isArray(aiEval.improvements)
        ? aiEval.improvements
        : [],
      feedback: aiEval.feedback || aiEval.detailedFeedback || "",
      modelAnswer: aiEval.modelAnswer || "",
      evaluationMethod: aiEval.evaluation_method || "ai",
    };
    const language = (
      req.body.language ||
      req.query.language ||
      req.headers["x-language"] ||
      interview.config?.language ||
      "en"
    ).toLowerCase();
    if (language !== "en") {
      try {
        const translationService = require("../services/translationService");
        evaluation = await translationService.translateEvaluation(
          evaluation,
          language
        );
      } catch (err) {
        Logger.warn(
          `Evaluation translation failed (${language}): ${err.message}`
        );
      }
    }

    interview.questions[qIndex].score = {
      overall: evaluation.score,
      rubricScores: evaluation.rubricScores || {},
      breakdown: evaluation.breakdown || {},
    };
    interview.questions[qIndex].feedback = {
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      suggestions: evaluation.feedback || "",
      modelAnswer: evaluation.modelAnswer || "",
    };

    // Enqueue AI evaluation job for background processing
    try {
      const aiEvaluationQueue = require("../services/queue/aiEvaluationQueue");
      aiEvaluationQueue.enqueue({
        interviewId: interview._id.toString(),
        questionIndex: qIndex,
      });
    } catch (err) {
      Logger.warn("Failed to enqueue AI evaluation job:", err.message);
    }

    if (interview.config.adaptiveDifficulty?.enabled) {
      const currentDifficulty =
        interview.questions[qIndex].difficulty || interview.config.difficulty;

      if (!interview.config.adaptiveDifficulty.difficultyHistory) {
        interview.config.adaptiveDifficulty.difficultyHistory = [];
      }

      const existingEntryIndex =
        interview.config.adaptiveDifficulty.difficultyHistory.findIndex(
          (entry) => entry.questionIndex === qIndex
        );

      const historyEntry = {
        questionIndex: qIndex,
        difficulty: currentDifficulty,
        score: evaluation.score || 0,
        timestamp: new Date(),
      };

      if (existingEntryIndex >= 0) {
        interview.config.adaptiveDifficulty.difficultyHistory[
          existingEntryIndex
        ] = historyEntry;
      } else {
        interview.config.adaptiveDifficulty.difficultyHistory.push(
          historyEntry
        );
      }
    }

    // Update remaining time based on elapsed time since last update
    if (interview.timing && interview.timing.remainingSeconds != null) {
      const now = new Date();
      const lastUpdated =
        interview.timing.lastUpdated || interview.timing.startedAt;
      if (lastUpdated) {
        const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);
        interview.timing.remainingSeconds = Math.max(
          0,
          interview.timing.remainingSeconds - elapsedSeconds
        );
        interview.timing.lastUpdated = now;

        // Auto-complete if time has run out
        if (interview.timing.remainingSeconds <= 0) {
          interview.status = "completed";
          interview.timing.completedAt = now;
          interview.timing.totalDuration = Math.round(
            (now - interview.timing.startedAt) / 1000
          );
          // Update analytics when auto-completing
          await interview.save();
          await updateUserAnalytics(userId);
        }
      }
    }

    await interview.save();

    let followUpQuestions = null;
    try {
      Logger.info("Generating follow-up questions for question:", qIndex);
      followUpQuestions = await aiQuestionService.generateFollowUp(
        interview.questions[qIndex].questionText,
        answer,
        interview.config
      );

      if (followUpQuestions && followUpQuestions.length > 0) {
        interview.questions[qIndex].followUpQuestions = followUpQuestions;
        await interview.save();
        Logger.info(
          "Follow-up questions generated and saved:",
          followUpQuestions.length
        );
      }
    } catch (error) {
      Logger.warn("Follow-up generation failed:", error);
    }

    const responseData = {
      questionIndex: qIndex,
      score: interview.questions[qIndex].score?.overall || evaluation.score,
      followUpQuestions,
      evaluation: {
        score: interview.questions[qIndex].score?.overall || evaluation.score,
        rubricScores:
          interview.questions[qIndex].score?.rubricScores ||
          evaluation.rubicScores ||
          evaluation.rubricScores ||
          {},
        breakdown:
          interview.questions[qIndex].score?.breakdown ||
          evaluation.breakdown ||
          {},
        strengths:
          interview.questions[qIndex].feedback?.strengths ||
          evaluation.strengths ||
          [],
        improvements:
          interview.questions[qIndex].feedback?.improvements ||
          evaluation.improvements ||
          [],
        feedback:
          interview.questions[qIndex].feedback?.suggestions ||
          evaluation.feedback ||
          "",
        modelAnswer:
          interview.questions[qIndex].feedback?.modelAnswer ||
          evaluation.modelAnswer ||
          "",
      },
    };

    if (interview.config.adaptiveDifficulty?.enabled) {
      const nextDifficulty = getNextDifficultyLevel(
        responseData.score,
        interview.questions[qIndex].difficulty || interview.config.difficulty
      );
      responseData.adaptiveInfo = {
        currentDifficulty:
          interview.questions[qIndex].difficulty || interview.config.difficulty,
        suggestedNextDifficulty: nextDifficulty,
        difficultyWillChange:
          nextDifficulty !==
          (interview.questions[qIndex].difficulty ||
            interview.config.difficulty),
        scoreBasedRecommendation:
          responseData.score < C.SCORE_EASIER_DOWN_THRESHOLD
            ? "easier"
            : responseData.score >= C.SCORE_HARDER_UP_THRESHOLD
            ? "harder"
            : "same",
      };
    }

    return ok(res, responseData, "Answer submitted successfully");
  } catch (error) {
    Logger.error("[submitAnswer] Fatal error:", {
      error: error.message,
      stack: error.stack,
      interviewId,
      questionIndex: qIndex,
      phase: "unknown",
    });
    return fail(
      res,
      500,
      "ANSWER_SUBMIT_FAILED",
      `Failed to submit answer: ${error.message}`
    );
  }
};

// Generate follow-up question based on answer
const generateFollowUp = async (req, res) => {
  try {
    const userId = req.user?.id; // CHANGED
    const interviewId = req.params.interviewId || req.params.id;
    const { questionIndex } = req.params;

    // CHANGED: userId → user
    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    const qIndex = parseInt(questionIndex);
    if (qIndex >= interview.questions.length)
      return fail(res, 400, "BAD_INDEX", "Invalid question index");

    const question = interview.questions[qIndex];
    if (!question.response || !question.response.text)
      return fail(
        res,
        400,
        "NO_ANSWER",
        "No answer provided for this question"
      );

    if (question.followUpQuestions && question.followUpQuestions.length > 0) {
      return ok(
        res,
        {
          followUpQuestions: question.followUpQuestions,
          originalQuestion: question.questionText,
          originalAnswer: question.response.text,
        },
        "Follow-up questions retrieved"
      );
    }

    try {
      Logger.info("Generating AI follow-up questions for question:", qIndex);
      const followUpQuestions = await aiQuestionService.generateFollowUp(
        question.questionText,
        question.response.text,
        interview.config
      );

      if (followUpQuestions && followUpQuestions.length > 0) {
        interview.questions[qIndex].followUpQuestions = followUpQuestions;
        await interview.save();
      }

      return ok(
        res,
        {
          followUpQuestions: followUpQuestions || [],
          originalQuestion: question.questionText,
          originalAnswer: question.response.text,
        },
        "Follow-up questions generated"
      );
    } catch (error) {
      Logger.warn("AI follow-up generation failed:", error);
      return fail(
        res,
        500,
        "FOLLOWUP_GEN_FAILED",
        "Failed to generate follow-up questions",
        {
          fallback: [
            {
              text: "Can you elaborate more on your approach and explain any alternative solutions?",
              type: "clarification",
            },
          ],
        }
      );
    }
  } catch (error) {
    Logger.error("Generate follow-up error:", error);
    return fail(res, 500, "FOLLOWUP_ERROR", "Failed to generate follow-up");
  }
};

// Get interview status
const getStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    return ok(res, interview, "Interview status retrieved");
  } catch (error) {
    Logger.error("Get interview status error:", error);
    return fail(
      res,
      500,
      "STATUS_FETCH_FAILED",
      "Failed to fetch interview status"
    );
  }
};

// Resume interview session
const resumeInterview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status !== "paused")
      return fail(res, 400, "INVALID_STATE", "Interview is not paused");

    interview.status = "in-progress";
    interview.timing.resumedAt = new Date();

    await interview.save();

    return ok(res, interview, "Interview resumed successfully");
  } catch (error) {
    Logger.error("Resume interview error:", error);
    return fail(res, 500, "RESUME_FAILED", "Failed to resume interview");
  }
};

// End interview session
const endInterview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status === "completed")
      return fail(res, 400, "INVALID_STATE", "Interview already completed");

    interview.status = "completed";
    interview.timing.endedAt = new Date();

    await interview.save();

    // Update user analytics after ending interview
    await updateUserAnalytics(userId);

    return ok(res, interview, "Interview ended successfully");
  } catch (error) {
    Logger.error("End interview error:", error);
    return fail(res, 500, "END_FAILED", "Failed to end interview");
  }
};

// Delete interview session
const deleteInterview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    // Clean up associated video files from Cloudinary
    try {
      await destroyByPrefix(`interviews/${interviewId}`);
    } catch (cleanupError) {
      Logger.warn("Failed to cleanup video files:", cleanupError);
      // Continue with deletion even if cleanup fails
    }

    await interview.deleteOne();

    return ok(res, null, "Interview deleted successfully");
  } catch (error) {
    Logger.error("Delete interview error:", error);
    return fail(res, 500, "DELETE_FAILED", "Failed to delete interview");
  }
};

// Get all user interviews (optimized for list view)
const getUserInterviews = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * perPage;
    const sortField = ["createdAt", "updatedAt", "status"].includes(sortBy)
      ? sortBy
      : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const filter = { user: userId };
    if (status) filter.status = status;

    // Minimal fields for list view to avoid large payloads and timeouts
    const projection =
      "config.jobRole config.interviewType status createdAt timing.completedAt results.overallScore";

    const [interviews, total] = await Promise.all([
      Interview.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(perPage)
        .select(projection)
        .lean()
        .maxTimeMS(10000),
      Interview.countDocuments(filter),
    ]);

    return ok(res, {
      interviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / perPage),
        total,
        hasNextPage: pageNum < Math.ceil(total / perPage),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    Logger.error("Get user interviews error:", error);
    return fail(res, 500, "FETCH_FAILED", "Failed to fetch interviews");
  }
};

// Get interview details
const getInterviewDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    }).populate("userProfile");

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    // Fallback translation: if interview language != en and questions appear un-translated (basic Latin only), translate now.
    const targetLang = (interview.config?.language || "en").toLowerCase();
    if (targetLang !== "en") {
      try {
        const needsTranslation = interview.questions.some((q) => {
          const qt = q.questionText || "";
          // Urdu script regex; if absent and contains common English words, consider un-translated
          const hasUrdu = /[\u0621-\u064A]/.test(qt);
          const hasEnglishWords =
            /\b(describe|explain|provide|time|team|member|challenge|write|function|implement|create)\b/i.test(
              qt
            );
          return !hasUrdu && hasEnglishWords;
        });

        if (needsTranslation) {
          const translationService = require("../services/translationService");
          const originalSample = (
            interview.questions[0]?.questionText || ""
          ).substring(0, 80);
          Logger.info(
            `[getInterviewDetails] 🔄 Detected un-translated questions for lang=${targetLang}. Applying fallback translation. Sample before: "${originalSample}"`
          );
          const translated = await translationService.translateQuestions(
            interview.questions.map((q) => ({
              text: q.questionText || q.text,
              questionText: q.questionText || q.text,
              evaluationCriteria: q.feedback?.evaluationCriteria || "",
              hints: [],
            })),
            targetLang
          );
          translated.forEach((tq, idx) => {
            interview.questions[idx].questionText = tq.questionText || tq.text;
          });
          const afterSample = (
            interview.questions[0]?.questionText || ""
          ).substring(0, 80);
          Logger.info(
            `[getInterviewDetails] ✅ Fallback translation complete. Sample after: "${afterSample}"`
          );

          // Save translated questions to database
          try {
            await interview.save();
            Logger.info(
              `[getInterviewDetails] Saved translated questions to database`
            );
          } catch (saveErr) {
            Logger.warn(
              `[getInterviewDetails] Failed to save translated questions: ${saveErr.message}`
            );
          }
        } else {
          Logger.debug(
            `[getInterviewDetails] Questions already appear translated for ${targetLang}`
          );
        }
      } catch (fallbackErr) {
        Logger.error(
          `[getInterviewDetails] ❌ Fallback translation failed: ${fallbackErr.message}`,
          fallbackErr.stack
        );
      }
    }

    // Calculate current remaining time if interview is in-progress
    if (interview.status === "in-progress" && interview.timing) {
      const now = new Date();
      const lastUpdated =
        interview.timing.lastUpdated || interview.timing.startedAt;
      const elapsedSinceUpdate = Math.floor((now - lastUpdated) / 1000);
      const currentRemaining = Math.max(
        0,
        (interview.timing.remainingSeconds || 0) - elapsedSinceUpdate
      );

      // Update the interview object (not saving to DB yet, just for response)
      interview.timing.remainingSeconds = currentRemaining;
      interview.timing.lastUpdated = now;

      // Auto-complete if time has run out
      if (currentRemaining <= 0 && interview.status === "in-progress") {
        interview.status = "completed";
        interview.timing.completedAt = now;
        interview.timing.totalDuration = Math.round(
          (now - interview.timing.startedAt) / 1000
        );
        await interview.save();
        // Update analytics when auto-completing
        await updateUserAnalytics(userId);
      }
    }

    return ok(res, interview, "Interview details retrieved");
  } catch (error) {
    Logger.error("Get interview details error:", error);
    return fail(res, 500, "FETCH_FAILED", "Failed to fetch interview details");
  }
};

// Complete interview
const completeInterview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;
    let { transcript, facialMetrics, emotionTimeline } = req.body;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) {
      Logger.error("[completeInterview] Interview not found", { interviewId });
      return fail(res, 404, "NOT_FOUND", "Interview not found");
    }
    if (interview.status === "completed") {
      Logger.warn("[completeInterview] Interview already completed", {
        interviewId,
      });
      return fail(res, 400, "ALREADY_COMPLETED", "Interview already completed");
    }

    try {
      interview.status = "completed";
      if (!interview.timing) interview.timing = {};
      const completedTime = new Date();
      interview.timing.completedAt = completedTime;
      // CRITICAL: Also set completedAt at root level for dashboard queries
      interview.completedAt = completedTime;
      interview.timing.totalDuration = Math.round(
        (interview.timing.completedAt - interview.timing.startedAt) / 1000
      );

      // Defensive: ensure facialMetrics is an array if present
      if (facialMetrics && Array.isArray(facialMetrics)) {
        Logger.info(
          `[completeInterview] Facial metrics array length: ${facialMetrics.length}`
        );
        if (facialMetrics.length > 100) {
          const summary = {
            count: facialMetrics.length,
            averages: {
              eyeContact:
                facialMetrics.reduce((sum, m) => sum + (m.eyeContact || 0), 0) /
                facialMetrics.length,
              smilePercentage:
                facialMetrics.reduce(
                  (sum, m) => sum + (m.smilePercentage || 0),
                  0
                ) / facialMetrics.length,
              headSteadiness:
                facialMetrics.reduce(
                  (sum, m) => sum + (m.headSteadiness || 0),
                  0
                ) / facialMetrics.length,
              confidenceScore:
                facialMetrics.reduce(
                  (sum, m) => sum + (m.confidenceScore || 0),
                  0
                ) / facialMetrics.length,
            },
            firstTimestamp: facialMetrics[0]?.timestamp,
            lastTimestamp: facialMetrics[facialMetrics.length - 1]?.timestamp,
          };
          facialMetrics = summary;
          Logger.info(`[completeInterview] Trimmed facial metrics to summary`);
        }
      }

      // Trim transcript if too long (keep first 50000 chars)
      if (
        transcript &&
        typeof transcript === "string" &&
        transcript.length > 50000
      ) {
        Logger.info(
          `[completeInterview] Trimming transcript from ${transcript.length} to 50000 chars`
        );
        transcript = transcript.substring(0, 50000) + "... (truncated)";
      }

      // Derive emotion analytics (raw & smoothed) if timeline provided
      let emotionAnalytics = undefined;
      if (Array.isArray(emotionTimeline) && emotionTimeline.length > 0) {
        const rawAccum = {};
        const smoothAccum = {};
        let frameCount = 0;
        emotionTimeline.forEach((e) => {
          const raw = e.rawEmotions || e.raw_emotions || null;
          const smoothed = e.emotions || null;
          if (raw && typeof raw === "object") {
            Object.entries(raw).forEach(([k, v]) => {
              if (typeof v === "number") {
                rawAccum[k] = (rawAccum[k] || 0) + v;
              }
            });
          }
          if (smoothed && typeof smoothed === "object") {
            Object.entries(smoothed).forEach(([k, v]) => {
              if (typeof v === "number") {
                smoothAccum[k] = (smoothAccum[k] || 0) + v;
              }
            });
          }
          frameCount += 1;
        });
        const rawAverages = {};
        const smoothAverages = {};
        if (frameCount > 0) {
          Object.entries(rawAccum).forEach(([k, v]) => {
            rawAverages[k] = +(v / frameCount).toFixed(4);
          });
          Object.entries(smoothAccum).forEach(([k, v]) => {
            smoothAverages[k] = +(v / frameCount).toFixed(4);
          });
        }
        emotionAnalytics = {
          frameCount,
          rawAverages,
          smoothAverages,
          dominantSmoothed: Object.keys(smoothAverages).reduce(
            (best, key) =>
              smoothAverages[key] > (smoothAverages[best] || 0) ? key : best,
            "neutral"
          ),
        };
      }

      // Store session enrichment data if provided
      if (
        (transcript && typeof transcript === "string") ||
        facialMetrics ||
        emotionTimeline
      ) {
        interview.sessionEnrichment = {
          transcript: transcript || undefined,
          facialMetrics: facialMetrics || undefined,
          emotionTimeline: emotionTimeline || undefined,
          emotionAnalytics: emotionAnalytics || undefined,
          enrichedAt: new Date(),
        };
      }
    } catch (err) {
      Logger.error("[completeInterview] Data processing error", {
        error: err.message,
        stack: err.stack,
      });
      return fail(
        res,
        400,
        "COMPLETE_DATA_ERROR",
        err.message || "Invalid data"
      );
    }

    // Calculate overall results
    const answeredQuestions = interview.questions.filter(
      (q) => q.response?.text || q.skipped
    );
    const totalQuestions = interview.questions.length;
    const completionRate = (answeredQuestions.length / totalQuestions) * 100;

    // Calculate average score from questions that have scores
    const scores = interview.questions
      .filter((q) => q.score?.overall != null)
      .map((q) => q.score.overall);
    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Calculate breakdown by category/type
    // Questions can have category as job role (e.g., "Software Engineer") or type field
    // We need to normalize and group properly
    const categoryScores = {};

    // Normalize categories to standard ones
    const normalizeCategory = (q) => {
      const cat = (q.category || "").toLowerCase();
      const type = (q.type || "").toLowerCase();

      // Check for coding questions
      if (cat === "coding" || type === "coding") return "technical";

      // Check type field first (more specific)
      if (type === "behavioral") return "behavioral";
      if (type === "technical") return "technical";
      if (type === "system-design") return "problemSolving";

      // Check category field for keywords
      if (cat.includes("communication")) return "communication";
      if (cat.includes("behavioral") || cat.includes("behavior"))
        return "behavioral";
      if (cat.includes("technical") || cat.includes("tech")) return "technical";
      if (
        cat.includes("system") ||
        cat.includes("design") ||
        cat.includes("problem")
      )
        return "problemSolving";

      // Default to technical for unrecognized categories
      return "technical";
    };

    // Group questions by normalized category and calculate averages
    interview.questions.forEach((q) => {
      if (q.score?.overall != null) {
        const normalizedCat = normalizeCategory(q);
        if (!categoryScores[normalizedCat]) {
          categoryScores[normalizedCat] = { sum: 0, count: 0 };
        }
        categoryScores[normalizedCat].sum += q.score.overall;
        categoryScores[normalizedCat].count += 1;
      }
    });

    interview.results = {
      overallScore: Math.round(averageScore),
      completionRate: Math.round(completionRate),
      questionsAnswered: answeredQuestions.length,
      questionsSkipped: interview.questions.filter((q) => q.skipped).length,
      totalQuestions,
      breakdown: {
        technical: categoryScores.technical
          ? Math.round(
              categoryScores.technical.sum / categoryScores.technical.count
            )
          : 0,
        communication: categoryScores.communication
          ? Math.round(
              categoryScores.communication.sum /
                categoryScores.communication.count
            )
          : 0,
        problemSolving: categoryScores.problemSolving
          ? Math.round(
              categoryScores.problemSolving.sum /
                categoryScores.problemSolving.count
            )
          : 0,
        behavioral: categoryScores.behavioral
          ? Math.round(
              categoryScores.behavioral.sum / categoryScores.behavioral.count
            )
          : 0,
      },
    };

    await interview.save();

    // Update user analytics after completing interview
    await updateUserAnalytics(interview.user);

    return ok(res, interview, "Interview completed successfully");
  } catch (error) {
    Logger.error("Complete interview error:", error);
    return fail(res, 500, "COMPLETE_FAILED", "Failed to complete interview");
  }
};

// Get adaptive question
const getAdaptiveQuestion = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (!interview.config.adaptiveDifficulty?.enabled)
      return fail(res, 400, "NOT_ADAPTIVE", "Interview is not adaptive");

    // Determine next difficulty based on history
    const history = interview.config.adaptiveDifficulty.difficultyHistory || [];
    const currentDifficulty =
      interview.config.adaptiveDifficulty.currentDifficulty;

    let nextDifficulty = currentDifficulty;
    if (history.length > 0) {
      const recentScores = history.slice(-3).map((h) => h.score);
      const avgRecentScore =
        recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      nextDifficulty = getNextDifficultyLevel(
        avgRecentScore,
        currentDifficulty
      );
    }

    // Generate new question with appropriate difficulty
    const questionConfig = {
      ...interview.config,
      difficulty: nextDifficulty,
      count: 1,
    };

    const newQuestions = await hybridQuestionService.generateQuestions(
      questionConfig,
      userId
    );

    if (!newQuestions.success || newQuestions.questions.length === 0) {
      return fail(
        res,
        500,
        "GENERATION_FAILED",
        "Failed to generate adaptive question"
      );
    }

    const newQuestion = newQuestions.questions[0];

    interview.questions.push({
      questionId: newQuestion._id,
      questionText: newQuestion.text,
      category: newQuestion.category,
      difficulty: nextDifficulty,
      timeAllocated: newQuestion.estimatedTime || 120,
      hasVideo: false,
    });

    interview.config.adaptiveDifficulty.currentDifficulty = nextDifficulty;
    await interview.save();

    return ok(
      res,
      {
        question: newQuestion,
        questionIndex: interview.questions.length - 1,
        difficulty: nextDifficulty,
        previousDifficulty: currentDifficulty,
      },
      "Adaptive question generated"
    );
  } catch (error) {
    Logger.error("Get adaptive question error:", error);
    return fail(res, 500, "ADAPTIVE_FAILED", "Failed to get adaptive question");
  }
};

// Get interview results
const getInterviewResults = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status !== "completed")
      return fail(res, 400, "NOT_COMPLETED", "Interview not completed");

    // Generate recommendations based on performance
    const generateRecommendations = (results, questions) => {
      const recommendations = [];
      const overallScore = results?.overallScore || 0;
      const breakdown = results?.breakdown || {};

      // Overall performance recommendation
      if (overallScore < 60) {
        recommendations.push(
          "Focus on fundamentals - review core concepts in your field"
        );
      } else if (overallScore < 80) {
        recommendations.push(
          "Good foundation - practice more complex scenarios to improve"
        );
      } else {
        recommendations.push(
          "Excellent performance - maintain this level of preparation"
        );
      }

      // Category-specific recommendations
      if (breakdown.technical < 70) {
        recommendations.push(
          "Strengthen technical knowledge - review algorithms, data structures, and system design"
        );
      }
      if (breakdown.communication < 70) {
        recommendations.push(
          "Work on communication skills - practice explaining complex concepts clearly"
        );
      }
      if (breakdown.problemSolving < 70) {
        recommendations.push(
          "Enhance problem-solving abilities - practice breaking down complex problems"
        );
      }

      // Time management
      const avgTimeSpent =
        questions
          .filter((q) => q.timeSpent)
          .reduce((sum, q) => sum + q.timeSpent, 0) /
          questions.filter((q) => q.timeSpent).length || 0;
      const avgTimeAlloc =
        questions
          .filter((q) => q.timeAllocated)
          .reduce((sum, q) => sum + q.timeAllocated, 0) /
          questions.filter((q) => q.timeAllocated).length || 0;
      if (avgTimeSpent > avgTimeAlloc * 1.2) {
        recommendations.push(
          "Improve time management - practice answering questions within time constraints"
        );
      }

      return recommendations;
    };

    // Generate focus areas based on weak points
    const generateFocusAreas = (results, _questions) => {
      const focusAreas = [];
      const breakdown = results?.breakdown || {};

      const categories = [
        { key: "technical", label: "Technical Skills" },
        { key: "communication", label: "Communication" },
        { key: "problemSolving", label: "Problem Solving" },
        { key: "behavioral", label: "Behavioral Skills" },
      ];

      categories.forEach((cat) => {
        const score = breakdown[cat.key] || 0;
        if (score > 0) {
          // Only include categories that were tested
          focusAreas.push({
            skill: cat.label,
            currentLevel:
              score >= 80 ? "Strong" : score >= 60 ? "Moderate" : "Needs Work",
            priority: score < 60 ? "high" : score < 80 ? "medium" : "low",
          });
        }
      });

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return focusAreas.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    };

    // Collect all strengths and improvements from questions
    const collectFeedback = (questions) => {
      const allStrengths = [];
      const allImprovements = [];

      questions.forEach((q) => {
        if (q.feedback?.strengths) {
          allStrengths.push(...q.feedback.strengths);
        }
        if (q.feedback?.improvements) {
          allImprovements.push(...q.feedback.improvements);
        }
      });

      // Remove duplicates and limit to top items
      return {
        strengths: [...new Set(allStrengths)].slice(0, 5),
        improvements: [...new Set(allImprovements)].slice(0, 5),
      };
    };

    const collectedFeedback = collectFeedback(interview.questions);
    const recommendations = generateRecommendations(
      interview.results,
      interview.questions
    );
    const focusAreas = generateFocusAreas(
      interview.results,
      interview.questions
    );

    // Transform data to match frontend expectations
    // Frontend expects: { interview, analysis }
    // Generate advanced feedback (non-blocking style handled with try/catch)
    let advancedFeedback = null;
    try {
      advancedFeedback = await advancedFeedbackService.generateAdvancedFeedback(
        interview
      );
    } catch (err) {
      Logger.warn("Advanced feedback generation failed:", err?.message || err);
      advancedFeedback = null;
    }

    // Generate comprehensive advanced analysis
    let advancedAnalysis = null;
    try {
      const advancedAnalysisService = require("../services/advancedAnalysisService");
      const userProfile = await require("../models/UserProfile").findOne({
        user: userId,
      });
      advancedAnalysis =
        await advancedAnalysisService.generateComprehensiveAnalysis(
          interview,
          userProfile
        );
    } catch (err) {
      Logger.warn("Advanced analysis generation failed:", err?.message || err);
      advancedAnalysis = null;
    }

    const response = {
      interview: {
        _id: interview._id,
        jobRole: interview.config?.jobRole,
        interviewType: interview.config?.interviewType,
        experienceLevel: interview.config?.experienceLevel,
        difficulty: interview.config?.difficulty,
        language: interview.config?.language || "en",
        status: interview.status,
        config: interview.config,
        timing: interview.timing,
        // Add duration and completedAt at root level for backward compatibility
        duration: interview.timing?.totalDuration || 0,
        completedAt: interview.timing?.completedAt,
        sessionEnrichment: interview.sessionEnrichment,
        // Map questions with all necessary data
        questions: interview.questions.map((q) => ({
          questionText: q.questionText,
          category: q.category,
          type: q.type,
          difficulty: q.difficulty,
          response: q.response,
          score: q.score,
          feedback: q.feedback,
          timeSpent: q.timeSpent,
          timeAllocated: q.timeAllocated,
          skipped: q.skipped,
          followUpQuestions: q.followUpQuestions,
        })),
      },
      analysis: {
        // Map results to analysis format
        overallScore: interview.results?.overallScore || 0,
        technicalScore: interview.results?.breakdown?.technical || 0,
        communicationScore: interview.results?.breakdown?.communication || 0,
        problemSolvingScore: interview.results?.breakdown?.problemSolving || 0,
        behavioralScore: interview.results?.breakdown?.behavioral || 0,
        completionRate: interview.results?.completionRate || 0,
        // Additional metrics
        totalQuestions:
          interview.results?.totalQuestions || interview.questions.length,
        questionsAnswered: interview.results?.questionsAnswered || 0,
        questionsSkipped: interview.results?.questionsSkipped || 0,
        // Feedback and recommendations
        feedback: {
          summary: interview.results?.feedback?.summary || "",
          strengths: collectedFeedback.strengths,
          improvements: collectedFeedback.improvements,
          recommendations: interview.results?.feedback?.recommendations || [],
        },
        recommendations,
        focusAreas,
        // Question-by-question analysis for the UI
        questionAnalysis: interview.questions.map((q, idx) => ({
          questionNumber: idx + 1,
          question: q.questionText,
          type: q.type || q.category || "general",
          category: q.category,
          difficulty: q.difficulty,
          userAnswer: q.response?.text || "",
          userNotes: q.response?.notes || "",
          score: q.score || { overall: 0, rubricScores: {} },
          timeSpent: q.timeSpent || 0,
          timeAllocated: q.timeAllocated || 0,
          skipped: q.skipped || false,
          feedback: q.feedback || {
            strengths: [],
            improvements: [],
            suggestions: "",
          },
        })),
      },
      advancedFeedback,
      advancedAnalysis,
    };

    // Translate results if language is not English
    const resultsLang = (interview.config?.language || "en").toLowerCase();
    if (resultsLang !== "en") {
      try {
        const translationService = require("../services/translationService");

        // Translate question texts in the interview
        Logger.info(
          `[getInterviewResults] Translating ${response.interview.questions.length} question texts to ${resultsLang}`
        );
        const questionTexts = response.interview.questions.map(
          (q) => q.questionText || ""
        );
        const translatedQuestionTexts = await translationService.translateArray(
          questionTexts,
          resultsLang
        );
        response.interview.questions.forEach((q, i) => {
          q.questionText = translatedQuestionTexts[i] || q.questionText;
        });

        // Also translate in questionAnalysis
        const analysisQuestionTexts = response.analysis.questionAnalysis.map(
          (qa) => qa.question || ""
        );
        const translatedAnalysisTexts = await translationService.translateArray(
          analysisQuestionTexts,
          resultsLang
        );
        response.analysis.questionAnalysis.forEach((qa, i) => {
          qa.question = translatedAnalysisTexts[i] || qa.question;
        });

        // Translate recommendations
        if (response.analysis.recommendations.length > 0) {
          response.analysis.recommendations =
            await translationService.translateArray(
              response.analysis.recommendations,
              resultsLang
            );
        }

        // Translate feedback summary, strengths, improvements
        if (response.analysis.feedback.summary) {
          response.analysis.feedback.summary =
            await translationService.translateText(
              response.analysis.feedback.summary,
              resultsLang
            );
        }
        if (response.analysis.feedback.strengths.length > 0) {
          response.analysis.feedback.strengths =
            await translationService.translateArray(
              response.analysis.feedback.strengths,
              resultsLang
            );
        }
        if (response.analysis.feedback.improvements.length > 0) {
          response.analysis.feedback.improvements =
            await translationService.translateArray(
              response.analysis.feedback.improvements,
              resultsLang
            );
        }
        if (response.analysis.feedback.recommendations.length > 0) {
          response.analysis.feedback.recommendations =
            await translationService.translateArray(
              response.analysis.feedback.recommendations,
              resultsLang
            );
        }

        // Translate focus areas
        if (response.analysis.focusAreas.length > 0) {
          const skillNames = response.analysis.focusAreas.map((fa) => fa.skill);
          const currentLevels = response.analysis.focusAreas.map(
            (fa) => fa.currentLevel
          );
          const [translatedSkills, translatedLevels] = await Promise.all([
            translationService.translateArray(skillNames, resultsLang),
            translationService.translateArray(currentLevels, resultsLang),
          ]);
          response.analysis.focusAreas.forEach((fa, i) => {
            fa.skill = translatedSkills[i] || fa.skill;
            fa.currentLevel = translatedLevels[i] || fa.currentLevel;
          });
        }

        // Translate question feedback
        for (const qa of response.analysis.questionAnalysis) {
          if (qa.feedback.strengths.length > 0) {
            qa.feedback.strengths = await translationService.translateArray(
              qa.feedback.strengths,
              resultsLang
            );
          }
          if (qa.feedback.improvements.length > 0) {
            qa.feedback.improvements = await translationService.translateArray(
              qa.feedback.improvements,
              resultsLang
            );
          }
          if (qa.feedback.suggestions) {
            qa.feedback.suggestions = await translationService.translateText(
              qa.feedback.suggestions,
              resultsLang
            );
          }
        }

        // Translate advanced feedback if present
        if (advancedFeedback) {
          if (advancedFeedback.strengths?.length > 0) {
            advancedFeedback.strengths =
              await translationService.translateArray(
                advancedFeedback.strengths,
                resultsLang
              );
          }
          if (advancedFeedback.improvements?.length > 0) {
            advancedFeedback.improvements =
              await translationService.translateArray(
                advancedFeedback.improvements,
                resultsLang
              );
          }
          if (advancedFeedback.detailedAnalysis) {
            advancedFeedback.detailedAnalysis =
              await translationService.translateText(
                advancedFeedback.detailedAnalysis,
                resultsLang
              );
          }
        }

        Logger.info(
          `[getInterviewResults] Translated results to ${resultsLang}`
        );
      } catch (transErr) {
        Logger.warn(
          `[getInterviewResults] Results translation failed: ${transErr.message}`
        );
        // Continue with original English results
      }
    }

    return ok(res, response, "Interview results retrieved");
  } catch (error) {
    Logger.error("Get interview results error:", error);
    return fail(res, 500, "RESULTS_FAILED", "Failed to fetch results");
  }
};

// Mark follow-ups as reviewed
const markFollowUpsReviewed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;
    const { questionIndex } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    const qIndex = parseInt(questionIndex);
    if (qIndex >= interview.questions.length)
      return fail(res, 400, "BAD_INDEX", "Invalid question index");

    interview.questions[qIndex].followUpsReviewed = true;
    interview.questions[qIndex].followUpsReviewedAt = new Date();

    await interview.save();

    return ok(res, null, "Follow-ups marked as reviewed");
  } catch (error) {
    Logger.error("Mark follow-ups reviewed error:", error);
    return fail(res, 500, "MARK_FAILED", "Failed to mark follow-ups");
  }
};

// Get interview transcripts
const getInterviewTranscripts = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    const transcripts = interview.questions.map((q, index) => ({
      questionIndex: index,
      questionText: q.questionText,
      response: q.response?.text || null,
      transcript: q.video?.transcript || null,
      submittedAt: q.response?.submittedAt,
    }));

    return ok(res, { transcripts }, "Transcripts retrieved");
  } catch (error) {
    Logger.error("Get transcripts error:", error);
    return fail(res, 500, "TRANSCRIPTS_FAILED", "Failed to fetch transcripts");
  }
};

// Update adaptive difficulty
const updateAdaptiveDifficulty = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;
    const { difficulty } = req.body;

    if (!["easy", "intermediate", "hard", "expert"].includes(difficulty)) {
      return fail(res, 400, "INVALID_DIFFICULTY", "Invalid difficulty level");
    }

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (!interview.config.adaptiveDifficulty?.enabled)
      return fail(res, 400, "NOT_ADAPTIVE", "Interview is not adaptive");

    interview.config.adaptiveDifficulty.currentDifficulty = difficulty;
    await interview.save();

    return ok(res, { difficulty }, "Difficulty updated");
  } catch (error) {
    Logger.error("Update adaptive difficulty error:", error);
    return fail(res, 500, "UPDATE_FAILED", "Failed to update difficulty");
  }
};

// Export interview metrics
const exportInterviewMetrics = async (req, res) => {
  try {
    const userId = req.user?.id;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    // Generate CSV
    const csvRows = [
      [
        "Question Index",
        "Category",
        "Difficulty",
        "Score",
        "Time Spent",
        "Skipped",
      ],
    ];

    interview.questions.forEach((q, index) => {
      csvRows.push([
        index,
        q.category,
        q.difficulty,
        q.score?.overall || "N/A",
        q.timeSpent || 0,
        q.skipped ? "Yes" : "No",
      ]);
    });

    const csv = csvRows.map((row) => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="interview-${interviewId}-metrics.csv"`
    );
    return res.send(csv);
  } catch (error) {
    Logger.error("Export metrics error:", error);
    return fail(res, 500, "EXPORT_FAILED", "Failed to export metrics");
  }
};

// Helper function to get questions for interview
async function getQuestionsForInterview(config, userProfile) {
  try {
    Logger.info(
      "[getQuestionsForInterview] Generating questions with config:",
      config
    );

    const questionConfig = {
      jobRole: config.jobRole,
      experienceLevel: config.experienceLevel,
      interviewType: config.interviewType,
      difficulty: config.difficulty || "intermediate",
      count: config.questionCount || C.DEFAULT_QUESTION_COUNT,
      focusAreas: config.focusAreas || [],
      skillsToImprove: userProfile?.professionalInfo?.skillsToImprove || [],
      language: config.language || "en",
      // Skip cache in development for fresh questions each time
      // In production, set to false to improve performance
      skipCache: config.skipCache ?? process.env.NODE_ENV !== "production",
      // Pass adaptiveDifficulty block so hybrid service can generate mixed levels
      adaptiveDifficulty: config.adaptiveDifficulty, // { enabled: true } triggers progressive distribution
    };

    const result = await hybridQuestionService.generateQuestions(
      questionConfig
    );

    if (result.success && result.questions.length > 0) {
      Logger.info(
        `[getQuestionsForInterview] Generated ${result.questions.length} questions`
      );

      const lang = (questionConfig.language || "en").toLowerCase();

      // ALWAYS translate questions if language is not English - don't rely on AI
      if (lang !== "en") {
        Logger.info(
          `[getQuestionsForInterview] 🌐 Translating ${result.questions.length} questions to ${lang}`
        );
        Logger.info(
          `[getQuestionsForInterview] Sample question BEFORE translation: "${
            result.questions[0]?.questionText?.substring(0, 100) ||
            result.questions[0]?.text?.substring(0, 100)
          }..."`
        );

        try {
          const translationService = require("../services/translationService");
          const translatedQuestions =
            await translationService.translateQuestions(result.questions, lang);

          // Verify translation worked
          const translatedSample =
            translatedQuestions[0]?.questionText ||
            translatedQuestions[0]?.text ||
            "";
          Logger.info(
            `[getQuestionsForInterview] ✅ Translation complete. Sample AFTER translation: "${translatedSample.substring(
              0,
              100
            )}..."`
          );

          return translatedQuestions;
        } catch (err) {
          Logger.error(
            `[getQuestionsForInterview] ❌ Translation FAILED for ${lang}:`,
            err.message,
            err.stack
          );
          // Return original questions as fallback
          Logger.warn(
            "[getQuestionsForInterview] Returning UNTRANSLATED questions as fallback"
          );
          return result.questions;
        }
      }

      return result.questions;
    }

    Logger.warn(
      "[getQuestionsForInterview] Hybrid service failed, returning empty array"
    );
    return [];
  } catch (error) {
    Logger.error("[getQuestionsForInterview] Error:", error);
    return [];
  }
}

// Helper function to determine next difficulty level
function getNextDifficultyLevel(score, currentDifficulty) {
  // Canonical difficulty ladder used across templates & UI
  const difficulties = ["beginner", "intermediate", "advanced"];
  const normalizedCurrent = (() => {
    if (!currentDifficulty) return "intermediate";
    const c = currentDifficulty.toLowerCase();
    if (c === "easy") return "beginner";
    if (c === "hard" || c === "expert") return "advanced";
    return difficulties.includes(c) ? c : "intermediate";
  })();
  const currentIndex = difficulties.indexOf(normalizedCurrent);

  // Move down if performance below threshold and not already at lowest
  if (score < C.SCORE_EASIER_DOWN_THRESHOLD && currentIndex > 0) {
    return difficulties[currentIndex - 1];
  }

  // Move up if performance meets upward threshold and not already at highest
  if (
    score >= C.SCORE_HARDER_UP_THRESHOLD &&
    currentIndex < difficulties.length - 1
  ) {
    return difficulties[currentIndex + 1];
  }

  return normalizedCurrent;
}

// Helper to calculate category average
module.exports = {
  createInterview,
  getUserInterviews,
  getInterviewDetails,
  startInterview,
  submitAnswer,
  generateFollowUp,
  completeInterview,
  getAdaptiveQuestion,
  getInterviewResults,
  markFollowUpsReviewed,
  deleteInterview,
  getInterviewTranscripts,
  updateAdaptiveDifficulty,
  exportInterviewMetrics,
  getStatus,
  resumeInterview,
  endInterview,
};
