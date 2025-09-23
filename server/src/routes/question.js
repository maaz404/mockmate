const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const hybridQuestionService = require("../services/hybridQuestionService");

// @desc    Generate hybrid questions for interview session
// @route   POST /api/questions/generate
// @access  Private
router.post("/generate", requireAuth, async (req, res) => {
  try {
    const { config } = req.body;

    // Validate configuration
    if (!config || !config.jobRole || !config.experienceLevel || !config.interviewType) {
      return res.status(400).json({
        success: false,
        message: "Missing required configuration parameters",
      });
    }

    // Set defaults
    const questionConfig = {
      jobRole: config.jobRole,
      experienceLevel: config.experienceLevel,
      interviewType: config.interviewType,
      difficulty: config.difficulty || config.experienceLevel,
      questionCount: config.questionCount || 10,
    };

    // Generate hybrid questions
    const questions = await hybridQuestionService.generateHybridQuestions(questionConfig);

    res.status(200).json({
      success: true,
      message: "Questions generated successfully",
      data: {
        questions,
        config: questionConfig,
        metadata: {
          totalQuestions: questions.length,
          sourceBreakdown: questions.reduce((acc, q) => {
            acc[q.source] = (acc[q.source] || 0) + 1;
            return acc;
          }, {}),
          tagCoverage: [...new Set(questions.flatMap(q => q.tags || []))],
        },
      },
    });
  } catch (error) {
    console.error("Generate questions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate questions",
      error: error.message,
    });
  }
});

// @desc    Get question templates for a role and difficulty
// @route   GET /api/questions/templates
// @access  Private
router.get("/templates", requireAuth, async (req, res) => {
  try {
    const { jobRole, experienceLevel, interviewType } = req.query;

    if (!jobRole || !experienceLevel) {
      return res.status(400).json({
        success: false,
        message: "jobRole and experienceLevel are required",
      });
    }

    // Load templates
    await hybridQuestionService.loadTemplates();
    const templates = hybridQuestionService.templates;

    const roleTemplates = templates[jobRole] || templates["software-engineer"];
    const levelTemplates = roleTemplates[experienceLevel] || roleTemplates["intermediate"];

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

    res.json({
      success: true,
      data: {
        jobRole,
        experienceLevel,
        interviewType,
        questions,
      },
    });
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch question templates",
    });
  }
});

// @desc    Get cache statistics
// @route   GET /api/questions/cache/stats
// @access  Private
router.get("/cache/stats", requireAuth, async (req, res) => {
  try {
    const stats = await hybridQuestionService.getCacheStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get cache stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cache statistics",
    });
  }
});

// @desc    Clear expired cache entries
// @route   DELETE /api/questions/cache/expired
// @access  Private
router.delete("/cache/expired", requireAuth, async (req, res) => {
  try {
    await hybridQuestionService.clearExpiredCache();
    res.json({
      success: true,
      message: "Expired cache entries cleared successfully",
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear expired cache",
    });
  }
});

module.exports = router;
