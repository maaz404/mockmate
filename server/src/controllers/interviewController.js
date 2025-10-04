/* eslint-disable consistent-return, no-magic-numbers */
const Interview = require("../models/Interview");
const Question = require("../models/Question");
const mongoose = require("mongoose");
const aiQuestionService = require("../services/aiQuestionService");
const hybridQuestionService = require("../services/hybridQuestionService");
const { updateAnalytics } = require("./userController");
const { destroyByPrefix } = require("./uploadController");
const C = require("../utils/constants");
const Logger = require("../utils/logger");
const { ok, fail, created } = require("../utils/responder");
const { consumeFreeInterview } = require("../utils/subscription");

// Create new interview session
const createInterview = async (req, res) => {
  try {
    const { userId } = req.auth;
    const config = req.body?.config || req.body;
    const userProfile = req.userProfile;

    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return fail(
        res,
        503,
        "DB_NOT_CONNECTED",
        "Database is not connected. Configure MONGODB_URI and restart."
      );
    }

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

    let questions;
    const explicitQuestionIds = Array.isArray(req.body?.questionIds)
      ? req.body.questionIds.filter(Boolean)
      : [];
    const explicitQuestions = Array.isArray(req.body?.questions)
      ? req.body.questions
      : [];

    if (explicitQuestionIds.length > 0) {
      // If explicit IDs provided, fetch those. Allow a parallel raw questions array with matching length for fallback text.
      const found = await Question.find({ _id: { $in: explicitQuestionIds } });
      const foundMap = new Map(found.map((q) => [q._id.toString(), q]));
      questions = explicitQuestionIds
        .map((id, idx) => {
          const doc = foundMap.get(String(id));
          if (doc) return doc;
          // Fallback: construct ephemeral from provided raw questions (if any)
          const raw = explicitQuestions[idx];
          return raw
            ? {
                _id: new mongoose.Types.ObjectId(),
                text: raw.text || raw.questionText || `Question ${idx + 1}`,
                category: raw.category || raw.type || "general",
                difficulty:
                  raw.difficulty || config.difficulty || "intermediate",
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
      // Accept provided raw questions directly (ephemeral) even without IDs for reproducible session
      questions = explicitQuestions.map((raw, idx) => ({
        _id: new mongoose.Types.ObjectId(),
        text: raw.text || raw.questionText || `Question ${idx + 1}`,
        category: raw.category || raw.type || "general",
        difficulty: raw.difficulty || config.difficulty || "intermediate",
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
        return fail(
          res,
          400,
          "NO_QUESTIONS",
          "No suitable questions found for this configuration"
        );
      }
    }

    const interview = new Interview({
      userId,
      userProfile: userProfile._id,
      config: {
        ...config,
        questionCount: config.adaptiveDifficulty?.enabled
          ? config.questionCount || C.DEFAULT_QUESTION_COUNT
          : Math.min(
              config.questionCount || C.DEFAULT_QUESTION_COUNT,
              questions.length
            ),
        adaptiveDifficulty: config.adaptiveDifficulty?.enabled
          ? {
              enabled: true,
              initialDifficulty: config.difficulty,
              currentDifficulty: config.difficulty,
              difficultyHistory: [],
            }
          : { enabled: false },
      },
      questions: questions
        .slice(
          0,
          config?.adaptiveDifficulty?.enabled
            ? C.ADAPTIVE_SEED_COUNT
            : config.questionCount || C.DEFAULT_QUESTION_COUNT
        )
        .map((q) => ({
          questionId: q._id,
          questionText: q.text,
          category: q.category,
          difficulty: q.difficulty,
          timeAllocated: q.estimatedTime,
          hasVideo: false,
        })),
      status: "scheduled",
    });

    await interview.save();
    return created(res, interview, "Interview created successfully");
  } catch (error) {
    Logger.error("Create interview error:", error);
    return fail(
      res,
      500,
      "INTERVIEW_CREATE_FAILED",
      "Failed to create interview",
      process.env.NODE_ENV === "development"
        ? { detail: error?.message }
        : undefined
    );
  }
};

// Start interview session
const startInterview = async (req, res) => {
  try {
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status !== "scheduled")
      return fail(res, 400, "INVALID_STATE", "Interview cannot be started");

    // Update interview status and timing
    interview.status = "in-progress";
    interview.timing.startedAt = new Date();

    await interview.save();

    // Decrement quota (idempotent utility)
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
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;
    const { questionIndex } = req.params;
    const { answer, timeSpent, notes } = req.body;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status !== "in-progress")
      return fail(res, 400, "INVALID_STATE", "Interview is not in progress");

    const qIndex = parseInt(questionIndex);
    if (qIndex >= interview.questions.length)
      return fail(res, 400, "BAD_INDEX", "Invalid question index");

    // Update question response
    interview.questions[qIndex].response = {
      text: answer,
      notes: notes || "",
      submittedAt: new Date(),
    };
    interview.questions[qIndex].timeSpent = timeSpent || 0;

    // AI-powered scoring with enhanced feedback
    let evaluation;
    try {
      Logger.info("Evaluating answer with AI for question:", qIndex);

      // Create question object with necessary fields for AI evaluation
      const questionObj = {
        text: interview.questions[qIndex].questionText,
        category: interview.questions[qIndex].category,
        type: interview.questions[qIndex].type || "general",
        difficulty: interview.questions[qIndex].difficulty,
      };

      evaluation = await aiQuestionService.evaluateAnswer(
        questionObj,
        answer,
        interview.config
      );
      Logger.info("AI evaluation completed:", evaluation);
    } catch (error) {
      Logger.warn("AI evaluation failed, using basic scoring:", error);
      const questionObj = {
        text: interview.questions[qIndex].questionText,
        category: interview.questions[qIndex].category,
        type: interview.questions[qIndex].type || "general",
        difficulty: interview.questions[qIndex].difficulty,
      };
      evaluation = aiQuestionService.getBasicEvaluation(questionObj, answer);
    }

    // Update question with enhanced scoring and feedback
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

    // Track score for adaptive difficulty if enabled
    if (interview.config.adaptiveDifficulty?.enabled) {
      const currentDifficulty =
        interview.questions[qIndex].difficulty || interview.config.difficulty;

      // Add to difficulty history for tracking
      if (!interview.config.adaptiveDifficulty.difficultyHistory) {
        interview.config.adaptiveDifficulty.difficultyHistory = [];
      }

      // Update or add current question's score tracking
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

    await interview.save();

    // Generate follow-up questions automatically after scoring
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
      // Continue without follow-ups - non-critical feature
    }

    // Prepare response data
    const responseData = {
      questionIndex: qIndex,
      score: interview.questions[qIndex].score?.overall || evaluation.score,
      followUpQuestions,
    };

    // Add adaptive difficulty info if enabled
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
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;
    const { questionIndex } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
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

    // Check if follow-up questions already exist
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

      // Save the generated follow-ups to the interview
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
    return fail(
      res,
      500,
      "FOLLOWUP_FAILED",
      "Failed to generate follow-up question"
    );
  }
};

// Complete interview
const completeInterview = async (req, res) => {
  try {
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    }).populate("userProfile");

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status !== "in-progress")
      return fail(res, 400, "INVALID_STATE", "Interview is not in progress");

    // Update timing
    interview.timing.completedAt = new Date();
    interview.timing.totalDuration = Math.round(
      (interview.timing.completedAt - interview.timing.startedAt) /
        C.MINUTE_IN_MS
    );

    // Calculate overall results
    interview.calculateOverallScore();
    interview.results.performance = interview.getPerformanceLevel();
    interview.status = "completed";

    // Compute metrics
    const totalQuestions = (interview.questions || []).length;
    const validScores = (interview.questions || [])
      .map((q) => q?.score?.overall)
      .filter((n) => typeof n === "number");
    const avgScore =
      validScores.length > 0
        ? Math.round(
            validScores.reduce((s, n) => s + n, 0) / validScores.length
          )
        : 0;
    const times = (interview.questions || [])
      .map((q) => q?.timeSpent)
      .filter((n) => typeof n === "number");
    const avgAnswerDurationMs =
      times.length > 0
        ? Math.round((times.reduce((s, n) => s + n, 0) / times.length) * 1000)
        : 0;
    const totalDurationMs =
      typeof interview.timing?.totalDuration === "number"
        ? interview.timing.totalDuration * 60 * 1000
        : 0;
    interview.metrics = {
      totalQuestions,
      avgScore,
      avgAnswerDurationMs,
      totalDurationMs,
    };

    await interview.save();

    // Update user analytics
    const userProfile = interview.userProfile;
    const newTotalInterviews = userProfile.analytics.totalInterviews + 1;
    const newAverageScore = Math.round(
      (userProfile.analytics.averageScore *
        userProfile.analytics.totalInterviews +
        interview.results.overallScore) /
        newTotalInterviews
    );

    await updateAnalytics(userId, {
      totalInterviews: newTotalInterviews,
      averageScore: newAverageScore,
      lastInterviewDate: new Date(),
    });

    return ok(res, interview, "Interview completed successfully");
  } catch (error) {
    Logger.error("Complete interview error:", error);
    return fail(res, 500, "COMPLETE_FAILED", "Failed to complete interview");
  }
};

