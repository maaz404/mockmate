const UserProfile = require("../models/UserProfile");
const { fail } = require("../utils/responder");

// Ensures a user profile exists for an authenticated request (Clerk adds req.auth.userId)
// Attaches req.userProfile
module.exports = async function ensureUserProfile(req, res, next) {
  try {
    const auth = req.auth || {};
    const userId = auth.userId;
    if (!userId) {
      return fail(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    let profile = await UserProfile.findOne({ clerkUserId: userId });

    if (!profile) {
      // If email / names available via Clerk (mirrored in headers if needed) use them
      profile = await UserProfile.create({
        clerkUserId: userId,
        email: req.headers["x-user-email"] || "",
        firstName: req.headers["x-user-firstname"] || "",
        lastName: req.headers["x-user-lastname"] || "",
        onboardingCompleted: false,
      });
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
