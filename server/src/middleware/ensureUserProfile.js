const UserProfile = require("../models/UserProfile");
const { fail } = require("../utils/responder");

module.exports = async function ensureUserProfile(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    let profile = await UserProfile.findOne({ user: userId });

    // Prefer email from req.user if available, else safe placeholder
    const email = req.user?.email || `${userId}@dev.local`;

    if (!profile) {
      profile = await UserProfile.create({
        user: userId,
        email,
        onboardingCompleted: false,
      });
    } else if (!profile.email || profile.email.endsWith("@dev.local")) {
      // Backfill email if we now have a real one
      if (req.user?.email) {
        profile.email = req.user.email;
        await profile.save();
      }
    }

    req.userProfile = profile;
    return next();
  } catch (err) {
    return fail(
      res,
      500,
      "PROFILE_INIT_FAILED",
      "Failed to ensure user profile"
    );
  }
};
