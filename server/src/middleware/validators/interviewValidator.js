const { body, param, validationResult } = require("express-validator");

/**
 * SECURITY: Input validation middleware for interview endpoints
 * Prevents injection attacks and ensures data integrity
 *
 * IMPROVEMENT: Centralized validation rules for consistent error handling
 */

// OPTIMIZATION: Define constants for validation
const MIN_DURATION = 5;
const MAX_DURATION = 180; // 3 hours
const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 50;
const MAX_STRING_LENGTH = 500;

// Allowed enum values
const EXPERIENCE_LEVELS = [
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "executive",
];
const INTERVIEW_TYPES = [
  "behavioral",
  "technical",
  "system-design",
  "coding",
  "mixed",
  "general",
  "case-study",
];
const DIFFICULTY_LEVELS = ["easy", "intermediate", "hard", "expert"];

/**
 * Middleware to check for validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Invalid input data",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
      requestId: req.requestId,
    });
  }
  return next();
};

/**
 * Validation rules for creating an interview
 */
const validateCreateInterview = [
  // Config validation
  body("config.jobRole")
    .trim()
    .notEmpty()
    .withMessage("Job role is required")
    .isLength({ max: MAX_STRING_LENGTH })
    .withMessage(`Job role must be less than ${MAX_STRING_LENGTH} characters`),

  body("config.experienceLevel")
    .optional()
    .isIn(EXPERIENCE_LEVELS)
    .withMessage(
      `Experience level must be one of: ${EXPERIENCE_LEVELS.join(", ")}`
    ),

  body("config.interviewType")
    .notEmpty()
    .withMessage("Interview type is required")
    .isIn(INTERVIEW_TYPES)
    .withMessage(
      `Interview type must be one of: ${INTERVIEW_TYPES.join(", ")}`
    ),

  body("config.difficulty")
    .optional()
    .isIn(DIFFICULTY_LEVELS)
    .withMessage(`Difficulty must be one of: ${DIFFICULTY_LEVELS.join(", ")}`),

  body("config.duration")
    .optional()
    .isInt({ min: MIN_DURATION, max: MAX_DURATION })
    .withMessage(
      `Duration must be between ${MIN_DURATION} and ${MAX_DURATION} minutes`
    ),

  body("config.questionCount")
    .optional()
    .isInt({ min: MIN_QUESTION_COUNT, max: MAX_QUESTION_COUNT })
    .withMessage(
      `Question count must be between ${MIN_QUESTION_COUNT} and ${MAX_QUESTION_COUNT}`
    ),

  body("config.skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),

  body("config.skills.*")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Each skill must be less than 100 characters"),

  body("questionIds")
    .optional()
    .isArray()
    .withMessage("Question IDs must be an array"),

  body("questionIds.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid question ID format"),

  handleValidationErrors,
];

/**
 * Validation rules for interview ID parameter
 */
const validateInterviewId = [
  param("id").isMongoId().withMessage("Invalid interview ID format"),

  handleValidationErrors,
];

/**
 * Validation rules for question index parameter
 */
const validateQuestionIndex = [
  param("id").isMongoId().withMessage("Invalid interview ID format"),

  param("questionIndex")
    .isInt({ min: 0 })
    .withMessage("Question index must be a non-negative integer"),

  handleValidationErrors,
];

/**
 * Validation rules for submitting an answer
 */
const validateSubmitAnswer = [
  param("id").isMongoId().withMessage("Invalid interview ID format"),

  param("questionIndex")
    .isInt({ min: 0 })
    .withMessage("Question index must be a non-negative integer"),

  body("answer")
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage("Answer must be less than 10000 characters"),

  body("timeSpent")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Time spent must be a non-negative integer"),

  body("videoData")
    .optional()
    .isObject()
    .withMessage("Video data must be an object"),

  handleValidationErrors,
];

/**
 * Validation rules for updating adaptive difficulty
 */
const validateAdaptiveDifficulty = [
  param("id").isMongoId().withMessage("Invalid interview ID format"),

  body("difficulty")
    .notEmpty()
    .withMessage("Difficulty is required")
    .isIn(DIFFICULTY_LEVELS)
    .withMessage(`Difficulty must be one of: ${DIFFICULTY_LEVELS.join(", ")}`),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason must be less than 500 characters"),

  handleValidationErrors,
];

module.exports = {
  validateCreateInterview,
  validateInterviewId,
  validateQuestionIndex,
  validateSubmitAnswer,
  validateAdaptiveDifficulty,
  handleValidationErrors,
};
