const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const hybridQuestionService = require("../services/hybridQuestionService");
const ensureUserProfile = require("../middleware/ensureUserProfile");
const { ok, fail } = require("../utils/responder");
const Logger = require("../utils/logger");
const { body, query, param, validationResult } = require("express-validator");

/**
 * Question Management Routes
 * Base: /api/questions
 */

// Validation middleware
const validateGenerateQuestions = [
  body("jobRole").isString().notEmpty().withMessage("Job role is required"),
  body("experienceLevel")
    .isIn(["entry", "mid", "senior", "lead"])
    .withMessage("Invalid experience level"),
  body("interviewType")
    .isIn(["technical", "behavioral", "mixed"])
    .withMessage("Invalid interview type"),
  body("count")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Count must be between 1 and 50"),
  body("difficulty").optional().isIn(["easy", "medium", "hard"]),
  body("focusAreas").optional().isArray(),
];

const validateSaveQuestion = [
  body("questionText")
    .isString()
    .notEmpty()
    .withMessage("Question text is required"),
  body("category").optional().isString(),
  body("difficulty").optional().isIn(["easy", "medium", "hard"]),
  body("tags").optional().isArray(),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "VALIDATION_ERROR", "Validation failed", {
      errors: errors.array(),
    });
  }
  next();
};

// @desc    Generate AI questions
// @route   POST /api/questions/generate
// @access  Private
router.post(
  "/generate",
  requireAuth,
  ensureUserProfile,
  validateGenerateQuestions,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const config = {
        jobRole: req.body.jobRole,
        experienceLevel: req.body.experienceLevel,
        interviewType: req.body.interviewType,
        count: req.body.count || 10,
        difficulty: req.body.difficulty,
        focusAreas: req.body.focusAreas || [],
        customPrompt: req.body.customPrompt,
      };

      Logger.info(`Generating questions for user ${userId}`, { config });

      const result = await hybridQuestionService.generateQuestions(
        config,
        userId
      );

      if (!result.success) {
        return fail(
          res,
          500,
          "GENERATION_FAILED",
          result.error || "Failed to generate questions"
        );
      }

      return ok(
        res,
        {
          questions: result.questions,
          metadata: {
            totalGenerated: result.questions.length,
            source: result.source || "ai",
            cacheUsed: result.fromCache || false,
            config,
          },
        },
        "Questions generated successfully"
      );
    } catch (error) {
      Logger.error("Generate questions error:", error);
      return fail(res, 500, "GENERATION_ERROR", "Failed to generate questions");
    }
  }
);

// @desc    Get saved questions
// @route   GET /api/questions
// @access  Private
router.get(
  "/",
  requireAuth,
  ensureUserProfile,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category").optional().isString(),
    query("difficulty").optional().isIn(["easy", "medium", "hard"]),
    query("search").optional().isString(),
    query("tags").optional().isString(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const {
        page = 1,
        limit = 20,
        category,
        difficulty,
        search,
        tags,
      } = req.query;

      const filter = { user: userId };
      if (category) filter.category = category;
      if (difficulty) filter.difficulty = difficulty;
      if (search) {
        filter.$or = [
          { questionText: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ];
      }
      if (tags) {
        const tagArray = tags.split(",").map((t) => t.trim());
        filter.tags = { $in: tagArray };
      }

      const Question = require("../models/Question");

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [questions, total] = await Promise.all([
        Question.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Question.countDocuments(filter),
      ]);

      return ok(
        res,
        {
          questions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalQuestions: total,
            hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
            hasPrevPage: parseInt(page) > 1,
          },
        },
        "Questions retrieved successfully"
      );
    } catch (error) {
      Logger.error("Get questions error:", error);
      return fail(res, 500, "FETCH_ERROR", "Failed to fetch questions");
    }
  }
);

// @desc    Get question by ID
// @route   GET /api/questions/:id
// @access  Private
router.get(
  "/:id",
  requireAuth,
  ensureUserProfile,
  [param("id").isMongoId().withMessage("Invalid question ID")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const Question = require("../models/Question");
      const question = await Question.findOne({ _id: id, user: userId });

      if (!question) {
        return fail(res, 404, "NOT_FOUND", "Question not found");
      }

      return ok(res, { question }, "Question retrieved successfully");
    } catch (error) {
      Logger.error("Get question error:", error);
      return fail(res, 500, "FETCH_ERROR", "Failed to fetch question");
    }
  }
);

