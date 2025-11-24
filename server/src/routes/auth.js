/* eslint-disable consistent-return, no-magic-numbers */
const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../config/jwt");
const requireAuth = require("../middleware/auth");
const { ok, fail } = require("../utils/responder");
const Logger = require("../utils/logger");
const crypto = require("crypto");
const { sendMail } = require("../utils/mailer");

const router = express.Router();

/**
 * @desc    Test authentication setup
 * @route   GET /api/auth/test
 * @access  Public (for debugging)
 */
router.get("/test", async (req, res) => {
  try {
    const userCount = await User.countDocuments();

    return ok(
      res,
      {
        authConfigured: true,
        userCount,
        environment: process.env.NODE_ENV,
        jwtConfigured: !!process.env.JWT_SECRET,
        googleOAuthConfigured: !!(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
      },
      "Authentication is working"
    );
  } catch (error) {
    return fail(
      res,
      500,
      "AUTH_TEST_FAILED",
      "Authentication not configured properly",
      {
        detail: error.message,
        environment: process.env.NODE_ENV,
        troubleshooting: {
          step1: "Check if JWT_SECRET is set in server/.env",
          step2: "Verify MongoDB connection is working",
          step3: "Ensure Google OAuth credentials are set (if using)",
          step4: "Restart server application",
        },
      }
    );
  }
});

/**
 * Helper function to calculate profile completeness
 */
function calculateProfileCompleteness(profile) {
  const fields = [
    profile.personalInfo?.fullName,
    profile.personalInfo?.email,
    profile.professionalInfo?.currentRole,
    profile.professionalInfo?.experience,
    profile.professionalInfo?.industry,
    profile.professionalInfo?.targetRoles?.length > 0,
    profile.professionalInfo?.skills?.length > 0,
  ];

  const completedFields = fields.filter((field) => field).length;
  return Math.round((completedFields / fields.length) * 100);
}

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    const userProfile = await UserProfile.findOne({ user: userId });

    if (!userProfile) {
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
    }

    return ok(res, userProfile, "Profile retrieved successfully");
  } catch (error) {
    Logger.error("Get profile error:", error);
    return fail(
      res,
      500,
      "PROFILE_FETCH_FAILED",
      "Failed to get profile",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
router.put(
  "/profile",
  requireAuth,
  [
    body("personalInfo.fullName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }),
    body("professionalInfo.currentRole")
      .optional()
      .trim()
      .isLength({ max: 100 }),
    body("professionalInfo.experience")
      .optional()
      .isIn(["entry", "junior", "mid", "senior", "lead", "executive"]),
    body("professionalInfo.industry").optional().trim().isLength({ max: 100 }),
    body("professionalInfo.company").optional().trim().isLength({ max: 100 }),
    body("professionalInfo.targetRoles").optional().isArray(),
    body("professionalInfo.skills").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return fail(res, 400, "VALIDATION_FAILED", "Validation failed", {
          details: errors.array(),
        });
      }

      const userId = req.user?.id;
      const updateData = req.body;

      const userProfile = await UserProfile.findOneAndUpdate(
        { user: userId },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!userProfile) {
        return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
      }

      return ok(res, userProfile, "Profile updated successfully");
    } catch (error) {
      Logger.error("Update profile error:", error);
      return fail(
        res,
        500,
        "PROFILE_UPDATE_FAILED",
        "Failed to update profile",
        process.env.NODE_ENV === "development"
          ? { detail: error.message }
          : undefined
      );
    }
  }
);

/**
 * @desc    Get user statistics
 * @route   GET /api/auth/stats
 * @access  Private
 */
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    const userProfile = await UserProfile.findOne({ user: userId });

    if (!userProfile) {
      return fail(res, 404, "PROFILE_NOT_FOUND", "User profile not found");
    }

    const stats = {
      profileCompleteness: calculateProfileCompleteness(userProfile),
      memberSince: userProfile.createdAt,
      lastActive: userProfile.subscription?.lastLoginAt,
      totalInterviews: userProfile.interviewHistory?.length || 0,
      averageScore: userProfile.analytics?.averageScore || 0,
    };

    return ok(res, stats, "Statistics retrieved successfully");
  } catch (error) {
    Logger.error("Get stats error:", error);
    return fail(
      res,
      500,
      "STATS_FETCH_FAILED",
      "Failed to get user statistics",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
  }
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("name").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return fail(res, 400, "VALIDATION_FAILED", "Validation failed", {
          details: errors.array(),
        });
      }

      const { email, password, name } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return fail(res, 409, "USER_EXISTS", "User already exists");
      }

      // Pass plain password, let pre-save hook hash it
      const user = await User.create({
        email,
        password,
        name: name || email.split("@")[0],
      });

      const accessPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };
      const refreshPayload = {
        id: user._id.toString(),
        type: "refresh",
      };

      const accessToken = generateAccessToken(accessPayload);
      const refreshToken = generateRefreshToken(refreshPayload);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: process.env.COOKIE_DOMAIN || undefined,
      });

      return ok(
        res,
        {
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken,
        },
        "Registration successful"
      );
    } catch (error) {
      Logger.error("Registration error:", error);
      return fail(res, 500, "REGISTRATION_FAILED", "Registration failed");
    }
  }
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return fail(res, 400, "VALIDATION_FAILED", "Validation failed", {
          details: errors.array(),
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return fail(res, 401, "INVALID_CREDENTIALS", "Invalid credentials");
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return fail(res, 401, "INVALID_CREDENTIALS", "Invalid credentials");
      }

      const accessPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };
      const refreshPayload = {
        id: user._id.toString(),
        type: "refresh",
      };

      const accessToken = generateAccessToken(accessPayload);
      const refreshToken = generateRefreshToken(refreshPayload);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: process.env.COOKIE_DOMAIN || undefined,
      });

      return ok(
        res,
        {
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken,
        },
        "Login successful"
      );
    } catch (error) {
      Logger.error("Login error:", error);
      return fail(res, 500, "LOGIN_FAILED", "Login failed");
    }
  }
);

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (uses refresh token from cookie or body)
router.post("/refresh", async (req, res) => {
  try {
    // Accept refresh token from either cookies or request body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return fail(res, 401, "NO_REFRESH_TOKEN", "No refresh token provided");
    }

    const payload = verifyToken(refreshToken);
    const user = await User.findById(payload.id);
    if (!user) {
      return fail(res, 401, "INVALID_TOKEN", "Invalid refresh token");
    }

    const newAccessPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const newRefreshPayload = {
      id: user._id.toString(),
      type: "refresh",
    };

    const newAccessToken = generateAccessToken(newAccessPayload);
    const newRefreshToken = generateRefreshToken(newRefreshPayload);

    // Set cookie if original token was from cookie
    if (req.cookies?.refreshToken) {
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: process.env.COOKIE_DOMAIN || undefined,
      });
    }

    // Return new tokens in response body
    return ok(
      res,
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      "Token refreshed"
    );
  } catch (error) {
    Logger.error("Refresh error:", error);
    return fail(res, 401, "REFRESH_FAILED", "Failed to refresh token");
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", requireAuth, (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
  return ok(res, null, "Logged out successfully");
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return fail(res, 404, "USER_NOT_FOUND", "User not found");
    }
    return ok(res, {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    Logger.error("Get me error:", error);
    return fail(res, 500, "USER_FETCH_FAILED", "Failed to get user");
  }
});

