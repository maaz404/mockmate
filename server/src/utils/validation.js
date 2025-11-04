const Logger = require("./logger");

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
  const errors = [];
  const MIN_LENGTH = 8;

  if (!password || password.length < MIN_LENGTH) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input
 * @param {string} input
 * @returns {string}
 */
function sanitizeString(input) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, "");
}

/**
 * Validate MongoDB ObjectId
 * @param {string} id
 * @returns {boolean}
 */
function isValidObjectId(id) {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}

/**
 * Validate interview configuration
 * @param {Object} config
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateInterviewConfig(config) {
  const errors = [];

  if (!config.jobRole || typeof config.jobRole !== "string") {
    errors.push("Job role is required");
  }

  const validExperienceLevels = [
    "entry",
    "junior",
    "mid",
    "senior",
    "lead",
    "executive",
  ];
  if (!validExperienceLevels.includes(config.experienceLevel)) {
    errors.push("Invalid experience level");
  }

  const validInterviewTypes = [
    "technical",
    "behavioral",
    "system-design",
    "case-study",
    "mixed",
  ];
  if (!validInterviewTypes.includes(config.interviewType)) {
    errors.push("Invalid interview type");
  }

  const validDifficulties = ["beginner", "intermediate", "advanced"];
  if (!validDifficulties.includes(config.difficulty)) {
    errors.push("Invalid difficulty level");
  }

  const MIN_DURATION = 15;
  const MAX_DURATION = 120;
  if (config.duration < MIN_DURATION || config.duration > MAX_DURATION) {
    errors.push(
      `Duration must be between ${MIN_DURATION} and ${MAX_DURATION} minutes`
    );
  }

  const MIN_QUESTIONS = 5;
  const MAX_QUESTIONS = 50;
  if (
    config.questionCount < MIN_QUESTIONS ||
    config.questionCount > MAX_QUESTIONS
  ) {
    errors.push(
      `Question count must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate coding session configuration
 * @param {Object} config
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateCodingConfig(config) {
  const errors = [];

  const validLanguages = [
    "javascript",
    "python",
    "java",
    "cpp",
    "go",
    "typescript",
  ];
  if (!validLanguages.includes(config.language)) {
    errors.push("Invalid programming language");
  }

  const validDifficulties = ["easy", "medium", "hard"];
  if (!validDifficulties.includes(config.difficulty)) {
    errors.push("Invalid difficulty level");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  isValidEmail,
  validatePassword,
  sanitizeString,
  isValidObjectId,
  validateInterviewConfig,
  validateCodingConfig,
};
