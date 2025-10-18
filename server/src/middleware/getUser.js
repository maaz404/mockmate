// const { clerkClient } = require("@clerk/clerk-sdk-node"); // REMOVED: Migrating to Google OAuth
const UserProfile = require("../models/UserProfile");

/**
 * Middleware to get current user information
 * Attaches user profile to req.user for use in routes
 * NOTE: This middleware is deprecated - migrating to Google OAuth session-based auth
 */
const getUser = async (req, res, next) => {
  try {
    // Skip if using new session-based auth
    if (req.isAuthenticated && req.isAuthenticated()) {
      req.user = req.user; // Already set by Passport
      return next();
    }

    if (!req.auth?.userId) {
      return next();
    }

    const { userId } = req.auth;

    // Get user profile from database
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });

    // If no profile exists, skip Clerk lookup (migrating away from Clerk)
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
