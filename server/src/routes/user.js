const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const ensureUserProfile = require("../middleware/ensureUserProfile");
const {
  validateAvatarUpload,
  validateResumeUpload,
  uploadRateLimit,
} = require("../middleware/uploadValidation");
const {
  upgradeToPremium,
  getProfile,
  bootstrapProfile,
  saveOnboardingProgress,
  updateProfile,
  completeOnboarding,
  getAnalytics,
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
  streamDashboard,
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
router.put("/profile", requireAuth, ensureUserProfile, updateProfile); // Also accept PUT for client compatibility

// Update avatar (with validation and rate limiting)
router.put(
  "/profile/avatar",
  requireAuth,
  ensureUserProfile,
  uploadRateLimit(10, 60000), // 10 uploads per minute
  validateAvatarUpload,
  updateAvatar
);

// Update resume (with validation and rate limiting)
router.put(
  "/profile/resume",
  requireAuth,
  ensureUserProfile,
  uploadRateLimit(5, 60000), // 5 uploads per minute
  validateResumeUpload,
  updateResumeAsset
);

// Delete avatar
router.delete(
  "/profile/avatar",
  requireAuth,
  ensureUserProfile,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const UserProfile = require("../models/UserProfile");
      const { ok } = require("../utils/responder");

      const profile = await UserProfile.findOne({ user: userId });
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      // Delete from Cloudinary if exists
      if (profile.avatar?.publicId) {
        const cloudinary = require("../config/cloudinary");
        try {
          await cloudinary.uploader.destroy(profile.avatar.publicId, {
            resource_type: "image",
          });
        } catch (error) {
          console.warn("Failed to delete from Cloudinary:", error);
        }
      }

      profile.avatar = null;
      await profile.save();

      return ok(res, { avatar: null }, "Avatar deleted successfully");
    } catch (error) {
      console.error("Delete avatar error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete avatar",
      });
    }
  }
);

// Delete resume
router.delete(
  "/profile/resume",
  requireAuth,
  ensureUserProfile,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const UserProfile = require("../models/UserProfile");
      const { ok } = require("../utils/responder");

      const profile = await UserProfile.findOne({ user: userId });
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      // Delete from Cloudinary if exists
      if (profile.resume?.publicId) {
        const cloudinary = require("../config/cloudinary");
        try {
          await cloudinary.uploader.destroy(profile.resume.publicId, {
            resource_type: "raw",
          });
        } catch (error) {
          console.warn("Failed to delete from Cloudinary:", error);
        }
      }

      profile.resume = null;
      await profile.save();

      return ok(res, { resume: null }, "Resume deleted successfully");
    } catch (error) {
      console.error("Delete resume error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete resume",
      });
    }
  }
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

