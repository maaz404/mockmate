const Question = require("../models/Question");
const { ok, fail, created } = require("../utils/responder");
const Logger = require("../utils/logger");

exports.generateQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const config = req.body;

    // TODO: Integrate with AI service to generate questions
    const questions = [];

    return ok(res, { questions });
  } catch (error) {
    Logger.error("Generate questions error:", error);
    return fail(res, 500, "GENERATION_FAILED", "Failed to generate questions");
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, category, difficulty } = req.query;

    const filter = { user: userId };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Question.countDocuments(filter),
    ]);

    return ok(res, {
      questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    Logger.error("Get questions error:", error);
    return fail(
      res,
      500,
      "QUESTIONS_FETCH_FAILED",
      "Failed to fetch questions"
    );
  }
};

exports.saveQuestion = async (req, res) => {
  try {
    const userId = req.user?.id;
    const questionData = { ...req.body, user: userId };

    const question = await Question.create(questionData);
    return created(res, question, "Question saved");
  } catch (error) {
    Logger.error("Save question error:", error);
    return fail(res, 500, "QUESTION_SAVE_FAILED", "Failed to save question");
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await Question.deleteOne({ _id: id, user: userId });
    if (result.deletedCount === 0) {
      return fail(res, 404, "QUESTION_NOT_FOUND", "Question not found");
    }

    return ok(res, null, "Question deleted");
  } catch (error) {
    Logger.error("Delete question error:", error);
    return fail(
      res,
      500,
      "QUESTION_DELETE_FAILED",
      "Failed to delete question"
    );
  }
};
