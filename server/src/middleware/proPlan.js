const User = require("../models/User");
const UserProfile = require("../models/UserProfile");

/**
 * Middleware to check if user has Pro plan access
 * For now, this is a simple implementation that can be extended with actual subscription logic
 */
const requireProPlan = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Login required" });
    }

    // Prefer User.plan; fallback to UserProfile.subscription.plan
    const user = await User.findById(userId, "plan").lean();
    let plan = user?.plan;

    if (!plan) {
      const userProfile = await UserProfile.findOne(
        { user: userId },
        "subscription.plan"
      ).lean();
      plan = userProfile?.subscription?.plan || "free";
    }

    const hasPro =
      plan === "premium" || plan === "enterprise" || plan === "pro";
    if (!hasPro) {
      return res.status(403).json({
        success: false,
        message: "Pro plan required for this feature",
        error: "UPGRADE_REQUIRED",
        upgradeInfo: {
          feature: "PDF Export",
          requiredPlan: "Pro",
          benefits: [
            "PDF report exports",
            "Advanced analytics",
            "Detailed performance insights",
            "Progress tracking",
          ],
        },
      });
    }

    req.subscription = { plan: plan || "pro" };
    next();
  } catch (error) {
    console.error("Pro plan check error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to verify subscription status",
      });
  }
};

/**
 * Check if user has pro plan (without blocking the request)
 */
const checkProPlan = async (userId) => {
  try {
    const user = await User.findById(userId, "plan").lean();
    if (
      user?.plan &&
      (user.plan === "premium" ||
        user.plan === "enterprise" ||
        user.plan === "pro")
    ) {
      return true;
    }
    const profile = await UserProfile.findOne(
      { user: userId },
      "subscription.plan"
    ).lean();
    return (
      profile?.subscription?.plan === "premium" ||
      profile?.subscription?.plan === "enterprise"
    );
  } catch (error) {
    console.error("Pro plan check error:", error);
    return false;
  }
};

module.exports = { requireProPlan, checkProPlan };