// Get subscription info
router.get(
  "/subscription",
  requireAuth,
  ensureUserProfile,
  async (req, res) => {
    try {
      const { ok } = require("../utils/responder");
      const { getMonthlyQuota } = require("../config/plans");
      const Logger = require("../utils/logger");

      Logger.info("Fetching subscription for user:", req.user?.id);
      const profile = req.userProfile;

      if (!profile) {
        Logger.error("No user profile found in request");
        return res.status(500).json({
          success: false,
          message: "User profile not found",
        });
      }

      Logger.info("Profile found:", {
        id: profile._id,
        hasSubscription: !!profile.subscription,
        hasAnalytics: !!profile.analytics,
      });

      // Ensure subscription object exists with defaults
      if (!profile.subscription) {
        Logger.info("Creating default subscription");
        profile.subscription = {
          plan: "free",
          status: "active",
          interviewsUsedThisMonth: 0,
          lastInterviewReset: new Date(),
          interviewsRemaining: 10,
          cancelAtPeriodEnd: false,
        };
      }

      // Ensure analytics object exists with defaults
      if (!profile.analytics) {
        Logger.info("Creating default analytics");
        profile.analytics = {
          totalInterviews: 0,
          completedInterviews: 0,
          averageScore: 0,
          strongAreas: [],
          improvementAreas: [],
          streak: {
            current: 0,
            longest: 0,
          },
        };
      }

      try {
        await profile.save({ validateModifiedOnly: true });
        Logger.info("Profile saved successfully");
      } catch (saveError) {
        Logger.error("Error saving profile:", saveError);
        Logger.error("Save error details:", {
          name: saveError.name,
          message: saveError.message,
          errors: saveError.errors,
        });
        // Continue anyway - don't fail the request
      }

      // Check if monthly reset is needed
      const now = new Date();
      const lastReset = new Date(profile.subscription.lastInterviewReset);
      const daysSinceReset = Math.floor(
        (now - lastReset) / (1000 * 60 * 60 * 24)
      );

      // Reset if 30 days have passed
      if (daysSinceReset >= 30 && !profile.hasUnlimitedInterviews()) {
        Logger.info("Resetting monthly interview count");
        profile.subscription.interviewsUsedThisMonth = 0;
        profile.subscription.lastInterviewReset = now;
        try {
          await profile.save({ validateModifiedOnly: true });
        } catch (resetError) {
          Logger.error("Error resetting interview count:", resetError);
        }
      }

      const monthlyQuota = getMonthlyQuota(profile.subscription.plan);
      const remaining = profile.hasUnlimitedInterviews()
        ? null
        : Math.max(
            0,
            monthlyQuota - profile.subscription.interviewsUsedThisMonth
          );

      const subscriptionInfo = {
        plan: profile.subscription.plan,
        status: profile.subscription.status,
        hasUnlimited: profile.hasUnlimitedInterviews(),
        interviewsRemaining: remaining,
        interviewsUsed: profile.subscription.interviewsUsedThisMonth,
        interviewsLimit: monthlyQuota === Infinity ? null : monthlyQuota,
        periodStart: profile.subscription.periodStart,
        periodEnd: profile.subscription.periodEnd,
        lastReset: profile.subscription.lastInterviewReset,
        cancelAtPeriodEnd: profile.subscription.cancelAtPeriodEnd,
      };

      Logger.info("Returning subscription info:", subscriptionInfo);

      return ok(res, subscriptionInfo, "Subscription info retrieved");
    } catch (error) {
      const Logger = require("../utils/logger");
      Logger.error("Get subscription error:", error);
      Logger.error("Error stack:", error.stack);
      Logger.error("Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to get subscription info",
        error: error.message,
      });
    }
  }
);

// ============================================
// DASHBOARD ROUTES
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

// Dashboard metrics
router.get("/dashboard/metrics", requireAuth, getDashboardMetrics);

// Dashboard real-time stream (SSE)
router.get("/dashboard/stream", requireAuth, streamDashboard);

// ============================================
// SCHEDULED SESSIONS ROUTES
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
// GOALS ROUTES
// ============================================

// Get user goals
router.get("/goals", requireAuth, getGoals);

// Update user goals
router.put("/goals", requireAuth, updateGoals);

// ============================================
// TIPS ROUTES
// ============================================

// Get dynamic tips
router.get("/tips", requireAuth, getDynamicTips);

// ============================================
// PROFILE COMPLETENESS
// ============================================

// Get profile completeness
router.get(
  "/profile/completeness",
  requireAuth,
  ensureUserProfile,
  async (req, res) => {
    try {
      const { ok } = require("../utils/responder");
      const profile = req.userProfile;

      return ok(res, {
        percentage: profile.profileCompleteness,
        missingFields: getMissingFields(profile),
      });
    } catch (error) {
      console.error("Get completeness error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get profile completeness",
      });
    }
  }
);

// Helper function to get missing fields
function getMissingFields(profile) {
  const missing = [];

  if (!profile.firstName) missing.push("firstName");
  if (!profile.lastName) missing.push("lastName");
  if (!profile.bio) missing.push("bio");
  if (!profile.phone) missing.push("phone");
  if (!profile.location?.city) missing.push("location");
  if (!profile.avatar?.publicId) missing.push("avatar");
  if (!profile.professionalInfo?.currentRole) missing.push("currentRole");
  if (!profile.professionalInfo?.experience) missing.push("experience");
  if (!profile.professionalInfo?.industry) missing.push("industry");
  if (!profile.professionalInfo?.targetRoles?.length)
    missing.push("targetRoles");
  if (!profile.professionalInfo?.skills?.length) missing.push("skills");
  if (!profile.socialLinks?.linkedin) missing.push("linkedin");

  return missing;
}

// TEST ROUTE - for debugging
router.get("/test", (req, res) => {
  res.json({ message: "User routes working!" });
});

module.exports = router;
