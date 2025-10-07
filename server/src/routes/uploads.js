const express = require("express");
const requireAuth = require("../middleware/auth");
const {
  getSignedUploadParams,
  destroyByPublicId,
  uploadHealth,
} = require("../controllers/uploadController");

const router = express.Router();

// GET /api/uploads/sign -> returns signature bundle
router.get("/sign", requireAuth, getSignedUploadParams);
// GET /api/uploads/health -> returns Cloudinary health
router.get("/health", uploadHealth);

// POST /api/uploads/destroy -> deletes a single asset by public_id
router.post("/destroy", requireAuth, destroyByPublicId);

module.exports = router;