// Get user's interviews
const getUserInterviews = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { page = 1, limit = 10, status, type } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (type) query["config.interviewType"] = type;

    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-questions.questionText -questions.response.text"); // Exclude large text fields

    const totalCount = await Interview.countDocuments(query);

    return ok(res, {
      interviews,
      pagination: {
        current: page,
        pages: Math.ceil(totalCount / limit),
        total: totalCount,
      },
    });
  } catch (error) {
    Logger.error("Get interviews error:", error);
    return fail(
      res,
      500,
      "INTERVIEWS_FETCH_FAILED",
      "Failed to fetch interviews"
    );
  }
};

// Get interview details
const getInterviewDetails = async (req, res) => {
  try {
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    // Provide a client-friendly shape while preserving original document
    const interviewObj = interview.toObject();
    const clientQuestions = (interviewObj.questions || []).map((q) => ({
      ...q,
      text: q.questionText, // align with frontend usage
      // Infer a simple type for styling; default to technical
      type:
        q.type ||
        (q.category && q.category.includes("behavior")
          ? "behavioral"
          : "technical"),
    }));

    const responsePayload = {
      ...interviewObj,
      jobRole: interviewObj.config?.jobRole,
      duration: interviewObj.config?.duration, // minutes
      questions: clientQuestions,
    };

    return ok(res, responsePayload);
  } catch (error) {
    Logger.error("Get interview details error:", error);
    return fail(
      res,
      500,
      "INTERVIEW_FETCH_FAILED",
      "Failed to fetch interview details"
    );
  }
};

