const Question = require("../models/Question");
const questionService = require("../services/questionService");
const { ok, fail, created } = require("../utils/responder");
const Logger = require("../utils/logger");

/**
 * Generate questions for interview
 * POST /api/questions/generate
 */
exports.generateQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const config = {
      ...req.body,
      userId,
    };

    // Validate config
    if (!config.interviewType) {
      return fail(
        res,
        400,
        "MISSING_INTERVIEW_TYPE",
        "Interview type is required"
      );
    }

    if (
      !config.questionCount ||
      config.questionCount < 1 ||
      config.questionCount > 20
    ) {
      return fail(
        res,
        400,
        "INVALID_QUESTION_COUNT",
        "Question count must be between 1 and 20"
      );
    }

    // Generate questions
    const questions = await questionService.generateQuestions(config);

    return ok(
      res,
      { questions, count: questions.length },
      "Questions generated successfully"
    );
  } catch (error) {
    Logger.error("Generate questions error:", error);
    return fail(res, 500, "GENERATION_FAILED", "Failed to generate questions");
  }
};

/**
 * Generate questions with AI
 * POST /api/questions/generate-ai
 *
 * SIMPLIFIED: Now uses database questions only (Python service disabled)
 */
exports.generateQuestionsWithAI = async (req, res) => {
  try {
    const userId = req.user?.id;
    const config = {
      ...req.body,
      userId,
    };

    // SIMPLIFIED: Just use database questions (no Python service, no AI calls)
    // This is faster, cheaper, and works reliably
    const questions = await questionService.generateQuestions(config);

    return ok(
      res,
      {
        questions,
        count: questions.length,
        generation_method: "database",
      },
      "Questions generated successfully"
    );
  } catch (error) {
    Logger.error("Generate questions error:", error);
    return fail(res, 500, "GENERATION_FAILED", "Failed to generate questions");
  }
};

/**
 * Get questions with filters
 * GET /api/questions
 */
exports.getQuestions = async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      difficulty: req.query.difficulty,
      category: req.query.category,
      tags: req.query.tags ? req.query.tags.split(",") : undefined,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      skip: parseInt(req.query.skip) || 0,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await questionService.getQuestions(filters);

    return ok(res, result, "Questions retrieved successfully");
  } catch (error) {
    Logger.error("Get questions error:", error);
    return fail(res, 500, "FETCH_FAILED", "Failed to fetch questions");
  }
};

/**
 * Get question categories
 * GET /api/questions/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await questionService.getCategories();
    return ok(res, { categories }, "Categories retrieved successfully");
  } catch (error) {
    Logger.error("Get categories error:", error);
    return fail(res, 500, "FETCH_FAILED", "Failed to fetch categories");
  }
};

/**
 * Get question statistics
 * GET /api/questions/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const stats = await questionService.getStatistics();
    return ok(res, stats, "Statistics retrieved successfully");
  } catch (error) {
    Logger.error("Get statistics error:", error);
    return fail(res, 500, "FETCH_FAILED", "Failed to fetch statistics");
  }
};

/**
 * Save/Create a custom question
 * POST /api/questions
 */
exports.saveQuestion = async (req, res) => {
  try {
    const userId = req.user?.id;
    const questionData = {
      ...req.body,
      createdBy: userId,
      source: "user-created",
      isActive: true,
    };

    // Validate required fields
    if (
      !questionData.question ||
      !questionData.type ||
      !questionData.difficulty
    ) {
      return fail(
        res,
        400,
        "MISSING_FIELDS",
        "Question, type, and difficulty are required"
      );
    }

    const question = await Question.create(questionData);

    return created(res, question, "Question created successfully");
  } catch (error) {
    Logger.error("Save question error:", error);
    return fail(res, 500, "SAVE_FAILED", "Failed to save question");
  }
};

/**
 * Update a question
 * PUT /api/questions/:id
 */
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow changing critical fields
    delete updates.usageCount;
    delete updates.averageScore;
    delete updates.createdBy;

    const question = await Question.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!question) {
      return fail(res, 404, "QUESTION_NOT_FOUND", "Question not found");
    }

    return ok(res, question, "Question updated successfully");
  } catch (error) {
    Logger.error("Update question error:", error);
    return fail(res, 500, "UPDATE_FAILED", "Failed to update question");
  }
};

/**
 * Delete a question
 * DELETE /api/questions/:id
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const question = await Question.findById(id);

    if (!question) {
      return fail(res, 404, "QUESTION_NOT_FOUND", "Question not found");
    }

    // Only allow deletion of user-created questions or if admin
    if (
      question.createdBy?.toString() !== userId &&
      req.user?.role !== "admin"
    ) {
      return fail(
        res,
        403,
        "FORBIDDEN",
        "You can only delete your own questions"
      );
    }

    // Soft delete (deactivate)
    question.isActive = false;
    await question.save();

    return ok(res, { id }, "Question deleted successfully");
  } catch (error) {
    Logger.error("Delete question error:", error);
    return fail(res, 500, "DELETE_FAILED", "Failed to delete question");
  }
};

/**
 * Get a single question by ID
 * GET /api/questions/:id
 */
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question || !question.isActive) {
      return fail(res, 404, "QUESTION_NOT_FOUND", "Question not found");
    }

    return ok(res, question, "Question retrieved successfully");
  } catch (error) {
    Logger.error("Get question error:", error);
    return fail(res, 500, "FETCH_FAILED", "Failed to fetch question");
  }
};
