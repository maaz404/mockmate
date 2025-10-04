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

    // Derive safe email + names. In dev MOCK_AUTH_FALLBACK we may not have headers.
    const headerEmail = req.headers["x-user-email"]; // may be undefined
    const safeEmail =
      headerEmail && /@/.test(headerEmail)
        ? headerEmail
        : `${userId}@dev.local`; // deterministic placeholder – satisfies unique required constraint
    const firstName =
      req.headers["x-user-firstname"] || profile?.firstName || "";
    const lastName = req.headers["x-user-lastname"] || profile?.lastName || "";

    if (!profile) {
      profile = await UserProfile.create({
        clerkUserId: userId,
        email: safeEmail,
        firstName,
        lastName,
        onboardingCompleted: false,
      });
    } else if (!profile.email || profile.email.endsWith("@dev.local")) {
      // Backfill email if we now have a real one
      if (headerEmail && /@/.test(headerEmail)) {
        profile.email = headerEmail;
        if (firstName && !profile.firstName) profile.firstName = firstName;
        if (lastName && !profile.lastName) profile.lastName = lastName;
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
    ); // eslint-disable-line consistent-return
  }
};
