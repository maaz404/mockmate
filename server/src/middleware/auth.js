const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");

/**
 * Middleware to require authentication for protected routes
 * Uses Clerk Express middleware to verify JWT tokens
 */
const requireAuth = ClerkExpressRequireAuth({
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

module.exports = requireAuth;
