const express = require("express");
const router = express.Router();
const multer = require("multer");
const requireAuth = require("../middleware/auth");
const ensureUserProfile = require("../middleware/ensureUserProfile");
const {
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
router.get("/profile", requireAuth, ensureUserProfile, getProfile);
router.post("/profile", requireAuth, ensureUserProfile, getProfile);
router.put("/profile", requireAuth, ensureUserProfile, updateProfile);
// Bootstrap endpoint - creates profile if needed
router.post("/bootstrap", requireAuth, bootstrapProfile);

// Analytics / stats
router.get("/stats", requireAuth, ensureUserProfile, getAnalytics);
router.get("/analytics", requireAuth, ensureUserProfile, getAnalytics);

// Onboarding flows
router.post(
  "/onboarding/complete",
  requireAuth,
  ensureUserProfile,
  completeOnboarding
);
router.post(
  "/onboarding/save-progress",
  requireAuth,
  ensureUserProfile,
  saveOnboardingProgress
);

// Resume + profile media
router.post(
  "/resume",
  requireAuth,
  ensureUserProfile,
  upload.single("resume"),
  uploadResume
);
router.put("/profile/avatar", requireAuth, ensureUserProfile, updateAvatar);
router.put(
  "/profile/resume",
  requireAuth,
  ensureUserProfile,
  updateResumeAsset
);

// Scheduled sessions CRUD
router.get(
  "/scheduled-sessions",
  requireAuth,
  ensureUserProfile,
  getScheduledSessions
);
router.post(
  "/scheduled-sessions",
  requireAuth,
  ensureUserProfile,
  upsertScheduledSession
);
router.put(
  "/scheduled-sessions/:id",
  requireAuth,
  ensureUserProfile,
  upsertScheduledSession
);
router.delete(
  "/scheduled-sessions/:id",
  requireAuth,
  ensureUserProfile,
  deleteScheduledSession
);
router.patch(
  "/scheduled-sessions/:id/status",
  requireAuth,
  ensureUserProfile,
  updateScheduledSessionStatus
);

// Goals
router.get("/goals", requireAuth, ensureUserProfile, getGoals);
router.put("/goals", requireAuth, ensureUserProfile, updateGoals);

// Dynamic tips
router.get("/tips", requireAuth, ensureUserProfile, getDynamicTips);

// Dashboard aggregation + preferences
router.get(
  "/dashboard/summary",
  requireAuth,
  ensureUserProfile,
  getDashboardSummary
);
router.get(
  "/dashboard/preferences",
  requireAuth,
  ensureUserProfile,
  getDashboardPreferences
);
router.put(
  "/dashboard/preferences",
  requireAuth,
  ensureUserProfile,
  updateDashboardPreferences
);

// Enhanced metrics (Phase 1)
router.get(
  "/dashboard/metrics",
  requireAuth,
  ensureUserProfile,
  getDashboardMetrics
);

// Next best action recommendation (Phase 3 Option A)
router.get(
  "/dashboard/recommendation",
  requireAuth,
  ensureUserProfile,
  getDashboardRecommendation
);

module.exports = router;