// @desc    Save question
// @route   POST /api/questions
// @access  Private
router.post(
  "/",
  requireAuth,
  ensureUserProfile,
  validateSaveQuestion,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const questionData = {
        ...req.body,
        user: userId,
      };

      const Question = require("../models/Question");
      const question = await Question.create(questionData);

      Logger.info(`Question saved for user ${userId}`, {
        questionId: question._id,
      });

      return ok(res, { question }, "Question saved successfully");
    } catch (error) {
      Logger.error("Save question error:", error);
      return fail(res, 500, "SAVE_ERROR", "Failed to save question");
    }
  }
);

// @desc    Update question
// @route   PATCH /api/questions/:id
// @access  Private
router.patch(
  "/:id",
  requireAuth,
  ensureUserProfile,
  [
    param("id").isMongoId().withMessage("Invalid question ID"),
    body("questionText").optional().isString(),
    body("category").optional().isString(),
    body("difficulty").optional().isIn(["easy", "medium", "hard"]),
    body("tags").optional().isArray(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const Question = require("../models/Question");
      const question = await Question.findOneAndUpdate(
        { _id: id, user: userId },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!question) {
        return fail(res, 404, "NOT_FOUND", "Question not found");
      }

      return ok(res, { question }, "Question updated successfully");
    } catch (error) {
      Logger.error("Update question error:", error);
      return fail(res, 500, "UPDATE_ERROR", "Failed to update question");
    }
  }
);

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
router.delete(
  "/:id",
  requireAuth,
  ensureUserProfile,
  [param("id").isMongoId().withMessage("Invalid question ID")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const Question = require("../models/Question");
      const result = await Question.deleteOne({ _id: id, user: userId });

      if (result.deletedCount === 0) {
        return fail(res, 404, "NOT_FOUND", "Question not found");
      }

      Logger.info(`Question deleted for user ${userId}`, { questionId: id });

      return ok(res, null, "Question deleted successfully");
    } catch (error) {
      Logger.error("Delete question error:", error);
      return fail(res, 500, "DELETE_ERROR", "Failed to delete question");
    }
  }
);

// @desc    Bulk delete questions
// @route   POST /api/questions/bulk-delete
// @access  Private
router.post(
  "/bulk-delete",
  requireAuth,
  ensureUserProfile,
  [
    body("questionIds")
      .isArray()
      .notEmpty()
      .withMessage("Question IDs array is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { questionIds } = req.body;

      const Question = require("../models/Question");
      const result = await Question.deleteMany({
        _id: { $in: questionIds },
        user: userId,
      });

      Logger.info(`Bulk delete for user ${userId}`, {
        deletedCount: result.deletedCount,
      });

      return ok(
        res,
        {
          deletedCount: result.deletedCount,
        },
        `${result.deletedCount} question(s) deleted successfully`
      );
    } catch (error) {
      Logger.error("Bulk delete error:", error);
      return fail(res, 500, "DELETE_ERROR", "Failed to delete questions");
    }
  }
);

// @desc    Get question categories
// @route   GET /api/questions/categories
// @access  Private
router.get(
  "/meta/categories",
  requireAuth,
  ensureUserProfile,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      const Question = require("../models/Question");
      const categories = await Question.distinct("category", { user: userId });

      return ok(res, { categories }, "Categories retrieved successfully");
    } catch (error) {
      Logger.error("Get categories error:", error);
      return fail(res, 500, "FETCH_ERROR", "Failed to fetch categories");
    }
  }
);

// @desc    Get question statistics
// @route   GET /api/questions/stats
// @access  Private
router.get("/meta/stats", requireAuth, ensureUserProfile, async (req, res) => {
  try {
    const userId = req.user?.id;

    const Question = require("../models/Question");
    const [total, byDifficulty, byCategory] = await Promise.all([
      Question.countDocuments({ user: userId }),
      Question.aggregate([
        { $match: { user: require("mongoose").Types.ObjectId(userId) } },
        { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      ]),
      Question.aggregate([
        { $match: { user: require("mongoose").Types.ObjectId(userId) } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return ok(
      res,
      {
        total,
        byDifficulty: byDifficulty.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topCategories: byCategory.map((item) => ({
          category: item._id,
          count: item.count,
        })),
      },
      "Statistics retrieved successfully"
    );
  } catch (error) {
    Logger.error("Get stats error:", error);
    return fail(res, 500, "FETCH_ERROR", "Failed to fetch statistics");
  }
});

module.exports = router;