// Helper function to get suitable questions using hybrid approach
const getQuestionsForInterview = async (config, userProfile) => {
  try {
    Logger.info("Generating hybrid questions for config:", config);

    // Use hybrid service to generate questions (70% templates, 30% AI)
    const hybridQuestions = await hybridQuestionService.generateHybridQuestions(
      config
    );

    if (hybridQuestions && hybridQuestions.length > 0) {
      Logger.info(`Generated ${hybridQuestions.length} hybrid questions`);

      // Save questions to database and return the saved documents
      const savedQuestions = [];
      for (const question of hybridQuestions) {
        // Ensure valid type for Question model (no 'mixed')
        const inferredType =
          question.type && question.type !== "mixed"
            ? question.type
            : question.category && question.category.includes("behavior")
            ? "behavioral"
            : "technical";
        const questionDoc = new Question({
          text: question.text,
          category: question.category,
          difficulty: question.difficulty,
          type: inferredType,
          tags: question.tags || [],
          experienceLevel: [config.experienceLevel],
          estimatedTime: Math.max(
            question.estimatedTime ||
              (question.timeEstimate
                ? question.timeEstimate * C.SEC_PER_MIN
                : C.DEFAULT_TIME_ALLOC_SEC),
            C.MIN_TIME_ALLOC_SEC
          ), // Convert minutes to seconds, minimum 30 seconds
          source: question.source || "hybrid",
          generatedAt: question.generatedAt || new Date(),
          isHybridGenerated: true,
          keywords: question.keywords || [],
          stats: { timesUsed: 0, avgScore: 0 },
          status: "active",
        });
        const savedQuestion = await questionDoc.save();
        savedQuestions.push(savedQuestion);
      }
      return savedQuestions;
    }
  } catch (error) {
    Logger.warn(
      "Hybrid question generation failed, falling back to AI service:",
      error
    );
  }

  // Fallback to AI service if hybrid fails
  try {
    const aiQuestions = await aiQuestionService.generateQuestions({
      ...config,
      userProfile,
      skills:
        userProfile?.professionalInfo?.skills?.map((s) =>
          typeof s === "object" ? s.name : s
        ) || [],
    });

    if (aiQuestions && aiQuestions.length > 0) {
      Logger.info(`Generated ${aiQuestions.length} AI fallback questions`);

      // Save AI questions to database
      const savedQuestions = [];
      for (const question of aiQuestions) {
        // Determine a valid category from enum list if missing/invalid
        const preferredType =
          question.type && question.type !== "mixed"
            ? question.type
            : question.category &&
              String(question.category).includes("behavior")
            ? "behavioral"
            : "technical";
        const defaultBehavioral = "communication"; // valid enum
        const defaultTechnical = "system-design"; // valid enum
        const safeCategory =
          question.category && typeof question.category === "string"
            ? question.category
            : preferredType === "behavioral"
            ? defaultBehavioral
            : defaultTechnical;
        const safeType = preferredType;
        const questionDoc = new Question({
          text: question.question || question.text,
          category: safeCategory,
          difficulty: question.difficulty || config.difficulty,
          type: safeType,
          experienceLevel: [config.experienceLevel],
          estimatedTime: Math.max(
            (question.timeLimit ? question.timeLimit * C.SEC_PER_MIN : 0) ||
              C.DEFAULT_TIME_ALLOC_SEC,
            C.MIN_TIME_ALLOC_SEC
          ), // Convert minutes to seconds, minimum 30 seconds
          isAIGenerated: true,
          keywords: question.followUpHints || [],
          stats: { timesUsed: 0, avgScore: 0 },
          status: "active",
        });
        const savedQuestion = await questionDoc.save();
        savedQuestions.push(savedQuestion);
      }
      return savedQuestions;
    }
  } catch (aiError) {
    Logger.warn(
      "AI question generation also failed, falling back to database:",
      aiError
    );
  }

  // Final fallback to database questions
  const query = {
    status: "active",
    difficulty: config.difficulty,
    experienceLevel: { $in: [config.experienceLevel] },
  };

  // Filter by interview type
  if (config.interviewType !== "mixed") {
    query.type = config.interviewType;
  }

  // Get questions with randomization
  let questions = [];
  try {
    questions = await Question.aggregate([
      { $match: query },
      {
        $sample: {
          size: Math.max(
            (config.questionCount || C.DEFAULT_QUESTION_COUNT) *
              C.SAMPLE_MULTIPLIER,
            C.SAMPLE_MIN_SIZE
          ),
        },
      }, // Get more than needed for variety
      { $sort: { "stats.timesUsed": 1 } }, // Prefer less used questions
    ]);
  } catch (dbErr) {
    Logger.warn(
      "DB aggregate for questions failed, using final fallback:",
      dbErr
    );
    // Reuse final fallback path below by setting empty array to trigger it
    questions = [];
  }
  if (questions && questions.length > 0) {
    return questions;
  }

  // Final fallback: sanitize curated fallback questions and persist
  try {
    Logger.warn("No DB questions found. Using curated fallback questions.");

    const curated = await aiQuestionService.getFallbackQuestions({
      ...config,
    });

    // Allowed enums from schema
    const allowedCategories = Question.schema.path("category").enumValues;
    const mapDifficulty = (d) => {
      const m = {
        easy: "beginner",
        medium: "intermediate",
        hard: "advanced",
      };
      return (
        m[d] ||
        (d === "beginner" || d === "intermediate" || d === "advanced"
          ? d
          : config.difficulty)
      );
    };
    const sanitizeCategory = (cat, type) => {
      if (cat && allowedCategories.includes(cat)) return cat;
      if (type === "behavioral") return "communication";
      if (type === "system-design") return "system-design";
      return "web-development"; // safe technical default
    };

    const toSave = curated.map((q) => {
      const type =
        q.type && q.type !== "mixed"
          ? q.type
          : q.category && String(q.category).includes("behavior")
          ? "behavioral"
          : "technical";
      const category = sanitizeCategory(q.category, type);
      return new Question({
        text: q.text || q.question,
        category,
        difficulty: mapDifficulty(q.difficulty) || config.difficulty,
        type,
        experienceLevel: [config.experienceLevel],
        estimatedTime: Math.max(
          (q.timeEstimate ? q.timeEstimate * C.SEC_PER_MIN : 0) ||
            C.DEFAULT_TIME_ALLOC_SEC,
          C.MIN_TIME_ALLOC_SEC
        ),
        isAIGenerated: true,
        keywords: [],
        stats: { timesUsed: 0, avgScore: 0 },
        status: "active",
      });
    });

    const saved = [];
    for (const doc of toSave) {
      try {
        // Save individually to skip any that still fail validation
        const s = await doc.save();
        saved.push(s);
      } catch (e) {
        Logger.warn("Skipping invalid fallback question:", e?.message || e);
      }
    }

    return saved;
  } catch (fallbackErr) {
    Logger.error("Final fallback failed:", fallbackErr);
    // As a last resort, create in-memory pseudo questions so the interview can start
    try {
      const pseudo = [
        {
          _id: new mongoose.Types.ObjectId(),
          text: `Tell me about a recent challenge in ${
            config.jobRole || "your role"
          } and how you approached it.`,
          category:
            (config.interviewType === "behavioral"
              ? "communication"
              : "web-development") || "web-development",
          difficulty: config.difficulty,
          type:
            config.interviewType === "behavioral" ? "behavioral" : "technical",
          estimatedTime: C.DEFAULT_TIME_ALLOC_SEC,
        },
      ];
      Logger.warn("Using in-memory pseudo questions as ultimate fallback");
      return pseudo;
    } catch (e2) {
      Logger.error("Failed to build pseudo questions:", e2);
      return [];
    }
  }
};

