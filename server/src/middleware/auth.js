const Logger = require("../utils/logger");

/**
 * SECURITY: Middleware to ensure user is authenticated via Passport session
 * Migrated from Clerk to Google OAuth with session-based authentication
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function ensureAuthenticated(req, res, next) {
  // Check if Passport has authenticated the user and session is valid
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    // Attach userId to request for downstream middleware/controllers
    req.userId = String(req.user._id);

    // OPTIMIZATION: Attach user object for convenience (avoid redundant DB queries)
    req.auth = {
      userId: req.userId,
      email: req.user.email,
      subscription: req.user.subscription,
    };

    return next();
  }

  // SECURITY: Log unauthorized access attempts in non-production
  if (process.env.NODE_ENV !== "production") {
    Logger.debug(`Unauthorized access attempt: ${req.method} ${req.path}`, {
      ip: req.ip,
      requestId: req.requestId,
    });
  }

  return res.status(401).json({
    error: "Unauthorized",
    message: "Authentication required. Please sign in to continue.",
    code: "AUTH_REQUIRED",
  });
}

/**
 * OPTIONAL: Middleware to check for premium subscription
 * Use after ensureAuthenticated
 */
function ensurePremium(req, res, next) {
  if (!req.user || !req.user.subscription) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "AUTH_REQUIRED",
    });
  }

  if (req.user.subscription.plan !== "premium") {
    return res.status(403).json({
      error: "Forbidden",
      message: "This feature requires a premium subscription.",
      code: "PREMIUM_REQUIRED",
    });
  }

  return next();
}

module.exports = { ensureAuthenticated, ensurePremium };
