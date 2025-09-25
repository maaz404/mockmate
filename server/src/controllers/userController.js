/* eslint-disable no-console, consistent-return, no-magic-numbers */
const UserProfile = require("../models/UserProfile");
const { clerkClient } = require("@clerk/clerk-sdk-node");

// Get or create user profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req.auth;

    let userProfile = await UserProfile.findOne({ clerkUserId: userId });

    if (!userProfile) {
      // Try to get user from Clerk, but don't fail if Clerk is not configured (development mode)
      let clerkUser = null;
      try {
        if (process.env.CLERK_SECRET_KEY) {
          clerkUser = await clerkClient.users.getUser(userId);
        }
      } catch (clerkError) {
        console.error("Clerk API error:", clerkError);
        // In development, continue without Clerk data
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "Continuing without Clerk authentication in development mode"
          );
        } else {
          return res.status(500).json({
            success: false,
            message: "Failed to fetch user data from authentication service",
          });
        }
      }

      // Fallback user data for development
      if (!clerkUser && process.env.NODE_ENV !== "production") {
        clerkUser = {
          emailAddresses: [{ emailAddress: `user-${userId}@example.com` }],
          firstName: "Test",
          lastName: "User",
          profileImageUrl: null,
        };
      }

      if (!clerkUser) {
        return res.status(404).json({
          success: false,
          message: "User not found in authentication service",
        });
      }

      // Create new profile
      userProfile = new UserProfile({
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImage: clerkUser.profileImageUrl,
      });

      await userProfile.save();
    }

    res.json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

