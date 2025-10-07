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
const { mapDifficulty } = require("../utils/questionNormalization");

// Create new interview session
const createInterview = async (req, res) => {
  try {
    const { userId } = req.auth;
    const config = { ...(req.body?.config || req.body) };
    // Provide tolerant defaults in non-production test/dev to avoid schema failures
    if (!config.duration) {
      // eslint-disable-next-line no-magic-numbers
      config.duration = 30; // minutes default for tests
    }
    if (!config.difficulty) {
      config.difficulty = "intermediate";
    }
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
      // Accept provided raw questions directly (ephemeral) even without IDs for reproducible session
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
        // Emergency minimal fallback (ensures session can still start in dev)
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

    // Ensure we never violate Interview schema min questionCount (5) even if generation returned fewer
    // eslint-disable-next-line no-magic-numbers
    const MIN_SCHEMA_QUESTION_COUNT = 5;
    if (questions.length > 0 && questions.length < MIN_SCHEMA_QUESTION_COUNT) {
      const base = [...questions];
      let dupIdx = 0;
      while (questions.length < MIN_SCHEMA_QUESTION_COUNT) {
        const src = base[dupIdx % base.length];
        const baseObj =
          src && typeof src.toObject === "function" ? src.toObject() : src;
        const safeCategory =
          baseObj.category ||
          (config.interviewType === "behavioral"
            ? "communication"
            : config.interviewType === "system-design"
            ? "system-design"
            : "web-development");
        const safeEstimated =
          baseObj.estimatedTime ||
          (baseObj.timeEstimate ? baseObj.timeEstimate * C.SEC_PER_MIN : 120);
        questions.push({
          ...baseObj,
          category: safeCategory,
          estimatedTime: safeEstimated,
          _id: new mongoose.Types.ObjectId(),
          source: `${baseObj.source || "template"}`,
          text: `${baseObj.text} (variant ${Math.floor(
            questions.length - base.length + 1
          )})`,
        });
        dupIdx += 1;
      }
    }

    const interview = new Interview({
      userId,
      userProfile: userProfile._id,
      config: {
        ...config,
        questionCount: config.adaptiveDifficulty?.enabled
          ? config.questionCount || C.DEFAULT_QUESTION_COUNT
          : // Cap upper bound by questions length but enforce lower bound of schema min (5)
            Math.max(
              // eslint-disable-next-line no-magic-numbers
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
          difficulty: mapDifficulty(q.difficulty),
          timeAllocated: q.estimatedTime,
          hasVideo: false,
        })),
      status: "scheduled",
    });

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
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (interview.status !== "scheduled")
      return fail(res, 400, "INVALID_STATE", "Interview cannot be started");

    // Update interview status and timing (ensure timing object exists)
    interview.status = "in-progress";
    if (!interview.timing) interview.timing = {};
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
    const { answer, timeSpent, notes, facialMetrics } = req.body;

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

    // Update question response & optional facial metrics snapshot for this question
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
    Logger.info("[completeInterview] invoked", { interviewId, userId });

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    }).populate("userProfile");

    if (!interview) {
      Logger.warn("[completeInterview] interview not found", { interviewId });
      return fail(res, 404, "NOT_FOUND", "Interview not found");
    }
    if (interview.status !== "in-progress") {
      Logger.warn("[completeInterview] invalid state", {
        status: interview.status,
      });
      return fail(res, 400, "INVALID_STATE", "Interview is not in progress");
    }

    // Ensure nested containers exist
    interview.results = interview.results || {};

    // Update timing
    if (!interview.timing) {
      interview.timing = {};
    }
    interview.timing.completedAt = new Date();
    if (!interview.timing.startedAt) {
      // Fallback: if start timestamp missing, approximate using question answer times
      const anyAnswerTs = (interview.questions || [])
        .map((q) => q?.response?.submittedAt)
        .filter(Boolean)
        .sort();
      if (anyAnswerTs.length) {
        interview.timing.startedAt = anyAnswerTs[0];
      } else {
        // fallback to completion minus configured duration (minutes)
        const durMin = interview.config?.duration || 30; // eslint-disable-line no-magic-numbers
        interview.timing.startedAt = new Date(
          interview.timing.completedAt.getTime() - durMin * 60 * 1000
        );
      }
    }
    interview.timing.totalDuration = Math.max(
      0,
      Math.round(
        (interview.timing.completedAt - interview.timing.startedAt) /
          C.MINUTE_IN_MS
      )
    );

    // Calculate overall results
    if (typeof interview.calculateOverallScore === "function") {
      try {
        interview.calculateOverallScore();
      } catch (e) {
        Logger.warn("calculateOverallScore failed", e.message);
      }
    } else {
      // Fallback basic overall score (percentage of answered questions with any response)
      const answered = (interview.questions || []).filter(
        (q) => q.response && q.response.text
      ).length;
      // eslint-disable-next-line no-magic-numbers
      const pct =
        (answered / Math.max(1, (interview.questions || []).length)) * 100;
      interview.results = interview.results || {};
      interview.results.overallScore = Math.round(pct);
    }
    if (interview.results) {
      if (typeof interview.getPerformanceLevel === "function") {
        try {
          interview.results.performance = interview.getPerformanceLevel();
        } catch (e) {
          Logger.warn("getPerformanceLevel failed", e.message);
        }
      } else if (!interview.results.performance) {
        const s = interview.results.overallScore || 0;
        interview.results.performance =
          s > 80
            ? "excellent"
            : s > 60
            ? "good"
            : s > 40
            ? "average"
            : "needs-improvement";
      }
    }
    interview.status = "completed";

    // Merge facial metrics snapshot if provided by client
    if (
      req.body &&
      req.body.facialMetrics &&
      typeof req.body.facialMetrics === "object"
    ) {
      const fm = req.body.facialMetrics;
      interview.metrics = interview.metrics || {};
      const mapNum = (k, targetKey) => {
        if (
          fm[k] != null &&
          typeof fm[k] === "number" &&
          !Number.isNaN(fm[k])
        ) {
          interview.metrics[targetKey] = fm[k];
        }
      };
      mapNum("eyeContact", "eyeContactScore");
      mapNum("blinkRate", "blinkRate");
      mapNum("smilePercentage", "smilePercentage");
      mapNum("headSteadiness", "headSteadiness");
      mapNum("offScreenPercentage", "offScreenPercentage");
      mapNum("environmentQuality", "environmentQuality");
      mapNum("confidenceScore", "confidenceScore");
    }

    // Compute metrics (core interview stats)
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
    // Preserve previously merged facial metrics if present
    const existingMetrics = interview.metrics || {};
    interview.metrics = {
      ...existingMetrics,
      totalQuestions,
      avgScore,
      avgAnswerDurationMs,
      totalDurationMs,
    };

    try {
      await interview.save();
    } catch (persistErr) {
      Logger.error("[completeInterview] save failed", persistErr);
      return fail(
        res,
        500,
        "SAVE_FAILED",
        "Failed to persist interview completion"
      );
    }

    // Update user analytics
    const userProfile = interview.userProfile;
    const analytics = userProfile?.analytics || {};
    const prevCount = analytics.totalInterviews || 0;
    const prevAvg = analytics.averageScore || 0;
    const newTotalInterviews = prevCount + 1;
    const newAverageScore = Math.round(
      (prevAvg * prevCount + (interview.results.overallScore || 0)) /
        (newTotalInterviews || 1)
    );

    try {
      await updateAnalytics(userId, {
        totalInterviews: newTotalInterviews,
        averageScore: newAverageScore,
        lastInterviewDate: new Date(),
      });
    } catch (analyticsErr) {
      Logger.warn(
        "[completeInterview] analytics update failed (non-fatal)",
        analyticsErr?.message
      );
    }

    return ok(res, interview, "Interview completed successfully");
  } catch (error) {
    Logger.error("Complete interview error:", error);
    return fail(
      res,
      500,
      "COMPLETE_FAILED",
      "Failed to complete interview",
      process.env.NODE_ENV !== "production"
        ? {
            detail: error.message,
            stack: error.stack?.split("\n").slice(0, 5).join("\n"),
          }
        : undefined
    );
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
      const allowedCategories = Question.schema.path("category").enumValues;
      const sanitizeCategory = (cat, inferredType) => {
        if (cat && allowedCategories.includes(cat)) return cat;
        if (inferredType === "behavioral") return "communication";
        if (inferredType === "system-design") return "system-design";
        return "web-development"; // safe technical default
      };
      for (const question of hybridQuestions) {
        const inferredType =
          question.type && question.type !== "mixed"
            ? question.type
            : question.category && question.category.includes("behavior")
            ? "behavioral"
            : "technical";
        const safeCategory = sanitizeCategory(question.category, inferredType);
        const questionDoc = new Question({
          text: question.text,
          category: safeCategory,
          difficulty: mapDifficulty(question.difficulty || config.difficulty),
          type: inferredType,
          tags: question.tags || [],
          experienceLevel: [config.experienceLevel],
          estimatedTime: Math.max(
            question.estimatedTime ||
              (question.timeEstimate
                ? question.timeEstimate * C.SEC_PER_MIN
                : C.DEFAULT_TIME_ALLOC_SEC),
            C.MIN_TIME_ALLOC_SEC
          ),
          source: question.source || "hybrid",
          generatedAt: question.generatedAt || new Date(),
          isHybridGenerated: true,
          keywords: question.keywords || [],
          stats: { timesUsed: 0, avgScore: 0 },
          status: "active",
        });
        try {
          const savedQuestion = await questionDoc.save();
          savedQuestions.push(savedQuestion);
        } catch (e) {
          Logger.warn("Skipping invalid hybrid question:", e?.message || e);
        }
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
      const allowedCategories = Question.schema.path("category").enumValues;
      for (const question of aiQuestions) {
        const preferredType =
          question.type && question.type !== "mixed"
            ? question.type
            : question.category &&
              String(question.category).includes("behavior")
            ? "behavioral"
            : "technical";
        const defaultBehavioral = "communication";
        const defaultTechnical = "system-design";
        const rawCat =
          question.category && typeof question.category === "string"
            ? question.category
            : null;
        let safeCategory = rawCat;
        if (!safeCategory || !allowedCategories.includes(safeCategory)) {
          safeCategory =
            preferredType === "behavioral"
              ? defaultBehavioral
              : defaultTechnical;
        }
        const questionDoc = new Question({
          text: question.question || question.text,
          category: safeCategory,
          difficulty: mapDifficulty(question.difficulty || config.difficulty),
          type: preferredType,
          experienceLevel: [config.experienceLevel],
          estimatedTime: Math.max(
            (question.timeLimit ? question.timeLimit * C.SEC_PER_MIN : 0) ||
              C.DEFAULT_TIME_ALLOC_SEC,
            C.MIN_TIME_ALLOC_SEC
          ),
          isAIGenerated: true,
          keywords: question.followUpHints || [],
          stats: { timesUsed: 0, avgScore: 0 },
          status: "active",
        });
        try {
          const savedQuestion = await questionDoc.save();
          savedQuestions.push(savedQuestion);
        } catch (saveErr) {
          Logger.warn(
            "Skipping invalid AI fallback question:",
            saveErr?.message || saveErr
          );
        }
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

// Lightweight transcript status retrieval for polling.
// Returns per-question transcript metadata (status, text length) without large text bodies unless requested.
async function getInterviewTranscripts(req, res) {
  try {
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;
    const full = req.query.full === "1" || req.query.full === "true"; // allow full text expansion

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    }).lean();
    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");

    const transcripts = (interview.questions || []).map((q, idx) => {
      const vt = q?.video?.transcript;
      if (!vt) {
        return {
          questionIndex: idx,
          status: "not_started",
          text: null,
        };
      }
      return {
        questionIndex: idx,
        status: vt.status || (vt.text ? "completed" : "pending"),
        text: full ? vt.text : null,
        length: vt.text ? vt.text.length : 0,
        generatedAt: vt.generatedAt || null,
        language: vt.language || null,
        segments: full ? vt.segments || [] : undefined,
        error: vt.error || null,
      };
    });
    return ok(res, { interviewId, transcripts });
  } catch (e) {
    return fail(
      res,
      500,
      "TRANSCRIPTS_FETCH_FAILED",
      "Failed to fetch transcripts"
    );
  }
}

module.exports.getInterviewTranscripts = getInterviewTranscripts;

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
    metrics: interviewDoc?.metrics || {},
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

// Explicitly update current adaptive difficulty (user accepted suggestion)
async function updateAdaptiveDifficulty(req, res) {
  try {
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;
    const { difficulty } = req.body || {};
    if (
      !difficulty ||
      !["beginner", "intermediate", "advanced"].includes(difficulty)
    ) {
      return fail(res, 400, "BAD_DIFFICULTY", "Invalid difficulty value");
    }
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    if (!interview.config?.adaptiveDifficulty?.enabled) {
      return fail(
        res,
        400,
        "ADAPTIVE_DISABLED",
        "Adaptive difficulty not enabled for this interview"
      );
    }
    interview.config.adaptiveDifficulty.currentDifficulty = difficulty;
    // Append history marker (no score) for transparency
    interview.config.adaptiveDifficulty.difficultyHistory.push({
      questionIndex: interview.questions.length - 1,
      difficulty,
      score: null,
      timestamp: new Date(),
    });
    await interview.save();
    return ok(res, {
      currentDifficulty: difficulty,
      historyLength:
        interview.config.adaptiveDifficulty.difficultyHistory.length,
    });
  } catch (e) {
    return fail(
      res,
      500,
      "ADAPTIVE_UPDATE_FAILED",
      "Failed to update adaptive difficulty"
    );
  }
}
module.exports.updateAdaptiveDifficulty = updateAdaptiveDifficulty;

// Export metrics CSV
async function exportInterviewMetrics(req, res) {
  try {
    const { userId } = req.auth;
    const interviewId = req.params.interviewId || req.params.id;
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) return fail(res, 404, "NOT_FOUND", "Interview not found");
    const format = (req.query.format || "csv").toLowerCase();
    const headers = [
      "questionIndex",
      "category",
      "difficulty",
      "score",
      "timeSpent",
      "eyeContact",
      "blinkRate",
      "smilePercentage",
      "headSteadiness",
      "offScreen",
      "confidence",
    ];
    if (format === "pdf") {
      const PDFDocument = require("pdfkit");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=interview_${interviewId}_metrics.pdf`
      );
      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);
      doc.fontSize(16).text("Interview Metrics Report", { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(`Interview ID: ${interviewId}`);
      doc.text(`User ID: ${userId}`);
      doc.text(`Questions: ${(interview.questions || []).length}`);
      doc.moveDown();
      // Table header
      doc.font("Helvetica-Bold");
      doc.text(headers.join(" | "));
      doc.font("Helvetica");
      (interview.questions || []).forEach((q, idx) => {
        const fm = q.facial || {};
        const row = [
          idx,
          q.category || "",
          q.difficulty || "",
          q.score?.overall ?? "",
          q.timeSpent ?? "",
          fm.eyeContact ?? "",
          fm.blinkRate ?? "",
          fm.smilePercentage ?? "",
          fm.headSteadiness ?? "",
          fm.offScreenPercentage ?? "",
          fm.confidenceScore ?? "",
        ].join(" | ");
        doc.text(row);
      });
      doc.end();
      res.on("close", () => {
        /* stream closed */
      });
      return; // stream response completed
    }
    // default CSV
    const rows = [headers.join(",")];
    (interview.questions || []).forEach((q, idx) => {
      const fm = q.facial || {};
      rows.push(
        [
          idx,
          JSON.stringify(q.category || ""),
          q.difficulty || "",
          q.score && q.score.overall != null ? q.score.overall : "",
          q.timeSpent || "",
          fm.eyeContact != null ? fm.eyeContact : "",
          fm.blinkRate != null ? fm.blinkRate : "",
          fm.smilePercentage != null ? fm.smilePercentage : "",
          fm.headSteadiness != null ? fm.headSteadiness : "",
          fm.offScreenPercentage != null ? fm.offScreenPercentage : "",
          fm.confidenceScore != null ? fm.confidenceScore : "",
        ].join(",")
      );
    });
    const csv = rows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=interview_${interviewId}_metrics.csv`
    );
    return res.status(200).send(csv);
  } catch (e) {
    return fail(res, 500, "METRICS_EXPORT_FAILED", "Failed to export metrics");
  }
}
module.exports.exportInterviewMetrics = exportInterviewMetrics;
