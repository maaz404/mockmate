// NOTE: This middleware is deprecated - migrating to Google OAuth session-based auth
// All authentication is now handled via Passport.js
/**
 * Middleware to get current user information
 * Attaches user profile to req.user for use in routes
 * NOTE: This middleware is deprecated - authentication handled by Passport session
 */
const getUser = async (req, res, next) => {
  try {
    // User is already set by Passport
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }

    // No auth - continue without user
    if (!req.auth?.userId) {
      return next();
    }

    const { userId } = req.auth;

    // Get user profile from database
    const userProfile = await UserProfile.findOne({ userId: userId });

    // If no profile exists, continue without profile
    if (!userProfile) {
      req.user = null;
      return next();
    }

    // Update last login time
    userProfile.lastLoginAt = new Date();
    await userProfile.save();

    // Attach user to request
    req.user = userProfile;
    return next();
  } catch (error) {
    // Log error but continue
    req.user = null;
    return next();
  }
};

module.exports = getUser;
