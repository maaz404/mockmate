const express = require("express");
const { ensureAuthenticated } = require("../middleware/auth");
const {
  getSignedUploadParams,
  destroyByPublicId,
  uploadHealth,
} = require("../controllers/uploadController");

const router = express.Router();

// GET /api/uploads/sign -> returns signature bundle
router.get("/sign", ensureAuthenticated, getSignedUploadParams);
// GET /api/uploads/health -> returns Cloudinary health
router.get("/health", uploadHealth);

// POST /api/uploads/destroy -> deletes a single asset by public_id
router.post("/destroy", ensureAuthenticated, destroyByPublicId);

module.exports = router;
