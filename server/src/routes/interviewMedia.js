const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const {
  attachMedia,
  getInterviewMedia,
  deleteInterviewMedia,
  updateMediaMetadata,
} = require("../controllers/sessionMediaController");
const { param, body, validationResult } = require("express-validator");

/**
 * Interview Media Routes
 * Base: /api/interview-media
 */

// Validation middleware
const validateAttachMedia = [
  param("id").isMongoId().withMessage("Invalid interview ID"),
  body("mediaUrl").isURL().withMessage("Valid media URL is required"),
  body("mediaType")
    .isIn(["video", "audio", "image", "document"])
    .withMessage("Invalid media type"),
  body("metadata").optional().isObject(),
];

const validateDeleteMedia = [
  param("id").isMongoId().withMessage("Invalid interview ID"),
  param("mediaId").isMongoId().withMessage("Invalid media ID"),
];

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

// @desc    Attach media to interview
// @route   POST /api/interview-media/:id/media
// @access  Private
router.post(
  "/:id/media",
  requireAuth,
  validateAttachMedia,
  handleValidationErrors,
  attachMedia
);

// @desc    Get interview media
// @route   GET /api/interview-media/:id/media
// @access  Private
router.get(
  "/:id/media",
  requireAuth,
  [param("id").isMongoId().withMessage("Invalid interview ID")],
  handleValidationErrors,
  getInterviewMedia
);

// @desc    Delete interview media
// @route   DELETE /api/interview-media/:id/media/:mediaId
// @access  Private
router.delete(
  "/:id/media/:mediaId",
  requireAuth,
  validateDeleteMedia,
  handleValidationErrors,
  deleteInterviewMedia
);

// @desc    Update media metadata
// @route   PATCH /api/interview-media/:id/media/:mediaId
// @access  Private
router.patch(
  "/:id/media/:mediaId",
  requireAuth,
  [
    param("id").isMongoId().withMessage("Invalid interview ID"),
    param("mediaId").isMongoId().withMessage("Invalid media ID"),
    body("metadata").optional().isObject(),
    body("description").optional().isString(),
  ],
  handleValidationErrors,
  updateMediaMetadata
);

module.exports = router;
