const Logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
 * SECURITY: JWT-based authentication middleware
 * Alternative to session-based auth for API-only endpoints
 * Extracts JWT from Authorization header (Bearer token)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function protectJWT(req, res, next) {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    // Extract token from "Bearer <token>"
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Not authorized to access this route. No token provided.",
      code: "NO_TOKEN",
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database (excluding password)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Attach userId for compatibility with existing code
    req.userId = String(req.user._id);
    req.auth = {
      userId: req.userId,
      email: req.user.email,
      subscription: req.user.subscription,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Not authorized to access this route. Invalid token.",
      code: "INVALID_TOKEN",
    });
  }
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

module.exports = { ensureAuthenticated, protectJWT, ensurePremium };
