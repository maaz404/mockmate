const Logger = require("../utils/logger");

// OPTIMIZATION: Define constants for HTTP status codes
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const MONGO_DUPLICATE_KEY_ERROR = 11000;

/**
 * Global error handling middleware
 * This should be the last middleware in the stack
 *
 * IMPROVEMENT: Standardized error responses with proper logging
 * MIGRATION: Added proper error codes for frontend consumption
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  let errorCode = "INTERNAL_ERROR";

  // IMPROVEMENT: Use Logger utility instead of console.error
  Logger.error(`Error in ${req.method} ${req.path}:`, {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    userId: req.userId || "anonymous",
  });

  // Mongoose bad ObjectId (invalid format)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = { message, statusCode: HTTP_STATUS.NOT_FOUND };
    errorCode = "INVALID_ID";
  }

  // Mongoose duplicate key error (unique constraint violation)
  if (err.code === MONGO_DUPLICATE_KEY_ERROR) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    const message = `${field} already exists`;
    error = { message, statusCode: HTTP_STATUS.BAD_REQUEST };
    errorCode = "DUPLICATE_ENTRY";
  }

  // Mongoose validation error (schema validation failed)
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = { message, statusCode: HTTP_STATUS.BAD_REQUEST };
    errorCode = "VALIDATION_ERROR";
  }

  // JWT errors (legacy, for backward compatibility)
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid authentication token";
    error = { message, statusCode: HTTP_STATUS.UNAUTHORIZED };
    errorCode = "INVALID_TOKEN";
  }

  if (err.name === "TokenExpiredError") {
    const message = "Authentication token has expired";
    error = { message, statusCode: HTTP_STATUS.UNAUTHORIZED };
    errorCode = "TOKEN_EXPIRED";
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    const message = `File upload error: ${err.message}`;
    error = { message, statusCode: HTTP_STATUS.BAD_REQUEST };
    errorCode = "UPLOAD_ERROR";
  }

  const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // SECURITY: Don't expose internal error details in production
  const responseError =
    process.env.NODE_ENV === "production"
      ? status === HTTP_STATUS.INTERNAL_SERVER_ERROR
        ? "An internal server error occurred"
        : error.message
      : error.message || "Server Error";

  res.status(status).json({
    success: false,
    error: responseError,
    code: errorCode,
    statusCode: status,
    requestId: req.requestId,
    // DEVELOPMENT ONLY: Include stack trace for debugging
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
};

module.exports = errorHandler;
