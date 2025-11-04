const Logger = require("../utils/logger");

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  avatar: 5 * 1024 * 1024, // 5MB
  resume: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
};

// Allowed file types
const ALLOWED_TYPES = {
  avatar: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  resume: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

/**
 * Validate avatar upload
 */
const validateAvatarUpload = (req, res, next) => {
  try {
    const { publicId, resourceType, secureUrl, bytes, format } = req.body;

    // Check required fields
    if (!publicId || !secureUrl) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Missing required fields: publicId and secureUrl",
      });
    }

    // Validate resource type
    if (resourceType !== "image") {
      return res.status(400).json({
        success: false,
        code: "INVALID_RESOURCE_TYPE",
        message: "Avatar must be an image",
      });
    }

    // Validate file size
    if (bytes && bytes > FILE_SIZE_LIMITS.avatar) {
      return res.status(400).json({
        success: false,
        code: "FILE_TOO_LARGE",
        message: `Avatar must be less than ${
          FILE_SIZE_LIMITS.avatar / 1024 / 1024
        }MB`,
      });
    }

    // Validate format
    const allowedFormats = ["jpg", "jpeg", "png", "webp", "gif"];
    if (format && !allowedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FORMAT",
        message: `Invalid format. Allowed: ${allowedFormats.join(", ")}`,
      });
    }

    next();
  } catch (error) {
    Logger.error("Avatar validation error:", error);
    return res.status(500).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Failed to validate avatar upload",
    });
  }
};

/**
 * Validate resume upload
 */
const validateResumeUpload = (req, res, next) => {
  try {
    const { publicId, resourceType, secureUrl, bytes, format } = req.body;

    // Check required fields
    if (!publicId || !secureUrl) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Missing required fields: publicId and secureUrl",
      });
    }

    // Validate resource type
    if (resourceType !== "raw") {
      return res.status(400).json({
        success: false,
        code: "INVALID_RESOURCE_TYPE",
        message: "Resume must be a document (PDF or DOCX)",
      });
    }

    // Validate file size
    if (bytes && bytes > FILE_SIZE_LIMITS.resume) {
      return res.status(400).json({
        success: false,
        code: "FILE_TOO_LARGE",
        message: `Resume must be less than ${
          FILE_SIZE_LIMITS.resume / 1024 / 1024
        }MB`,
      });
    }

    // Validate format
    const allowedFormats = ["pdf", "doc", "docx"];
    if (format && !allowedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FORMAT",
        message: `Invalid format. Allowed: ${allowedFormats.join(", ")}`,
      });
    }

    next();
  } catch (error) {
    Logger.error("Resume validation error:", error);
    return res.status(500).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Failed to validate resume upload",
    });
  }
};

/**
 * Rate limiting for uploads (simple in-memory implementation)
 */
const uploadRateLimits = new Map();

const rateLimit = (maxUploads = 10, windowMs = 60000) => {
  return (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const now = Date.now();
    const userLimits = uploadRateLimits.get(userId) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // Reset if window has passed
    if (now > userLimits.resetTime) {
      userLimits.count = 0;
      userLimits.resetTime = now + windowMs;
    }

    // Check limit
    if (userLimits.count >= maxUploads) {
      return res.status(429).json({
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many uploads. Please try again in ${Math.ceil(
          (userLimits.resetTime - now) / 1000
        )} seconds`,
      });
    }

    // Increment count
    userLimits.count += 1;
    uploadRateLimits.set(userId, userLimits);

    next();
  };
};

module.exports = {
  validateAvatarUpload,
  validateResumeUpload,
  uploadRateLimit: rateLimit,
  FILE_SIZE_LIMITS,
  ALLOWED_TYPES,
};
