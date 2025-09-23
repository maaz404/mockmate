/* eslint-disable no-console, consistent-return, no-magic-numbers */
const UserProfile = require("../models/UserProfile");
const { clerkClient } = require("@clerk/clerk-sdk-node");

// Get or create user profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req.auth;

    let userProfile = await UserProfile.findOne({ clerkUserId: userId });

    // If profile doesn't exist, create one from Clerk data
    if (!userProfile) {
      const clerkUser = await clerkClient.users.getUser(userId);

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
        lastModified: new Date(),
      },
      {
        new: true,
        runValidators: true,
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
    const { userId } = req.auth;
    const { professionalInfo, preferences } = req.body;

    // Validate required data
    if (!professionalInfo || !preferences) {
      return res.status(400).json({
        success: false,
        message: "Missing required onboarding data",
        details: {
          professionalInfo: !professionalInfo ? "Professional information is required" : null,
          preferences: !preferences ? "Preferences are required" : null,
        },
      });
    }

    // Validate professionalInfo fields
    if (!professionalInfo.currentRole || !professionalInfo.industry) {
      return res.status(400).json({
        success: false,
        message: "Missing required professional information",
        details: {
          currentRole: !professionalInfo.currentRole ? "Current role is required" : null,
          industry: !professionalInfo.industry ? "Industry is required" : null,
        },
      });
    }

    // Validate preferences fields
    if (!preferences.interviewTypes || preferences.interviewTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one interview type must be selected",
      });
    }

    // Ensure a profile exists; if not, create it from Clerk data on the fly
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(userId);
    } catch (clerkError) {
      console.error("Clerk API error:", clerkError);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch user data from authentication service",
      });
    }

    if (!clerkUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in authentication service",
      });
    }

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId: userId },
      {
        $set: {
          professionalInfo,
          preferences,
          onboardingCompleted: true,
          lastModified: new Date(),
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
        runValidators: true,
        upsert: true,
      }
    );

    // Calculate completeness after onboarding
    userProfile.calculateCompleteness();
    await userProfile.save();

    res.json({
      success: true,
      message: "Onboarding completed successfully",
      data: userProfile,
    });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
  getAnalytics,
  updateAnalytics,
  uploadResume,
};
