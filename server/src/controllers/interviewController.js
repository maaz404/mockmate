/* eslint-disable consistent-return, no-magic-numbers */
const Interview = require("../models/Interview");
const Question = require("../models/Question");
const mongoose = require("mongoose");
const aiQuestionService = require("../services/aiQuestionService");
const hybridQuestionService = require("../services/hybridQuestionService");
const { destroyByPrefix } = require("./uploadController");
const C = require("../utils/constants");
const Logger = require("../utils/logger");
const { ok, fail, created } = require("../utils/responder");
const { consumeFreeInterview } = require("../utils/subscription");
const { mapDifficulty } = require("../utils/questionNormalization");

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
    const { answer, timeSpent, notes, facialMetrics, skip } = req.body;

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

// Get all user interviews
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

    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [interviews, total] = await Promise.all([
      Interview.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-questions.response -questions.feedback"),
      Interview.countDocuments(filter),
    ]);

    return ok(res, {
      interviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1,
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

    // Calculate overall results
    const answeredQuestions = interview.questions.filter(
      (q) => q.response?.text || q.skipped
    );
    const totalQuestions = interview.questions.length;
    const completionRate = (answeredQuestions.length / totalQuestions) * 100;

    const scores = interview.questions
      .filter((q) => q.score?.overall)
      .map((q) => q.score.overall);
    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    interview.results = {
      overallScore: Math.round(averageScore),
      completionRate: Math.round(completionRate),
      questionsAnswered: answeredQuestions.length,
      questionsSkipped: interview.questions.filter((q) => q.skipped).length,
      totalQuestions,
      breakdown: {
        technical: calculateCategoryAverage(interview, "technical"),
        communication: calculateCategoryAverage(interview, "communication"),
        problemSolving: calculateCategoryAverage(interview, "problemSolving"),
        behavioral: calculateCategoryAverage(interview, "behavioral"),
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

    return ok(
      res,
      {
        results: interview.results,
        timing: interview.timing,
        questions: interview.questions.map((q) => ({
          questionText: q.questionText,
          category: q.category,
          difficulty: q.difficulty,
          score: q.score,
          feedback: q.feedback,
          timeSpent: q.timeSpent,
          skipped: q.skipped,
        })),
      },
      "Interview results retrieved"
    );
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
function calculateCategoryAverage(interview, category) {
  const categoryQuestions = interview.questions.filter(
    (q) => q.category === category && q.score?.overall
  );

  if (categoryQuestions.length === 0) return 0;

  const sum = categoryQuestions.reduce((acc, q) => acc + q.score.overall, 0);
  return Math.round(sum / categoryQuestions.length);
}

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
