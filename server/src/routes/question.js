const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const hybridQuestionService = require("../services/hybridQuestionService");
const ensureUserProfile = require("../middleware/ensureUserProfile");
const { ok, fail } = require("../utils/responder");
const Logger = require("../utils/logger");
const DEFAULT_QUESTION_COUNT = 10; // eslint-disable-line no-magic-numbers

// @desc    Generate hybrid questions for interview session
// @route   POST /api/questions/generate
// @access  Private
router.post("/generate", requireAuth, ensureUserProfile, async (req, res) => {
  try {
    const { config } = req.body || {};
    if (!config) {
      return fail(res, 400, "MISSING_CONFIG", "Configuration payload required");
    }
    const { jobRole, experienceLevel, interviewType } = config;
    if (!jobRole || !experienceLevel || !interviewType) {
      return fail(
        res,
        400,
        "INVALID_CONFIG",
        "Missing required configuration parameters",
        {
          jobRole: !jobRole && "jobRole required",
          experienceLevel: !experienceLevel && "experienceLevel required",
          interviewType: !interviewType && "interviewType required",
        }
      );
    }

    const questionConfig = {
      jobRole,
      experienceLevel,
      interviewType,
      difficulty: config.difficulty || "intermediate",
      questionCount: config.questionCount || DEFAULT_QUESTION_COUNT,
    };

    const questions = await hybridQuestionService.generateHybridQuestions(
      questionConfig
    );

    return ok(
      res,
      {
        questions,
        config: questionConfig,
        metadata: {
          totalQuestions: questions.length,
          sourceBreakdown: questions.reduce((acc, q) => {
            acc[q.source] = (acc[q.source] || 0) + 1;
            return acc;
          }, {}),
          tagCoverage: [...new Set(questions.flatMap((q) => q.tags || []))],
        },
      },
      "Questions generated successfully"
    );
  } catch (error) {
    Logger.error("Generate questions error:", error);
    return fail(
      res,
      500,
      "QUESTION_GENERATION_FAILED",
      "Failed to generate questions",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
  }
});

// @desc    Generate questions for a specific high-level category (behavioral|technical|system-design)
// @route   POST /api/questions/generate/:category
// @access  Private
router.post(
  "/generate/:category",
  requireAuth,
  ensureUserProfile,
  async (req, res) => {
    try {
      const { config } = req.body || {};
      const { category } = req.params;
      if (!config) {
        return fail(
          res,
          400,
          "MISSING_CONFIG",
          "Configuration payload required"
        );
      }
      const { jobRole, experienceLevel, interviewType } = config;
      if (!jobRole || !experienceLevel || !interviewType) {
        return fail(
          res,
          400,
          "INVALID_CONFIG",
          "Missing required configuration parameters",
          {
            jobRole: !jobRole && "jobRole required",
            experienceLevel: !experienceLevel && "experienceLevel required",
            interviewType: !interviewType && "interviewType required",
          }
        );
      }
      const questionConfig = {
        jobRole,
        experienceLevel,
        interviewType,
        difficulty: config.difficulty || "intermediate",
        questionCount: config.questionCount || DEFAULT_QUESTION_COUNT,
        category,
      };
      const questions = await hybridQuestionService.generateHybridQuestions(
        questionConfig
      );
      return ok(res, {
        questions,
        config: questionConfig,
        metadata: {
          totalQuestions: questions.length,
          category,
          sourceBreakdown: questions.reduce((acc, q) => {
            acc[q.source] = (acc[q.source] || 0) + 1;
            return acc;
          }, {}),
          tagCoverage: [...new Set(questions.flatMap((q) => q.tags || []))],
        },
      });
    } catch (error) {
      Logger.error("Category generate questions error:", error);
      return fail(
        res,
        500,
        "QUESTION_GENERATION_FAILED",
        "Failed to generate category questions",
        process.env.NODE_ENV === "development"
          ? { detail: error.message }
          : undefined
      );
    }
  }
);

// @desc    Get question templates for a role and difficulty
// @route   GET /api/questions/templates
// @access  Private
router.get("/templates", requireAuth, ensureUserProfile, async (req, res) => {
  try {
    const { jobRole, experienceLevel, interviewType } = req.query;

    if (!jobRole || !experienceLevel) {
      return fail(
        res,
        400,
        "INVALID_QUERY",
        "jobRole and experienceLevel are required"
      );
    }

    // Load templates
    await hybridQuestionService.loadTemplates();
    const templates = hybridQuestionService.templates;

    const roleTemplates = templates[jobRole] || templates["software-engineer"];
    const levelTemplates =
      roleTemplates[experienceLevel] || roleTemplates["intermediate"];

    let questions = [];
    if (interviewType && levelTemplates[interviewType]) {
      questions = levelTemplates[interviewType];
    } else {
      // Return all types
      questions = {
        technical: levelTemplates.technical || [],
        behavioral: levelTemplates.behavioral || [],
      };
    }

    return ok(res, { jobRole, experienceLevel, interviewType, questions });
  } catch (error) {
    Logger.error("Get templates error:", error);
    return fail(
      res,
      500,
      "TEMPLATE_FETCH_FAILED",
      "Failed to fetch question templates"
    );
  }
});

// @desc    Get cache statistics
// @route   GET /api/questions/cache/stats
// @access  Private
router.get("/cache/stats", requireAuth, ensureUserProfile, async (req, res) => {
  try {
    const stats = await hybridQuestionService.getCacheStats();
    return ok(res, stats);
  } catch (error) {
    Logger.error("Get cache stats error:", error);
    return fail(
      res,
      500,
      "CACHE_STATS_FAILED",
      "Failed to get cache statistics"
    );
  }
});

// @desc    Clear expired cache entries
// @route   DELETE /api/questions/cache/expired
// @access  Private
router.delete(
  "/cache/expired",
  requireAuth,
  ensureUserProfile,
  async (req, res) => {
    try {
      await hybridQuestionService.clearExpiredCache();
      return ok(res, null, "Expired cache entries cleared successfully");
    } catch (error) {
      Logger.error("Clear cache error:", error);
      return fail(
        res,
        500,
        "CACHE_CLEAR_FAILED",
        "Failed to clear expired cache"
      );
    }
  }
);

module.exports = router;