// Enhanced fallback scoring function
// eslint-disable-next-line no-unused-vars
const calculateBasicScore = (answer, question) => {
  const score = {
    overall: 0,
    breakdown: {
      relevance: 0,
      clarity: 0,
      completeness: 0,
      technical: 0,
    },
    feedback: "",
  };

  if (!answer || answer.trim().length === 0) {
    score.feedback =
      "No answer provided. Consider providing a response even if you're unsure.";
    return score;
  }

  const answerLength = answer.trim().split(" ").length;
  const answerText = answer.toLowerCase();

  // Enhanced completeness scoring
  if (answerLength < 10) {
    score.breakdown.completeness = 20;
  } else if (answerLength < 30) {
    score.breakdown.completeness = 50;
  } else if (answerLength < 100) {
    score.breakdown.completeness = 80;
  } else {
    score.breakdown.completeness = 95;
  }

  // Enhanced clarity scoring based on structure
  const hasPunctuation = /[.!?]/.test(answer);
  const hasStructure = answerLength > 20 && hasPunctuation;
  score.breakdown.clarity = hasStructure ? 75 : answerLength > 10 ? 60 : 40;

  // Basic keyword relevance check
  const questionText = question.questionText || question.text || "";
  const questionKeywords =
    questionText.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const matchedKeywords = questionKeywords.filter((keyword) =>
    answerText.includes(keyword)
  );
  score.breakdown.relevance = Math.min(90, 40 + matchedKeywords.length * 10);

  // Technical depth based on category and content
  const technicalTerms = [
    "function",
    "variable",
    "object",
    "array",
    "api",
    "database",
    "component",
    "state",
    "props",
    "async",
    "await",
    "promise",
  ];
  const hasTechnicalTerms = technicalTerms.some((term) =>
    answerText.includes(term)
  );

  if (question.category && question.category.includes("technical")) {
    score.breakdown.technical = hasTechnicalTerms ? 70 : 45;
  } else {
    score.breakdown.technical = 80; // Non-technical questions get higher base score
  }

  // Calculate overall score with weighted average
  score.overall = Math.round(
    score.breakdown.completeness * 0.3 +
      score.breakdown.clarity * 0.25 +
      score.breakdown.relevance * 0.25 +
      score.breakdown.technical * 0.2
  );

  // Generate basic feedback
  if (score.overall >= 80) {
    score.feedback =
      "Excellent response! Your answer demonstrates good understanding and clarity.";
  } else if (score.overall >= 60) {
    score.feedback =
      "Good response. Consider adding more detail or examples to strengthen your answer.";
  } else if (score.overall >= 40) {
    score.feedback =
      "Your answer touches on relevant points but could benefit from more depth and clarity.";
  } else {
    score.feedback =
      "Consider providing a more comprehensive answer with specific examples and clearer structure.";
  }

  return score;
};

