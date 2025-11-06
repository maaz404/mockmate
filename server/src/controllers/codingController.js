const CodingSubmission = require("../models/CodingSubmission");
const { ok, fail, created } = require("../utils/responder");
const Logger = require("../utils/logger");

exports.createCodingSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { language, difficulty, topic, problemStatement } = req.body;

    const session = await CodingSubmission.create({
      user: userId,
      language,
      difficulty,
      topic,
      problemStatement,
      status: "pending",
    });

    return created(res, session, "Coding session created");
  } catch (error) {
    Logger.error("Create coding session error:", error);
    return fail(res, 500, "SESSION_CREATE_FAILED", "Failed to create session");
  }
};

exports.getUserCodingSessions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status, difficulty } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [sessions, total] = await Promise.all([
      CodingSubmission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CodingSubmission.countDocuments(filter),
    ]);

    return ok(res, {
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    Logger.error("Get coding sessions error:", error);
    return fail(res, 500, "SESSIONS_FETCH_FAILED", "Failed to fetch sessions");
  }
};

exports.getCodingSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const session = await CodingSubmission.findOne({ _id: id, user: userId });
    if (!session) {
      return fail(res, 404, "SESSION_NOT_FOUND", "Session not found");
    }

    return ok(res, session);
  } catch (error) {
    Logger.error("Get coding session error:", error);
    return fail(res, 500, "SESSION_FETCH_FAILED", "Failed to fetch session");
  }
};

exports.submitCode = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { code, language } = req.body;

    const session = await CodingSubmission.findOne({ _id: id, user: userId });
    if (!session) {
      return fail(res, 404, "SESSION_NOT_FOUND", "Session not found");
    }

    session.code = code;
    session.language = language;
    session.submittedAt = new Date();
    session.status = "in-progress";

    // TODO: Integrate with Judge0 or other code execution service
    // For now, just save the code
    await session.save();

    return ok(res, session, "Code submitted successfully");
  } catch (error) {
    Logger.error("Submit code error:", error);
    return fail(res, 500, "CODE_SUBMIT_FAILED", "Failed to submit code");
  }
};

exports.completeCodingSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const session = await CodingSubmission.findOneAndUpdate(
      { _id: id, user: userId },
      { status: "completed", completedAt: new Date() },
      { new: true }
    );

    if (!session) {
      return fail(res, 404, "SESSION_NOT_FOUND", "Session not found");
    }

    return ok(res, session, "Session completed");
  } catch (error) {
    Logger.error("Complete session error:", error);
    return fail(
      res,
      500,
      "SESSION_COMPLETE_FAILED",
      "Failed to complete session"
    );
  }
};

exports.runCode = async (req, res) => {
  try {
    // Session-bound run (for future expansion)
    const userId = req.user?.id;
    const { id } = req.params;
    const { code, language, testCases } = req.body;
    void userId; // not used now
    void id;

    const judge0 = require("../services/judge0");
    const result = await judge0.runWithTestCases({ code, language, testCases });
    return ok(res, result, "Run completed");
  } catch (error) {
    Logger.error("Run code error:", error);
    return fail(
      res,
      error.status || 500,
      error.code || "CODE_RUN_FAILED",
      error.message || "Failed to run code"
    );
  }
};

exports.runAdhoc = async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    const judge0 = require("../services/judge0");
    const result = await judge0.runWithTestCases({ code, language, testCases });
    return ok(res, result, "Run completed");
  } catch (error) {
    Logger.error("Run adhoc code error:", error);
    return fail(
      res,
      error.status || 500,
      error.code || "CODE_RUN_FAILED",
      error.message || "Failed to run code"
    );
  }
};

exports.getCodingStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    const stats = await CodingSubmission.aggregate([
      { $match: { user: require("mongoose").Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]);

    return ok(res, { stats });
  } catch (error) {
    Logger.error("Get coding stats error:", error);
    return fail(res, 500, "STATS_FETCH_FAILED", "Failed to fetch stats");
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    // TODO: Implement leaderboard logic
    return ok(res, { leaderboard: [] });
  } catch (error) {
    Logger.error("Get leaderboard error:", error);
    return fail(
      res,
      500,
      "LEADERBOARD_FETCH_FAILED",
      "Failed to fetch leaderboard"
    );
  }
};

exports.saveProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { code, notes } = req.body;

    const session = await CodingSubmission.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { code, notes, lastUpdated: new Date() } },
      { new: true }
    );

    if (!session) {
      return fail(res, 404, "SESSION_NOT_FOUND", "Session not found");
    }

    return ok(res, session, "Progress saved");
  } catch (error) {
    Logger.error("Save progress error:", error);
    return fail(res, 500, "PROGRESS_SAVE_FAILED", "Failed to save progress");
  }
};

exports.deleteCodingSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await CodingSubmission.deleteOne({ _id: id, user: userId });
    if (result.deletedCount === 0) {
      return fail(res, 404, "SESSION_NOT_FOUND", "Session not found");
    }

    return ok(res, null, "Session deleted");
  } catch (error) {
    Logger.error("Delete session error:", error);
    return fail(res, 500, "SESSION_DELETE_FAILED", "Failed to delete session");
  }
};

exports.getChallenges = async (req, res) => {
  try {
    // TODO: Implement challenges catalog
    return ok(res, { challenges: [] });
  } catch (error) {
    Logger.error("Get challenges error:", error);
    return fail(
      res,
      500,
      "CHALLENGES_FETCH_FAILED",
      "Failed to fetch challenges"
    );
  }
};

exports.getChallengeDetails = async (req, res) => {
  try {
    const { challengeId } = req.params;
    // TODO: Implement challenge details
    return ok(res, { challenge: null });
  } catch (error) {
    Logger.error("Get challenge details error:", error);
    return fail(
      res,
      500,
      "CHALLENGE_FETCH_FAILED",
      "Failed to fetch challenge"
    );
  }
};

exports.forkSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const original = await CodingSubmission.findOne({ _id: id, user: userId });
    if (!original) {
      return fail(res, 404, "SESSION_NOT_FOUND", "Session not found");
    }

    const forked = await CodingSubmission.create({
      user: userId,
      language: original.language,
      difficulty: original.difficulty,
      topic: original.topic,
      problemStatement: original.problemStatement,
      code: original.code,
      status: "pending",
      forkedFrom: original._id,
    });

    return created(res, forked, "Session forked successfully");
  } catch (error) {
    Logger.error("Fork session error:", error);
    return fail(res, 500, "SESSION_FORK_FAILED", "Failed to fork session");
  }
};