/**
 * @desc    Request password reset
 * @route   POST /api/auth/request-password-reset
 * @access  Public
 */
router.post(
  "/request-password-reset",
  [body("email").isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return fail(res, 400, "VALIDATION_FAILED", "Validation failed", {
          details: errors.array(),
        });
      }
      const { email } = req.body;
      Logger.info(`Password reset requested for email: ${email}`);

      const user = await User.findOne({ email });
      if (!user) {
        Logger.info(`No user found with email: ${email}`);
        // For security, always return success
        return ok(res, {}, "If that email exists, a reset link has been sent");
      }

      Logger.info(`User found: ${user._id}, generating reset token`);

      // Generate token
      const token = crypto.randomBytes(32).toString("hex");
      const resetExpires = Date.now() + 1000 * 60 * 30; // 30 min

      // Use updateOne to bypass validation
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetToken: token,
            passwordResetExpires: resetExpires,
          },
        }
      );

      Logger.info(`Token saved for user ${user._id}, sending email`);

      // Send email
      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/reset-password?token=${token}`;

      await sendMail({
        to: user.email,
        subject: "MockMate Password Reset",
        html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link expires in 30 minutes.</p>`,
      });

      Logger.info(`Password reset email sent successfully to ${user.email}`);

      return ok(res, {}, "If that email exists, a reset link has been sent");
    } catch (error) {
      Logger.error("Request password reset error:", error);
      Logger.error("Error stack:", error.stack);
      return fail(
        res,
        500,
        "RESET_REQUEST_FAILED",
        "Could not process password reset request"
      );
    }
  }
);

/**
 * @desc    Verify password reset token
 * @route   GET /api/auth/verify-password-reset
 * @access  Public
 */
router.get("/verify-password-reset", async (req, res) => {
  try {
    const { token } = req.query;
    Logger.info(`Verifying password reset token: ${token}`);

    if (!token) return fail(res, 400, "TOKEN_REQUIRED", "Token required");

    const user = await User.findOne({ passwordResetToken: token });
    Logger.info(`User found for token: ${user ? user._id : "NONE"}`);

    if (!user) {
      Logger.warn(`No user found with token: ${token}`);
      return fail(res, 400, "TOKEN_INVALID", "Invalid or expired token");
    }

    if (!user.passwordResetExpires) {
      Logger.warn(`User ${user._id} has no passwordResetExpires`);
      return fail(res, 400, "TOKEN_INVALID", "Invalid or expired token");
    }

    if (user.passwordResetExpires < Date.now()) {
      Logger.warn(
        `Token expired for user ${user._id}. Expires: ${
          user.passwordResetExpires
        }, Now: ${Date.now()}`
      );
      return fail(res, 400, "TOKEN_INVALID", "Invalid or expired token");
    }

    Logger.info(`Token valid for user ${user._id}`);
    return ok(res, {}, "Token valid");
  } catch (error) {
    Logger.error("Verify password reset error:", error);
    return fail(res, 500, "VERIFY_FAILED", "Could not verify token");
  }
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
router.post(
  "/reset-password",
  [body("token").exists(), body("password").isLength({ min: 6 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return fail(res, 400, "VALIDATION_FAILED", "Validation failed", {
          details: errors.array(),
        });
      }
      const { token, password } = req.body;
      const user = await User.findOne({ passwordResetToken: token });
      if (
        !user ||
        !user.passwordResetExpires ||
        user.passwordResetExpires < Date.now()
      ) {
        return fail(res, 400, "TOKEN_INVALID", "Invalid or expired token");
      }
      user.password = password; // Will be hashed by pre-save hook
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return ok(res, {}, "Password reset successful");
    } catch (error) {
      Logger.error("Reset password error:", error);
      return fail(res, 500, "RESET_FAILED", "Could not reset password");
    }
  }
);

module.exports = router;
