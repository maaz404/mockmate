/* eslint-disable consistent-return, no-magic-numbers, no-console */
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const ensureUserProfile = require("../middleware/ensureUserProfile");
const codingController = require("../controllers/codingController");
const { body, param, query, validationResult } = require("express-validator");
const Logger = require("../utils/logger");

/**
 * Coding Challenge Routes
 * Base: /api/coding
 */

// Validation middleware
const validateCreateSession = [
  body("language")
    .isIn(["javascript", "python", "java", "cpp", "go"])
    .withMessage("Invalid language"),
  body("difficulty")
    .isIn(["easy", "medium", "hard"])
    .withMessage("Invalid difficulty"),
  body("topic").optional().isString(),
];

const validateSubmitCode = [
  param("id").isMongoId().withMessage("Invalid session ID"),
  body("code").isString().notEmpty().withMessage("Code is required"),
  body("language").isString().notEmpty().withMessage("Language is required"),
];

const validateGetSession = [
  param("id").isMongoId().withMessage("Invalid session ID"),
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// @desc    Create a new coding session
// @route   POST /api/coding/sessions
// @access  Private
router.post(
  "/sessions",
  requireAuth,
  ensureUserProfile,
  validateCreateSession,
  handleValidationErrors,
  codingController.createCodingSession
);

// @desc    Get all user's coding sessions
// @route   GET /api/coding/sessions
// @access  Private
router.get(
  "/sessions",
  requireAuth,
  ensureUserProfile,
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("status")
      .optional()
      .isIn(["pending", "in-progress", "completed", "failed"]),
    query("difficulty").optional().isIn(["easy", "medium", "hard"]),
  ],
  handleValidationErrors,
  codingController.getUserCodingSessions
);

// @desc    Get specific coding session
// @route   GET /api/coding/sessions/:id
// @access  Private
router.get(
  "/sessions/:id",
  requireAuth,
  ensureUserProfile,
  validateGetSession,
  handleValidationErrors,
  codingController.getCodingSession
);

// @desc    Submit code for evaluation
// @route   POST /api/coding/sessions/:id/submit
// @access  Private
router.post(
  "/sessions/:id/submit",
  requireAuth,
  ensureUserProfile,
  validateSubmitCode,
  handleValidationErrors,
  codingController.submitCode
);

// @desc    Complete coding session
// @route   POST /api/coding/sessions/:id/complete
// @access  Private
router.post(
  "/sessions/:id/complete",
  requireAuth,
  ensureUserProfile,
  validateGetSession,
  handleValidationErrors,
  codingController.completeCodingSession
);

// @desc    Run code (without submission)
// @route   POST /api/coding/sessions/:id/run
// @access  Private
router.post(
  "/sessions/:id/run",
  requireAuth,
  ensureUserProfile,
  [
    param("id").isMongoId().withMessage("Invalid session ID"),
    body("code").isString().notEmpty().withMessage("Code is required"),
    body("language").isString().notEmpty().withMessage("Language is required"),
    body("testCases").optional().isArray(),
  ],
  handleValidationErrors,
  codingController.runCode
);

// @desc    Run code ad-hoc (no session)
// @route   POST /api/coding/run
// @access  Private
router.post(
  "/run",
  requireAuth,
  ensureUserProfile,
  [
    body("code").isString().notEmpty().withMessage("Code is required"),
    body("language")
      .isIn([
        "javascript",
        "typescript",
        "python",
        "java",
        "cpp",
        "c",
        "csharp",
      ])
      .withMessage("Invalid language"),
    body("testCases").optional().isArray(),
  ],
  handleValidationErrors,
  codingController.runAdhoc
);

// @desc    Test code against predefined challenge (stateless)
// @route   POST /api/coding/test
// @access  Private
router.post(
  "/test",
  requireAuth,
  ensureUserProfile,
  [
    body("code").isString().notEmpty().withMessage("Code is required"),
    body("language")
      .isIn(["javascript", "python", "java"])
      .withMessage("Invalid language"),
    body("challengeId")
      .isString()
      .notEmpty()
      .withMessage("Challenge ID required"),
  ],
  handleValidationErrors,
  codingController.testCode
);

// @desc    Get coding statistics
// @route   GET /api/coding/stats
// @access  Private
router.get(
  "/stats",
  requireAuth,
  ensureUserProfile,
  codingController.getCodingStats
);

// @desc    Get coding leaderboard
// @route   GET /api/coding/leaderboard
// @access  Private
router.get(
  "/leaderboard",
  requireAuth,
  [
    query("timeframe").optional().isIn(["weekly", "monthly", "all-time"]),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  codingController.getLeaderboard
);

// @desc    Save coding session progress
// @route   PATCH /api/coding/sessions/:id/progress
// @access  Private
router.patch(
  "/sessions/:id/progress",
  requireAuth,
  ensureUserProfile,
  [
    param("id").isMongoId().withMessage("Invalid session ID"),
    body("code").optional().isString(),
    body("notes").optional().isString(),
  ],
  handleValidationErrors,
  codingController.saveProgress
);

// @desc    Delete coding session
// @route   DELETE /api/coding/sessions/:id
// @access  Private
router.delete(
  "/sessions/:id",
  requireAuth,
  ensureUserProfile,
  validateGetSession,
  handleValidationErrors,
  codingController.deleteCodingSession
);

// @desc    Get coding challenges catalog
// @route   GET /api/coding/challenges
// @access  Private
router.get(
  "/challenges",
  requireAuth,
  [
    query("difficulty").optional().isIn(["easy", "medium", "hard"]),
    query("topic").optional().isString(),
    query("language").optional().isString(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  handleValidationErrors,
  codingController.getChallenges
);

// @desc    Get specific challenge details
// @route   GET /api/coding/challenges/:challengeId
// @access  Private
router.get(
  "/challenges/:challengeId",
  requireAuth,
  [param("challengeId").isMongoId().withMessage("Invalid challenge ID")],
  handleValidationErrors,
  codingController.getChallengeDetails
);

// @desc    Fork an existing session
// @route   POST /api/coding/sessions/:id/fork
// @access  Private
router.post(
  "/sessions/:id/fork",
  requireAuth,
  ensureUserProfile,
  validateGetSession,
  handleValidationErrors,
  codingController.forkSession
);

// Error handling middleware
router.use((error, req, res, next) => {
  Logger.error("Coding route error:", error);
  res.status(error.status || 500).json({
    success: false,
    code: error.code || "INTERNAL_ERROR",
    message: error.message || "An error occurred in coding routes",
  });
});

module.exports = router;
