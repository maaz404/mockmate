const UserProfile = require("../models/UserProfile");
const { fail } = require("../utils/responder");

// Dev-only premium whitelist by email; configurable via env
const PREMIUM_TEST_EMAILS = (
  process.env.PREMIUM_TEST_EMAILS || "maazakbar404@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Ensures a user profile exists for an authenticated request (Passport adds req.user)
// Attaches req.userProfile
module.exports = async function ensureUserProfile(req, res, next) {
  try {
    const auth = req.auth || {};
    const userId = auth.userId;
    if (!userId) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    let profile = await UserProfile.findOne({ userId: userId });

    // Derive safe email + names from authenticated user
    const user = req.user;
    const safeEmail = user?.email || `${userId}@dev.local`;
    const firstName = user?.firstName || profile?.firstName || "";
    const lastName = user?.lastName || profile?.lastName || "";

    if (!profile) {
      profile = await UserProfile.create({
        userId: userId,
        email: safeEmail,
        firstName,
        lastName,
        onboardingCompleted: false,
      });
    } else if (!profile.email || profile.email.endsWith("@dev.local")) {
      // Backfill email if we now have a real one
      if (user?.email && /@/.test(user.email)) {
        profile.email = user.email;
        if (firstName && !profile.firstName) profile.firstName = firstName;
        if (lastName && !profile.lastName) profile.lastName = lastName;
        await profile.save();
      }
    }

    // Auto-upgrade to premium for whitelisted emails in non-production envs
    try {
      if (
        process.env.NODE_ENV !== "production" &&
        profile?.email &&
        PREMIUM_TEST_EMAILS.includes(String(profile.email).toLowerCase())
      ) {
        const currentPlan = profile.subscription?.plan || "free";
        if (currentPlan !== "premium") {
          profile.subscription = {
            plan: "premium",
            interviewsRemaining: null,
            nextResetDate: profile.subscription?.nextResetDate || null,
          };
          await profile.save();
        }
      }
    } catch (_) {
      // non-fatal; continue
    }

    req.userProfile = profile;
    return next();
  } catch (err) {
    return fail(
      res,
      500,
      "PROFILE_INIT_FAILED",
      "Failed to ensure user profile"
    ); // eslint-disable-line consistent-return
  }
};
