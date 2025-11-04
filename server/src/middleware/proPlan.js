const UserProfile = require("../models/UserProfile");
const Logger = require("../utils/logger");

/**
 * Middleware to check if user has Pro/Premium plan access
 * FIXED: Only checks UserProfile.subscription.plan (single source of truth)
 */
const requireProPlan = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // ✅ FIXED: Only check UserProfile.subscription.plan
    const userProfile = await UserProfile.findOne(
      { user: userId },
      "subscription.plan"
    ).lean();

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        code: "PROFILE_NOT_FOUND",
        message: "User profile not found",
      });
    }

    const plan = userProfile.subscription?.plan || "free";
    const hasPro = ["premium", "enterprise"].includes(plan);

    if (!hasPro) {
      return res.status(403).json({
        success: false,
        code: "PREMIUM_REQUIRED",
        message: "This feature requires a premium subscription",
        currentPlan: plan,
      });
    }

    // Attach plan to request for downstream use
    req.userPlan = plan;
    return next();
  } catch (error) {
    Logger.error("Pro plan check error:", error);
    return res.status(500).json({
      success: false,
      code: "PLAN_CHECK_FAILED",
      message: "Failed to verify subscription status",
    });
  }
};

/**
 * Check if user has pro plan (non-blocking helper)
 * FIXED: Only checks UserProfile
 */
const checkProPlan = async (userId) => {
  try {
    const userProfile = await UserProfile.findOne(
      { user: userId },
      "subscription.plan"
    ).lean();

    if (!userProfile) return false;

    const plan = userProfile.subscription?.plan || "free";
    return ["premium", "enterprise"].includes(plan);
  } catch (error) {
    Logger.error("Pro plan check helper error:", error);
    return false;
  }
};

module.exports = { requireProPlan, checkProPlan };
