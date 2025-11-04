const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const ensureUserProfile = require("../middleware/ensureUserProfile");
const {
  upgradeToPremium,
  getProfile,
  bootstrapProfile,
  saveOnboardingProgress,
  updateProfile,
  completeOnboarding,
  getAnalytics,
  uploadResume,
  updateAvatar,
  updateResumeAsset,
  getDashboardPreferences,
  updateDashboardPreferences,
  getScheduledSessions,
  upsertScheduledSession,
  deleteScheduledSession,
  updateScheduledSessionStatus,
  getGoals,
  updateGoals,
  getDynamicTips,
  getDashboardSummary,
  getDashboardRecommendation,
  getDashboardMetrics,
} = require("../controllers/userController");

// ============================================
// CORE PROFILE ROUTES
// ============================================

// Get user profile
router.get("/profile", requireAuth, ensureUserProfile, getProfile);

// Bootstrap profile (get all initial data)
router.post(
  "/profile/bootstrap",
  requireAuth,
  ensureUserProfile,
  bootstrapProfile
);

// Update profile
router.patch("/profile", requireAuth, ensureUserProfile, updateProfile);

// Update avatar
router.put("/profile/avatar", requireAuth, ensureUserProfile, updateAvatar);

// Update resume
router.put(
  "/profile/resume",
  requireAuth,
  ensureUserProfile,
  updateResumeAsset
);

// ============================================
// ONBOARDING ROUTES
// ============================================

// Save onboarding progress
router.post(
  "/onboarding/progress",
  requireAuth,
  ensureUserProfile,
  saveOnboardingProgress
);

// Complete onboarding
router.post(
  "/onboarding/complete",
  requireAuth,
  ensureUserProfile,
  completeOnboarding
);

// ============================================
// ANALYTICS ROUTES
// ============================================

// Get user analytics
router.get("/analytics", requireAuth, ensureUserProfile, getAnalytics);

// ============================================
// SUBSCRIPTION ROUTES
// ============================================

// Upgrade to premium
router.post(
  "/upgrade/premium",
  requireAuth,
  ensureUserProfile,
  upgradeToPremium
);

// ============================================
// DASHBOARD ROUTES (Phase 1 - Stubs)
// ============================================

// Dashboard preferences (cross-device sync)
router.get("/dashboard/preferences", requireAuth, getDashboardPreferences);
router.patch("/dashboard/preferences", requireAuth, updateDashboardPreferences);

// Dashboard summary (all-in-one)
router.get("/dashboard/summary", requireAuth, getDashboardSummary);

// Dashboard recommendation
router.get(
  "/dashboard/recommendation",
  requireAuth,
  getDashboardRecommendation
);

// Dashboard metrics (Phase 1)
router.get("/dashboard/metrics", requireAuth, getDashboardMetrics);

// ============================================
// SCHEDULED SESSIONS ROUTES (Phase 1 - Stubs)
// ============================================

// Get all scheduled sessions
router.get("/scheduled", requireAuth, getScheduledSessions);

// Create new scheduled session
router.post("/scheduled", requireAuth, upsertScheduledSession);

// Update scheduled session
router.put("/scheduled/:id", requireAuth, upsertScheduledSession);

// Delete scheduled session
router.delete("/scheduled/:id", requireAuth, deleteScheduledSession);

// Update session status
router.patch(
  "/scheduled/:id/status",
  requireAuth,
  updateScheduledSessionStatus
);

// ============================================
// GOALS ROUTES (Phase 1 - Stubs)
// ============================================

// Get user goals
router.get("/goals", requireAuth, getGoals);

// Update user goals
router.put("/goals", requireAuth, updateGoals);

// ============================================
// TIPS ROUTES (Phase 1 - Stubs)
// ============================================

// Get dynamic tips
router.get("/tips", requireAuth, getDynamicTips);

// TEST ROUTE - for debugging
router.get("/test", (req, res) => {
  res.json({ message: "User routes working!" });
});

module.exports = router;
