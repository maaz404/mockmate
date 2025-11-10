/* eslint-disable consistent-return, no-magic-numbers */
const Interview = require("../models/Interview");
const Question = require("../models/Question");
const mongoose = require("mongoose");
const aiQuestionService = require("../services/aiQuestionService");
const hybridQuestionService = require("../services/hybridQuestionService");
const evaluationService = require("../services/evaluationService");
const aiProviderManager = require("../services/aiProviders");
const { destroyByPrefix } = require("./uploadController");
const C = require("../utils/constants");
const Logger = require("../utils/logger");
const { ok, fail, created } = require("../utils/responder");
const { consumeFreeInterview } = require("../utils/subscription");
const { mapDifficulty } = require("../utils/questionNormalization");
const FEATURES = require("../config/features");

// Create new interview session
const createInterview = async (req, res) => {
  const userId = req.user?.id; // Keep this one
  const config = { ...(req.body?.config || req.body) };
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
      if (questions.length === 0) {
        if (process.env.NODE_ENV !== "production") {
          questions = [
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
        .map((q) => ({
          questionId: q._id,
          questionText: q.text,
          category: q.category,
          difficulty: mapDifficulty(q.difficulty),
          timeAllocated: q.estimatedTime,
          hasVideo: false,
        })),
      status: "scheduled",
    });

    // --- Auto-inject coding questions when requested ---
    // Reason: Current hybrid generation does not produce 'coding' category items.
    // We add coding challenges to enable CodingAnswerUI in mixed/coding-enabled sessions.
    const wantsCoding =
      Boolean(config.coding) || config.interviewType === "mixed";
    const hasCodingAlready = interview.questions.some(
      (q) =>
        (q.category || "").toLowerCase() === "coding" ||
        (q.type || "").toLowerCase() === "coding"
    );

    if (wantsCoding && !hasCodingAlready && FEATURES.codingChallenges) {
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

        // Pool of coding questions to randomly select from
        const codingQuestionPool = [
          {
            questionText: "Implement a function that reverses a string.",
            examples: [
              { input: "hello", output: "olleh" },
              { input: "Interview", output: "weivretnI" },
            ],
          },
          {
            questionText:
              "Write a function to check if a string is a palindrome.",
            examples: [
              { input: "racecar", output: "true" },
              { input: "hello", output: "false" },
            ],
          },
          {
            questionText:
              "Implement a function that finds the maximum number in an array.",
            examples: [
              { input: "[1, 5, 3, 9, 2]", output: "9" },
              { input: "[10, 20, 15]", output: "20" },
            ],
          },
          {
            questionText:
              "Write a function to remove duplicates from an array.",
            examples: [
              { input: "[1, 2, 2, 3, 4, 4, 5]", output: "[1, 2, 3, 4, 5]" },
              { input: "[1, 1, 1]", output: "[1]" },
            ],
          },
          {
            questionText:
              "Implement a function that checks if two strings are anagrams.",
            examples: [
              { input: "listen, silent", output: "true" },
              { input: "hello, world", output: "false" },
            ],
          },
          {
            questionText:
              "Write a function to find the first non-repeating character in a string.",
            examples: [
              { input: "leetcode", output: "l" },
              { input: "loveleetcode", output: "v" },
            ],
          },
          {
            questionText:
              "Implement a function to find the sum of all numbers in an array.",
            examples: [
              { input: "[1, 2, 3, 4, 5]", output: "15" },
              { input: "[10, -5, 20]", output: "25" },
            ],
          },
          {
            questionText:
              "Write a function that returns the factorial of a number.",
            examples: [
              { input: "5", output: "120" },
              { input: "3", output: "6" },
            ],
          },
        ];

        // Select random questions from the pool
        const selectedQuestions = [];
        const poolCopy = [...codingQuestionPool];
        const numToAdd = Math.min(codingCount, poolCopy.length);

        for (let i = 0; i < numToAdd; i++) {
          const randomIndex = Math.floor(Math.random() * poolCopy.length);
          selectedQuestions.push(poolCopy[randomIndex]);
          poolCopy.splice(randomIndex, 1); // Remove to avoid duplicates
        }

        // Replace last N questions with coding questions to maintain total count
        // Remove the last N non-coding questions
        interview.questions.splice(-numToAdd, numToAdd);

        // Add the selected coding questions
        selectedQuestions.forEach((q) => {
          interview.questions.push({
            questionId: new mongoose.Types.ObjectId(),
            questionText: q.questionText,
            category: "coding", // signals frontend to render coding UI
            difficulty: codingDifficulty,
            timeAllocated: 600, // 10 minutes per coding question
            hasVideo: false,
            examples: q.examples,
          });
        });

        Logger.info(
          `[createInterview] Injected ${selectedQuestions.length} coding question(s) for session (replaced last ${numToAdd} questions)`
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
    Logger.error("Create interview error:", error);
    const meta = {};
    if (process.env.NODE_ENV !== "production") {
      meta.detail = error?.message;
      meta.stack = error?.stack?.split("\n").slice(0, 5).join("\n");
      meta.configReceived = req.body?.config || req.body;
      meta.dbConnected = require("../config/database").isDbConnected?.();
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

    let evaluation;
    try {
      Logger.info("Evaluating answer with AI for question:", qIndex);

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

      // Try AI evaluation first (new AI provider manager)
      if (FEATURES.AI_QUESTIONS) {
        evaluation = await aiProviderManager.evaluateAnswer(
          questionObj,
          answer,
          interview.config
        );
        Logger.info("AI evaluation completed:", evaluation);
      } else {
        // Use simplified keyword-based evaluation
        Logger.info("Using simplified evaluation (AI disabled)");
        const simpleEval = await evaluationService.evaluateAnswer(
          questionObj,
          answerObj
        );

        // Convert to expected format
        evaluation = {
          score: simpleEval.score,
          rubricScores: {
            relevance: Math.ceil((simpleEval.score / 100) * 5),
            clarity: Math.ceil((simpleEval.score / 100) * 5),
            depth: Math.ceil((simpleEval.score / 100) * 5),
            structure: Math.ceil((simpleEval.score / 100) * 5),
          },
          breakdown: simpleEval.breakdown || {},
          strengths: simpleEval.feedback?.strengths || [],
          improvements: simpleEval.feedback?.improvements || [],
          feedback: simpleEval.feedback?.overall || "",
          modelAnswer: "",
        };
      }
    } catch (error) {
      Logger.warn("Evaluation failed, using simplified scoring:", error);
      const questionObj = {
        questionText: interview.questions[qIndex].questionText,
        text: interview.questions[qIndex].questionText,
        category: interview.questions[qIndex].category,
        type: interview.questions[qIndex].type || "general",
        difficulty: interview.questions[qIndex].difficulty,
        tags: interview.questions[qIndex].tags || [],
      };
      const answerObj = {
        text: answer,
        answerText: answer,
      };

      // Use our simplified evaluation service as fallback
      const simpleEval = await evaluationService.evaluateAnswer(
        questionObj,
        answerObj
      );

      evaluation = {
        score: simpleEval.score,
        rubricScores: {
          relevance: Math.ceil((simpleEval.score / 100) * 5),
          clarity: Math.ceil((simpleEval.score / 100) * 5),
          depth: Math.ceil((simpleEval.score / 100) * 5),
          structure: Math.ceil((simpleEval.score / 100) * 5),
        },
        breakdown: simpleEval.breakdown || {},
        strengths: simpleEval.feedback?.strengths || [],
        improvements: simpleEval.feedback?.improvements || [],
        feedback: simpleEval.feedback?.overall || "",
        modelAnswer: "",
      };
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
    Logger.error("Submit answer error:", error);
    return fail(res, 500, "ANSWER_SUBMIT_FAILED", "Failed to submit answer");
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
    let { transcript, facialMetrics } = req.body;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status === "completed")
      return fail(res, 400, "ALREADY_COMPLETED", "Interview already completed");

    interview.status = "completed";
    if (!interview.timing) interview.timing = {};
    interview.timing.completedAt = new Date();
    interview.timing.totalDuration = Math.round(
      (interview.timing.completedAt - interview.timing.startedAt) / 1000
    );

    // Trim excessively large data to prevent payload errors
    // Keep only summary statistics for facial metrics instead of full time series
    if (facialMetrics && Array.isArray(facialMetrics)) {
      Logger.info(
        `[completeInterview] Facial metrics array length: ${facialMetrics.length}`
      );

      // If more than 100 data points, calculate summary and discard detailed data
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
    if (transcript && transcript.length > 50000) {
      Logger.info(
        `[completeInterview] Trimming transcript from ${transcript.length} to 50000 chars`
      );
      transcript = transcript.substring(0, 50000) + "... (truncated)";
    }

    // Store session enrichment data if provided
    if (transcript || facialMetrics) {
      interview.sessionEnrichment = {
        transcript: transcript || undefined,
        facialMetrics: facialMetrics || undefined,
        enrichedAt: new Date(),
      };
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
    const response = {
      interview: {
        _id: interview._id,
        jobRole: interview.config?.jobRole,
        interviewType: interview.config?.interviewType,
        experienceLevel: interview.config?.experienceLevel,
        difficulty: interview.config?.difficulty,
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
    };

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
      // Skip cache in development for fresh questions each time
      // In production, set to false to improve performance
      skipCache: config.skipCache ?? process.env.NODE_ENV !== "production",
    };

    const result = await hybridQuestionService.generateQuestions(
      questionConfig
    );

    if (result.success && result.questions.length > 0) {
      Logger.info(
        `[getQuestionsForInterview] Generated ${result.questions.length} questions`
      );
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
  const difficulties = ["easy", "intermediate", "hard", "expert"];
  const currentIndex = difficulties.indexOf(currentDifficulty);

  if (score < C.SCORE_EASIER_DOWN_THRESHOLD && currentIndex > 0) {
    return difficulties[currentIndex - 1];
  }

  if (
    score >= C.SCORE_HARDER_UP_THRESHOLD &&
    currentIndex < difficulties.length - 1
  ) {
    return difficulties[currentIndex + 1];
  }

  return currentDifficulty;
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
