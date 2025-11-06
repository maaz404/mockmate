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

    let profile = await UserProfile.findOne({ user: userId });
    console.log("[ensureUserProfile] Found profile:", !!profile);

    // Prefer email from req.user if available, else safe placeholder
    const email = req.user?.email || `${userId}@dev.local`;

    if (!profile) {
      console.log("[ensureUserProfile] Creating new profile for:", email);
      profile = await UserProfile.create({
        user: userId,
        email,
        onboardingCompleted: false,
      });
      console.log("[ensureUserProfile] Profile created:", profile._id);
    } else if (!profile.email || profile.email.endsWith("@dev.local")) {
      // Backfill email if we now have a real one
      if (req.user?.email) {
        profile.email = req.user.email;
        await profile.save();
      }
    }

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
