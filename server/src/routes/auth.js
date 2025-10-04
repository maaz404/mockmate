/* eslint-disable consistent-return, no-magic-numbers */
const express = require("express");
const { clerkClient } = require("@clerk/clerk-sdk-node");
const requireAuth = require("../middleware/auth");
const UserProfile = require("../models/UserProfile");
const { body, validationResult } = require("express-validator");
const Logger = require("../utils/logger");

const router = express.Router();

/**
 * @desc    Test Clerk connection and OAuth setup
 * @route   GET /api/auth/test
 * @access  Public (for debugging)
 */
router.get("/test", async (req, res) => {
  try {
    // Test Clerk SDK connection
    const testUser = await clerkClient.users.getUserList({ limit: 1 });

    res.status(200).json({
      success: true,
      message: "Clerk authentication is working",
      clerkConfigured: true,
      userCount: testUser.length,
      environment: process.env.NODE_ENV,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY
        ? "Set"
        : "Missing",
      clerkSecretKey: process.env.CLERK_SECRET_KEY ? "Set" : "Missing",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Clerk authentication not configured properly",
      message: error.message,
      clerkConfigured: false,
      environment: process.env.NODE_ENV,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY
        ? "Set"
        : "Missing",
      clerkSecretKey: process.env.CLERK_SECRET_KEY ? "Set" : "Missing",
      troubleshooting: {
        step1: "Check if CLERK_SECRET_KEY is set in server/.env",
        step2: "Verify Clerk application exists at https://clerk.com/dashboard",
        step3: "Ensure Google OAuth is enabled in Social Connections",
        step4: "Add http://localhost:3000 to Authorized redirect URIs",
        step5: "Restart both server and client applications",
      },
    });
  }
});
router.post("/sync", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;

    const usingMockAuth =
      process.env.NODE_ENV !== "production" &&
      process.env.MOCK_AUTH_FALLBACK === "true" &&
      (!req.headers?.authorization || String(userId).startsWith("test-"));

    let clerkUser = null;
    if (!usingMockAuth && process.env.CLERK_SECRET_KEY) {
      clerkUser = await clerkClient.users.getUser(userId);
    } else {
      // Stub user in mock mode
      clerkUser = {
        emailAddresses: [{ emailAddress: `${userId}@example.com` }],
        firstName: "Test",
        lastName: "User",
        profileImageUrl: null,
      };
    }

    // Check if user profile already exists
    let userProfile = await UserProfile.findOne({ clerkUserId: userId });

    const userData = {
      clerkUserId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      profileImage: clerkUser.profileImageUrl || "",
      lastLoginAt: new Date(),
    };

    if (userProfile) {
      // Update existing profile
      userProfile = await UserProfile.findOneAndUpdate(
        { clerkUserId: userId },
        userData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile
      userProfile = new UserProfile(userData);
      await userProfile.save();
    }

    res.status(200).json({
      success: true,
      data: {
        user: userProfile,
        isNewUser: !userProfile.professionalInfo?.currentRole,
      },
      message: "User profile synced successfully",
    });
  } catch (error) {
    Logger.error("Auth sync error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync user profile",
      message: error.message,
    });
  }
});

// Lightweight whoami debugging route
router.get("/whoami", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    let clerkUser = null;
    if (process.env.CLERK_SECRET_KEY) {
      try {
        clerkUser = await clerkClient.users.getUser(userId);
      } catch (e) {
        clerkUser = null;
      }
    }
    return res.status(200).json({
      success: true,
      auth: req.auth,
      emailVerified:
        clerkUser?.primaryEmailAddress?.verification?.status === "verified",
      emailStatus:
        clerkUser?.primaryEmailAddress?.verification?.status || "unknown",
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "whoami_failed",
      message: e.message,
    });
  }
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;

    // Get user profile from database
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found",
        message: "Please complete your profile setup",
      });
    }

    // Get fresh Clerk data
    const clerkUser = await clerkClient.users.getUser(userId);

    res.status(200).json({
      success: true,
      data: {
        profile: userProfile,
        clerk: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profileImageUrl: clerkUser.profileImageUrl,
          createdAt: clerkUser.createdAt,
          lastSignInAt: clerkUser.lastSignInAt,
        },
      },
    });
  } catch (error) {
    Logger.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user profile",
      message: error.message,
    });
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
    body("firstName").optional().trim().isLength({ min: 1, max: 50 }),
    body("lastName").optional().trim().isLength({ min: 1, max: 50 }),
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
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { userId } = req.auth;
      const updateData = req.body;

      // Update user profile
      const userProfile = await UserProfile.findOneAndUpdate(
        { clerkUserId: userId },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: "User profile not found",
        });
      }

      res.status(200).json({
        success: true,
        data: userProfile,
        message: "Profile updated successfully",
      });
    } catch (error) {
      Logger.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
        message: error.message,
      });
    }
  }
);

/**
 * @desc    Delete user account
 * @route   DELETE /api/auth/account
 * @access  Private
 */
router.delete("/account", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;

    // Delete from our database
    await UserProfile.findOneAndDelete({ clerkUserId: userId });

    // Delete from Clerk (optional - you might want to keep this separate)
    // await clerkClient.users.deleteUser(userId);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    Logger.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete account",
      message: error.message,
    });
  }
});

/**
 * @desc    Upload profile avatar
 * @route   POST /api/auth/avatar
 * @access  Private
 */
router.post("/avatar", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Image URL is required",
      });
    }

    // Update profile image in our database
    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      { profileImage: imageUrl },
      { new: true }
    );

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { profileImage: imageUrl },
      message: "Avatar updated successfully",
    });
  } catch (error) {
    Logger.error("Update avatar error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update avatar",
      message: error.message,
    });
  }
});

/**
 * @desc    Get user statistics
 * @route   GET /api/auth/stats
 * @access  Private
 */
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;

    const userProfile = await UserProfile.findOne({ clerkUserId: userId });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found",
      });
    }

    // Calculate user statistics
    const stats = {
      profileCompleteness: calculateProfileCompleteness(userProfile),
      memberSince: userProfile.createdAt,
      lastActive: userProfile.lastLoginAt,
      totalInterviews: userProfile.interviewHistory?.length || 0,
      averageScore: userProfile.analytics?.averageScore || 0,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    Logger.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user statistics",
      message: error.message,
    });
  }
});

/**
 * Helper function to calculate profile completeness
 */
function calculateProfileCompleteness(profile) {
  const fields = [
    profile.firstName,
    profile.lastName,
    profile.professionalInfo?.currentRole,
    profile.professionalInfo?.experience,
    profile.professionalInfo?.industry,
    profile.professionalInfo?.targetRoles?.length > 0,
    profile.professionalInfo?.skills?.length > 0,
  ];

  const completedFields = fields.filter((field) => field).length;
  return Math.round((completedFields / fields.length) * 100);
}

module.exports = router;
