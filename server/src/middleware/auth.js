const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");

/**
 * Middleware to require authentication for protected routes
 * Uses Clerk Express middleware to verify JWT tokens
 */
const requireAuth = (req, res, next) => {
  // In development, skip authentication for testing
  if (process.env.NODE_ENV !== "production") {
    console.log("Development mode: skipping authentication");
    req.auth = { userId: "test-user-123", id: "test-user-123" };
    return next();
  }

  // In production, use Clerk authentication
  const clerkAuth = ClerkExpressRequireAuth({
    onError: (error, req, res, next) => {
      console.error("Authentication error:", {
        message: error.message,
        status: error.status || 401,
        path: req.path,
        method: req.method,
      });

      // Send proper JSON response
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please provide a valid authentication token",
        statusCode: 401,
      });
    },
  });

  return clerkAuth(req, res, next);
};

module.exports = requireAuth;