// Helper function to determine next difficulty level based on score
const getNextDifficultyLevel = (currentScore, currentDifficulty) => {
  // Convert 100-point scale to 5-point scale: < 60 = < 3/5, >= 80 = >= 4/5
  const normalizedScore = currentScore / 20; // Convert to 5-point scale

  const difficulties = ["beginner", "intermediate", "advanced"];
  const currentIndex = difficulties.indexOf(currentDifficulty);

  if (normalizedScore < 3.0) {
    // Score < 3/5: make it easier (move down one level if possible)
    return currentIndex > 0
      ? difficulties[currentIndex - 1]
      : currentDifficulty;
  } else if (normalizedScore >= 4.0) {
    // Score >= 4/5: make it harder (move up one level if possible)
    return currentIndex < difficulties.length - 1
      ? difficulties[currentIndex + 1]
      : currentDifficulty;
  } else {
    // Score 3-4/5: keep same difficulty
    return currentDifficulty;
  }
};

// Get adaptive question for interview
const getAdaptiveQuestion = async (req, res) => {
  try {
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Interview is not in progress",
      });
    }

    // Check if adaptive difficulty is enabled
    if (!interview.config.adaptiveDifficulty?.enabled) {
      return res.status(400).json({
        success: false,
        message: "Adaptive difficulty is not enabled for this interview",
      });
    }

    // Check if there are more questions needed
    const answeredQuestions = interview.questions.filter(
      (q) => q.response?.text
    ).length;
    if (answeredQuestions >= interview.config.questionCount) {
      return res.status(400).json({
        success: false,
        message: "Interview has reached the maximum number of questions",
      });
    }

    // Get current difficulty level
    let currentDifficulty =
      interview.config.adaptiveDifficulty.currentDifficulty ||
      interview.config.difficulty;

    // If we have previous answers, check if we need to adjust difficulty
    if (answeredQuestions > 0) {
      const lastQuestion = interview.questions[answeredQuestions - 1];
      if (lastQuestion.score?.overall !== undefined) {
        const nextDifficulty = getNextDifficultyLevel(
          lastQuestion.score.overall,
          currentDifficulty
        );

        // Update current difficulty if it changed
        if (nextDifficulty !== currentDifficulty) {
          currentDifficulty = nextDifficulty;
          interview.config.adaptiveDifficulty.currentDifficulty =
            currentDifficulty;

          // Track difficulty change
          interview.config.adaptiveDifficulty.difficultyHistory.push({
            questionIndex: answeredQuestions,
            difficulty: currentDifficulty,
            score: lastQuestion.score.overall,
            timestamp: new Date(),
          });
        }
      }
    }

    // Get a question with the current difficulty level
    const adaptiveConfig = {
      ...interview.config,
      difficulty: currentDifficulty,
      questionCount: 1, // We only need one question
    };

    const questions = await getQuestionsForInterview(adaptiveConfig, null);

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No suitable questions found for difficulty level: ${currentDifficulty}`,
      });
    }

    // Select the best question (avoid duplicates if possible)
    const existingQuestionIds = interview.questions.map(
      (q) => q.questionId?.toString() || q._id
    );
    const availableQuestions = questions.filter(
      (q) => !existingQuestionIds.includes(q._id?.toString() || q.id)
    );

    const selectedQuestion =
      availableQuestions.length > 0 ? availableQuestions[0] : questions[0];

    // Add the new question to the interview
    const newQuestion = {
      questionId: selectedQuestion._id,
      questionText: selectedQuestion.text,
      category: selectedQuestion.category,
      difficulty: currentDifficulty,
      timeAllocated: selectedQuestion.estimatedTime || 300, // Default 5 minutes
    };

    interview.questions.push(newQuestion);
    await interview.save();

    res.json({
      success: true,
      message: "Adaptive question generated successfully",
      data: {
        question: {
          id: newQuestion.questionId,
          text: newQuestion.questionText,
          category: newQuestion.category,
          difficulty: newQuestion.difficulty,
          timeAllocated: newQuestion.timeAllocated,
          index: interview.questions.length - 1,
        },
        adaptiveInfo: {
          currentDifficulty,
          previousDifficulty:
            answeredQuestions > 0
              ? interview.config.adaptiveDifficulty.difficultyHistory[
                  interview.config.adaptiveDifficulty.difficultyHistory.length -
                    2
                ]?.difficulty || interview.config.difficulty
              : interview.config.difficulty,
          difficultyChanged:
            answeredQuestions > 0 &&
            interview.config.adaptiveDifficulty.difficultyHistory.length > 0 &&
            interview.config.adaptiveDifficulty.difficultyHistory[
              interview.config.adaptiveDifficulty.difficultyHistory.length - 1
            ]?.questionIndex === answeredQuestions,
        },
      },
    });
  } catch (error) {
    Logger.error("Get adaptive question error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate adaptive question",
    });
  }
};

module.exports = {
  createInterview,
  startInterview,
  submitAnswer,
  generateFollowUp,
  completeInterview,
  getUserInterviews,
  getInterviewDetails,
  getAdaptiveQuestion,
};

// Compose interview results payload for frontend consumption
const composeResultsPayload = (interviewDoc) => {
  const interview = {
    jobRole: interviewDoc?.config?.jobRole || "",
    interviewType: interviewDoc?.config?.interviewType || "",
    duration: (interviewDoc?.timing?.totalDuration || 0) * 60, // seconds
    questions: interviewDoc?.questions || [],
    completedAt: interviewDoc?.timing?.completedAt || interviewDoc?.updatedAt,
    // Include full config so clients can access adaptiveDifficulty history
    config: interviewDoc?.config || {},
  };

  const breakdown = interviewDoc?.results?.breakdown || {};
  const analysis = {
    overallScore: interviewDoc?.results?.overallScore || 0,
    technicalScore: breakdown.technical ?? 0,
    communicationScore: breakdown.communication ?? 0,
    problemSolvingScore: breakdown.problemSolving ?? 0,
    questionAnalysis: (interviewDoc?.questions || []).map((q) => ({
      question: q.questionText || "",
      type: q.category?.includes("behavior") ? "behavioral" : "technical",
      difficulty: q.difficulty || interviewDoc?.config?.difficulty || "",
      userAnswer: q.response?.text || "",
      userNotes: q.response?.notes || "",
      followUpsReviewed: !!q.followUpsReviewed,
      timeSpent: q.timeSpent || 0,
      score: q.score
        ? {
            overall: q.score.overall ?? 0,
            rubricScores: q.score.rubricScores || {},
          }
        : 0,
      feedback: {
        strengths: q.feedback?.strengths || [],
        improvements: q.feedback?.improvements || [],
        modelAnswer: q.feedback?.modelAnswer || "",
      },
      followUpQuestions: (q.followUpQuestions || []).map((f) => f.text || f),
    })),
    recommendations:
      interviewDoc?.results?.feedback?.recommendations &&
      interviewDoc.results.feedback.recommendations.length > 0
        ? interviewDoc.results.feedback.recommendations
        : [
            "Practice articulating your thought process more clearly",
            "Incorporate concrete examples from past projects",
            "Balance depth with breadth when answering technical questions",
          ],
    focusAreas: [
      { skill: "communication", priority: "high", currentLevel: "developing" },
      {
        skill: "problem-solving",
        priority: "medium",
        currentLevel: "intermediate",
      },
    ],
  };

  return { interview, analysis };
};

// Get interview results formatted for the results page
const getInterviewResults = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId } = req.params;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    // Ensure results are computed if missing
    if (!interview.results?.overallScore) {
      interview.calculateOverallScore();
      await interview.save();
    }

    const payload = composeResultsPayload(interview);
    return ok(res, payload);
  } catch (error) {
    Logger.error("Get interview results error:", error);
    return fail(
      res,
      500,
      "RESULTS_FETCH_FAILED",
      "Failed to fetch interview results"
    );
  }
};

module.exports.getInterviewResults = getInterviewResults;

// Mark follow-ups reviewed for a specific question
const markFollowUpsReviewed = async (req, res) => {
  try {
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;
    const { questionIndex } = req.params;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    const qIndex = parseInt(questionIndex);
    if (
      Number.isNaN(qIndex) ||
      qIndex < 0 ||
      qIndex >= interview.questions.length
    ) {
      return fail(res, 400, "BAD_INDEX", "Invalid question index");
    }

    interview.questions[qIndex].followUpsReviewed = true;
    interview.questions[qIndex].followUpsReviewedAt = new Date();
    await interview.save();

    return ok(res, { questionIndex: qIndex, followUpsReviewed: true });
  } catch (error) {
    Logger.error("Mark follow-ups reviewed error:", error);
    return fail(
      res,
      500,
      "FOLLOWUPS_REVIEW_FAILED",
      "Failed to update follow-ups reviewed status"
    );
  }
};

module.exports.markFollowUpsReviewed = markFollowUpsReviewed;

// Delete interview with Cloudinary cleanup by prefix
const deleteInterview = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    const doc = await Interview.findOne({ _id: id, userId }).lean();
    if (!doc) return fail(res, 404, "NOT_FOUND", "Interview not found");

    const prefix = `mockmate/dev/users/${userId}/sessions/${id}`;
    // Clean up all resource types
    try {
      await destroyByPrefix(prefix, "image");
      await destroyByPrefix(prefix, "video");
      await destroyByPrefix(prefix, "raw");
    } catch (_e) {
      // Best-effort cleanup
    }

    await Interview.deleteOne({ _id: id, userId });
    return ok(res, null, "Interview deleted");
  } catch (error) {
    return fail(res, 500, "DELETE_FAILED", "Failed to delete interview");
  }
};

module.exports.deleteInterview = deleteInterview;
