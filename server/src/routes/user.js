const express = require("express");
const router = express.Router();
const multer = require("multer");
const requireAuth = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  getAnalytics,
  completeOnboarding,
  saveOnboardingProgress,
  uploadResume,
  getScheduledSessions,
  upsertScheduledSession,
  deleteScheduledSession,
  updateScheduledSessionStatus,
  getGoals,
  updateGoals,
  getDynamicTips,
  getDashboardSummary,
  getDashboardPreferences,
  updateDashboardPreferences,
} = require("../controllers/userController");

// Configure multer for file uploads
/* eslint-disable no-magic-numbers */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes");
  },
  filename: (req, file, cb) => {
    // eslint-disable-next-line no-magic-numbers
    const uniqueSuffix = `${Date.now()}-${Math.round(
      Math.random() * 1000000000
    )}`;
    const ext = file.originalname.split(".").pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  },
});
/* eslint-enable no-magic-numbers */

const upload = multer({
  storage,
  limits: {
    // eslint-disable-next-line no-magic-numbers
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

// @desc    Save onboarding progress
// @route   POST /api/users/onboarding/save-progress
// @access  Private
router.post("/onboarding/save-progress", requireAuth, saveOnboardingProgress);

// @desc    Upload resume
// @route   POST /api/users/resume
// @access  Private
router.post("/resume", requireAuth, upload.single("resume"), uploadResume);

// Scheduled sessions
// @desc Get upcoming scheduled sessions
// @route GET /api/users/scheduled-sessions
router.get("/scheduled-sessions", requireAuth, getScheduledSessions);
// @desc Create scheduled session
// @route POST /api/users/scheduled-sessions
router.post("/scheduled-sessions", requireAuth, upsertScheduledSession);
// @desc Update scheduled session
// @route PUT /api/users/scheduled-sessions/:id
router.put("/scheduled-sessions/:id", requireAuth, upsertScheduledSession);
// @desc Delete scheduled session
// @route DELETE /api/users/scheduled-sessions/:id
router.delete("/scheduled-sessions/:id", requireAuth, deleteScheduledSession);
// @desc Update status
router.patch(
  "/scheduled-sessions/:id/status",
  requireAuth,
  updateScheduledSessionStatus
);

// Goals
// @desc Get goals
// @route GET /api/users/goals
router.get("/goals", requireAuth, getGoals);
// @desc Update goals
// @route PUT /api/users/goals
router.put("/goals", requireAuth, updateGoals);

// Dynamic tips
// @desc GET /api/users/tips
router.get("/tips", requireAuth, getDynamicTips);

// Dashboard summary (aggregated)
// @desc GET /api/users/dashboard/summary
router.get("/dashboard/summary", requireAuth, getDashboardSummary);

// Dashboard preferences
// @desc GET /api/users/dashboard/preferences
router.get("/dashboard/preferences", requireAuth, getDashboardPreferences);
// @desc PUT /api/users/dashboard/preferences
router.put("/dashboard/preferences", requireAuth, updateDashboardPreferences);

module.exports = router;
