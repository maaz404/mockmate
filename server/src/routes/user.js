const express = require("express");
const router = express.Router();
const multer = require("multer");
const { ensureAuthenticated } = require("../middleware/auth");
const ensureUserProfile = require("../middleware/ensureUserProfile");
const {
  upgradeToPremium,
  getProfile,
  updateProfile,
  getAnalytics,
  completeOnboarding,
  saveOnboardingProgress,
  uploadResume,
  updateAvatar,
  updateResumeAsset,
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
  getDashboardMetrics,
  getDashboardRecommendation,
  bootstrapProfile,
} = require("../controllers/userController");

// Upgrade to premium endpoint
router.post(
  "/upgrade/premium",
  ensureAuthenticated,
  ensureUserProfile,
  upgradeToPremium
);

// Multer storage for resume uploads
/* eslint-disable no-magic-numbers */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/resumes"),
  filename: (req, file, cb) => {
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
  // eslint-disable-next-line no-magic-numbers
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/")
    )
      return cb(null, true);
    return cb(new Error("Only PDF files and images are allowed"));
  },
});

// Profile (idempotent create via POST)
router.get("/profile", ensureAuthenticated, ensureUserProfile, getProfile);
router.post("/profile", ensureAuthenticated, ensureUserProfile, getProfile);
router.put("/profile", ensureAuthenticated, ensureUserProfile, updateProfile);
// Bootstrap endpoint - creates profile if needed
router.post("/bootstrap", ensureAuthenticated, bootstrapProfile);

// Analytics / stats
router.get("/stats", ensureAuthenticated, ensureUserProfile, getAnalytics);
router.get("/analytics", ensureAuthenticated, ensureUserProfile, getAnalytics);

// Onboarding flows
router.post(
  "/onboarding/complete",
  ensureAuthenticated,
  ensureUserProfile,
  completeOnboarding
);
router.post(
  "/onboarding/save-progress",
  ensureAuthenticated,
  ensureUserProfile,
  saveOnboardingProgress
);

// Resume + profile media
router.post(
  "/resume",
  ensureAuthenticated,
  ensureUserProfile,
  upload.single("resume"),
  uploadResume
);
router.put(
  "/profile/avatar",
  ensureAuthenticated,
  ensureUserProfile,
  updateAvatar
);
router.put(
  "/profile/resume",
  ensureAuthenticated,
  ensureUserProfile,
  updateResumeAsset
);

// Scheduled sessions CRUD
router.get(
  "/scheduled-sessions",
  ensureAuthenticated,
  ensureUserProfile,
  getScheduledSessions
);
router.post(
  "/scheduled-sessions",
  ensureAuthenticated,
  ensureUserProfile,
  upsertScheduledSession
);
router.put(
  "/scheduled-sessions/:id",
  ensureAuthenticated,
  ensureUserProfile,
  upsertScheduledSession
);
router.delete(
  "/scheduled-sessions/:id",
  ensureAuthenticated,
  ensureUserProfile,
  deleteScheduledSession
);
router.patch(
  "/scheduled-sessions/:id/status",
  ensureAuthenticated,
  ensureUserProfile,
  updateScheduledSessionStatus
);

// Goals
router.get("/goals", ensureAuthenticated, ensureUserProfile, getGoals);
router.put("/goals", ensureAuthenticated, ensureUserProfile, updateGoals);

// Dynamic tips
router.get("/tips", ensureAuthenticated, ensureUserProfile, getDynamicTips);

// Dashboard aggregation + preferences
router.get(
  "/dashboard/summary",
  ensureAuthenticated,
  ensureUserProfile,
  getDashboardSummary
);
router.get(
  "/dashboard/preferences",
  ensureAuthenticated,
  ensureUserProfile,
  getDashboardPreferences
);
router.put(
  "/dashboard/preferences",
  ensureAuthenticated,
  ensureUserProfile,
  updateDashboardPreferences
);

// Enhanced metrics (Phase 1)
router.get(
  "/dashboard/metrics",
  ensureAuthenticated,
  ensureUserProfile,
  getDashboardMetrics
);

// Next best action recommendation (Phase 3 Option A)
router.get(
  "/dashboard/recommendation",
  ensureAuthenticated,
  ensureUserProfile,
  getDashboardRecommendation
);

module.exports = router;
