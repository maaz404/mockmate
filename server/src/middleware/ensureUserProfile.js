const UserProfile = require("../models/UserProfile");
const { fail } = require("../utils/responder");

module.exports = async function ensureUserProfile(req, res, next) {
  try {
    console.log("[ensureUserProfile] Starting...");
    const userId = req.user?.id;
    console.log("[ensureUserProfile] userId:", userId);

    if (!userId) {
      console.error("[ensureUserProfile] No userId");
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    // Prefer email from req.user if available, else safe placeholder
    const email = req.user?.email || `${userId}@dev.local`;

    // Use findOneAndUpdate with upsert to atomically create or find profile
    // This prevents race conditions when multiple requests fire simultaneously
    let profile = await UserProfile.findOneAndUpdate(
      { user: userId },
      {
        $setOnInsert: {
          user: userId,
          email,
          onboardingCompleted: false,
          subscription: {
            plan: "free",
            status: "active",
            interviewsRemaining: 10,
            interviewsUsedThisMonth: 0,
            lastInterviewReset: new Date(),
            cancelAtPeriodEnd: false,
          },
          analytics: {
            totalInterviews: 0,
            completedInterviews: 0,
            averageScore: 0,
            strongAreas: [],
            improvementAreas: [],
            streak: {
              current: 0,
              longest: 0,
            },
          },
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // For existing profiles, ensure subscription and analytics exist
    let needsSave = false;

    if (!profile.subscription) {
      profile.subscription = {
        plan: "free",
        status: "active",
        interviewsRemaining: 10,
        interviewsUsedThisMonth: 0,
        lastInterviewReset: new Date(),
        cancelAtPeriodEnd: false,
      };
      needsSave = true;
    }

    if (!profile.analytics) {
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
      needsSave = true;
    }

    if (needsSave) {
      try {
        await profile.save({ validateModifiedOnly: true });
        console.log("[ensureUserProfile] Profile saved successfully");
      } catch (saveError) {
        console.error("[ensureUserProfile] Save error:", saveError);
        console.error("[ensureUserProfile] Save error details:", {
          name: saveError.name,
          message: saveError.message,
          errors: saveError.errors,
        });
        // Don't fail the request, just log the error
      }
    }

    console.log("[ensureUserProfile] Profile ensured:", profile._id);

    req.userProfile = profile;
    console.log("[ensureUserProfile] Profile attached, calling next()");
    return next();
  } catch (err) {
    console.error("[ensureUserProfile] Error caught:", err);
    console.error("[ensureUserProfile] Error stack:", err.stack);
    return fail(
      res,
      500,
      "PROFILE_INIT_FAILED",
      "Failed to ensure user profile"
    );
  }
};
