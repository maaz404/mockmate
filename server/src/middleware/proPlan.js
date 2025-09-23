const UserProfile = require("../models/UserProfile");

/**
 * Middleware to check if user has Pro plan access
 * For now, this is a simple implementation that can be extended with actual subscription logic
 */
const requireProPlan = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    // Get user profile
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Check for Pro plan using the existing subscription structure
    const hasProPlan = userProfile.subscription?.plan === 'premium' || 
                      userProfile.subscription?.plan === 'enterprise';

    if (!hasProPlan) {
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
            "Progress tracking"
          ]
        }
      });
    }

    // Add subscription info to request for potential use in handlers
    req.subscription = userProfile.subscription || { plan: 'pro' };
    next();
  } catch (error) {
    console.error("Pro plan check error:", error);
    res.status(500).json({
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
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });
    
    if (!userProfile) {
      return false;
    }

    return userProfile.subscription?.plan === 'premium' || 
           userProfile.subscription?.plan === 'enterprise';
  } catch (error) {
    console.error("Pro plan check error:", error);
    return false;
  }
};

module.exports = {
  requireProPlan,
  checkProPlan,
};