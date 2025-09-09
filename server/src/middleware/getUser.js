const { clerkClient } = require("@clerk/clerk-sdk-node");

/**
 * Middleware to get user information from Clerk
 * Adds user data to req.user for use in route handlers
 */
const getUser = async (req, res, next) => {
  try {
    // The user ID is available from Clerk's auth middleware
    if (req.auth && req.auth.userId) {
      // Get full user information from Clerk
      const user = await clerkClient.users.getUser(req.auth.userId);

      // Add user data to request object
      req.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
        // Add any custom metadata
        publicMetadata: user.publicMetadata,
        privateMetadata: user.privateMetadata,
      };
    }

    next();
  } catch (error) {
    console.error("Error fetching user from Clerk:", error);
    // Don't fail the request, just log the error
    next();
  }
};

module.exports = getUser;
