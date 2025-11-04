const express = require("express");
const requireAuth = require("../middleware/auth");
const {
  getSignedUploadParams,
  destroyByPublicId,
  uploadHealth,
} = require("../controllers/uploadController");

const router = express.Router();

/**
 * Upload Routes
 * Base: /api/uploads
 */

// @desc    Get signed upload parameters for Cloudinary
// @route   GET /api/uploads/sign
// @access  Private
router.get("/sign", requireAuth, getSignedUploadParams);

// @desc    Delete uploaded resource by public ID
// @route   DELETE /api/uploads/:publicId
// @access  Private
router.delete("/:publicId", requireAuth, destroyByPublicId);

// @desc    Health check for upload service
// @route   GET /api/uploads/health
// @access  Public
router.get("/health", uploadHealth);

module.exports = router;
