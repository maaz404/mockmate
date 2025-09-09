const express = require("express");
const router = express.Router();
const multer = require("multer");
const requireAuth = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  getAnalytics,
  completeOnboarding,
  uploadResume,
} = require("../controllers/userController");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files and images are allowed"));
    }
  },
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", requireAuth, getProfile);

// @desc    Create user profile
// @route   POST /api/users/profile
// @access  Private
router.post("/profile", requireAuth, getProfile); // Will create if doesn't exist

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", requireAuth, updateProfile);

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
router.get("/stats", requireAuth, getAnalytics);

// @desc    Get user analytics (alias for stats)
// @route   GET /api/users/analytics
// @access  Private
router.get("/analytics", requireAuth, getAnalytics);

// @desc    Complete onboarding
// @route   POST /api/users/onboarding/complete
// @access  Private
router.post("/onboarding/complete", requireAuth, completeOnboarding);

// @desc    Upload resume
// @route   POST /api/users/resume
// @access  Private
router.post("/resume", requireAuth, upload.single("resume"), uploadResume);

module.exports = router;