// Save onboarding progress
const saveOnboardingProgress = async (req, res) => {
  try {
    const { userId } = req.auth;
    let progressData = req.body;

    console.log("Save onboarding progress - userId:", userId);
    console.log("Progress data:", JSON.stringify(progressData, null, 2));

    // Sanitize data
    if (progressData.professionalInfo) {
      // Handle empty experience
      if (
        !progressData.professionalInfo.experience ||
        progressData.professionalInfo.experience === ""
      ) {
        progressData.professionalInfo.experience = "entry";
      }

      // Ensure arrays are arrays
      if (!Array.isArray(progressData.professionalInfo.skills)) {
        progressData.professionalInfo.skills = [];
      }
      if (!Array.isArray(progressData.professionalInfo.skillsToImprove)) {
        progressData.professionalInfo.skillsToImprove = [];
      }
    }

    if (progressData.interviewGoals) {
      if (!Array.isArray(progressData.interviewGoals.targetCompanies)) {
        progressData.interviewGoals.targetCompanies = [];
      }
    }

    if (progressData.preferences) {
      if (!Array.isArray(progressData.preferences.interviewTypes)) {
        progressData.preferences.interviewTypes = [];
      }
      if (!Array.isArray(progressData.preferences.focusAreas)) {
        progressData.preferences.focusAreas = [];
      }
    }

    // Remove sensitive fields that shouldn't be updated
    delete progressData.clerkUserId;
    delete progressData.email;
    delete progressData.analytics;
    delete progressData.subscription;
    delete progressData.onboardingCompleted; // Don't mark as completed when saving progress

    console.log(
      "Filtered progress data:",
      JSON.stringify(progressData, null, 2)
    );

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      {
        $set: progressData,
      },
      {
        new: true,
        upsert: true,
      }
    );

    console.log("User profile after update:", userProfile);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Calculate completeness but don't save yet (progress save)
    userProfile.calculateCompleteness();

    res.json({
      success: true,
      message: "Onboarding progress saved successfully",
      data: userProfile,
    });
  } catch (error) {
    console.error("Save onboarding progress error:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to save onboarding progress",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.auth;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.clerkUserId;
    delete updates.email;
    delete updates.analytics;
    delete updates.subscription;

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      {
        ...updates,
      },
      {
        new: true,
      }
    );

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Recalculate completeness
    userProfile.calculateCompleteness();
    await userProfile.save();

    res.json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Complete onboarding
const completeOnboarding = async (req, res) => {
  try {
    // Get userId from auth - handle different possible formats
    let userId = req.auth?.userId || req.auth?.id || req.auth?.sub;

    console.log("Complete onboarding - req.auth:", req.auth);
    console.log("Complete onboarding - extracted userId:", userId);

    // Fallback for development: use a test user ID if not authenticated
    if (!userId && process.env.NODE_ENV !== "production") {
      console.warn("No userId found in auth, using test user for development");
      userId = "test-user-123";
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let { professionalInfo, preferences, interviewGoals } = req.body;

    // Sanitize and validate data
    if (!professionalInfo) professionalInfo = {};
    if (!preferences) preferences = {};
    if (!interviewGoals) interviewGoals = {};

    // Handle empty experience - set default if empty
    if (!professionalInfo.experience || professionalInfo.experience === "") {
      professionalInfo.experience = "entry";
    }

    // Ensure arrays are arrays
    if (!Array.isArray(professionalInfo.skills)) professionalInfo.skills = [];
    if (!Array.isArray(professionalInfo.skillsToImprove))
      professionalInfo.skillsToImprove = [];
    if (!Array.isArray(interviewGoals.targetCompanies))
      interviewGoals.targetCompanies = [];
    if (!Array.isArray(preferences.interviewTypes))
      preferences.interviewTypes = [];
    if (!Array.isArray(preferences.focusAreas)) preferences.focusAreas = [];

    // Validate required data
    if (!professionalInfo.currentRole || !professionalInfo.industry) {
      return res.status(400).json({
        success: false,
        message: "Missing required professional information",
        details: {
          currentRole: !professionalInfo.currentRole
            ? "Current role is required"
            : null,
          industry: !professionalInfo.industry ? "Industry is required" : null,
        },
      });
    }

    // Validate interview goals
    if (!interviewGoals.primaryGoal || !interviewGoals.timeline) {
      return res.status(400).json({
        success: false,
        message: "Missing required interview goals",
        details: {
          primaryGoal: !interviewGoals.primaryGoal
            ? "Primary goal is required"
            : null,
          timeline: !interviewGoals.timeline ? "Timeline is required" : null,
        },
      });
    }

    // Validate preferences
    if (
      !preferences.interviewTypes ||
      preferences.interviewTypes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one interview type must be selected",
      });
    }

    // Ensure a profile exists; if not, create it from Clerk data on the fly
    let clerkUser = null;

    // Try to get user from Clerk, but don't fail if Clerk is not configured (development mode)
    try {
      if (process.env.CLERK_SECRET_KEY) {
        clerkUser = await clerkClient.users.getUser(userId);
      }
    } catch (clerkError) {
      console.error("Clerk API error:", clerkError);

      // In production with Clerk configured, this should fail
      if (
        process.env.NODE_ENV === "production" &&
        process.env.CLERK_SECRET_KEY
      ) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch user data from authentication service",
        });
      }

      // In development, continue without Clerk data
      console.warn(
        "Continuing without Clerk authentication in development mode"
      );
    }

    // Fallback user data for development
    if (!clerkUser && process.env.NODE_ENV !== "production") {
      clerkUser = {
        emailAddresses: [{ emailAddress: `user-${userId}@example.com` }],
        firstName: "Test",
        lastName: "User",
        profileImageUrl: null,
      };
    }

    if (!clerkUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in authentication service",
      });
    }

    console.log("About to create/update user profile for userId:", userId);

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      {
        $set: {
          professionalInfo,
          preferences,
          interviewGoals,
          onboardingCompleted: true,
        },
        $setOnInsert: {
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profileImage: clerkUser.profileImageUrl,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    console.log("User profile created/updated:", userProfile._id);

    // Calculate completeness after onboarding
    try {
      userProfile.calculateCompleteness();
      await userProfile.save();
      console.log("Profile completeness calculated and saved");
    } catch (calcError) {
      console.error("Error calculating completeness:", calcError);
      // Continue without failing
    }

    console.log("Onboarding completed successfully");

    res.json({
      success: true,
      message: "Onboarding completed successfully",
      data: userProfile,
    });
  } catch (error) {
    console.error("Complete onboarding error:", error);

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: validationErrors,
      });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User profile already exists",
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Failed to complete onboarding",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user analytics
const getAnalytics = async (req, res) => {
  try {
    const { userId } = req.auth;

    const userProfile = await UserProfile.findOne(
      { clerkUserId: userId },
      { analytics: 1, subscription: 1 }
    );

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.json({
      success: true,
      data: {
        analytics: userProfile.analytics,
        subscription: userProfile.subscription,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

// Update user analytics (internal use)
const updateAnalytics = async (userId, analyticsUpdate) => {
  try {
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Update analytics
    Object.keys(analyticsUpdate).forEach((key) => {
      if (userProfile.analytics[key] !== undefined) {
        userProfile.analytics[key] = analyticsUpdate[key];
      }
    });

    // Update streak if it's a new interview
    if (analyticsUpdate.lastInterviewDate) {
      const today = new Date();
      const lastDate = new Date(userProfile.analytics.streak.lastInterviewDate);
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        userProfile.analytics.streak.current += 1;
        userProfile.analytics.streak.longest = Math.max(
          userProfile.analytics.streak.longest,
          userProfile.analytics.streak.current
        );
      } else if (daysDiff > 1) {
        // Streak broken
        userProfile.analytics.streak.current = 1;
      }
      // Same day, no change needed

      userProfile.analytics.streak.lastInterviewDate = today;
    }

    await userProfile.save();
    return userProfile;
  } catch (error) {
    console.error("Update analytics error:", error);
    throw error;
  }
};

// Upload resume
const uploadResume = async (req, res) => {
  try {
    const { userId } = req.auth;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      {
        "professionalInfo.resume": {
          filename: req.file.originalname,
          url: req.file.path, // This would be S3 URL in production
          uploadedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.json({
      success: true,
      message: "Resume uploaded successfully",
      data: userProfile.professionalInfo.resume,
    });
  } catch (error) {
    console.error("Upload resume error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload resume",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  completeOnboarding,
  saveOnboardingProgress,
  getAnalytics,
  updateAnalytics,
  uploadResume,
};
