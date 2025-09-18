const { clerkClient } = require("@clerk/clerk-sdk-node");
const UserProfile = require("../models/UserProfile");

/**
 * Middleware to get current user information
 * Attaches user profile to req.user for use in routes
 */
const getUser = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      return next();
    }

    const { userId } = req.auth;

    // Get user profile from database
    let userProfile = await UserProfile.findOne({ clerkUserId: userId });

    // If no profile exists, create one from Clerk data
    if (!userProfile) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);

        userProfile = new UserProfile({
          clerkUserId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          profileImage: clerkUser.profileImageUrl || "",
          lastLoginAt: new Date(),
        });

        await userProfile.save();
      } catch (clerkError) {
        // Log error but continue without user profile
        req.user = null;
        return next();
      }
    } else {
      // Update last login time
      userProfile.lastLoginAt = new Date();
      await userProfile.save();
    }

    // Attach user to request
    req.user = userProfile;
    next();
  } catch (error) {
    // Log error but continue
    req.user = null;
    next();
  }
};

module.exports = getUser;
