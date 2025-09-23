const mongoose = require("mongoose");

// User Profile Schema (extends Clerk user data)
const userProfileSchema = new mongoose.Schema(
  {
    // Clerk user ID for linking
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
    },

    // Basic Information (synced from Clerk)
    email: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: String,
    lastName: String,
    profileImage: String,

    // Professional Details
    professionalInfo: {
      currentRole: String,
      experience: {
        type: String,
        enum: ["entry", "junior", "mid", "senior", "lead", "executive"],
        default: "entry",
      },
      industry: String,
      company: String,
      targetRoles: [String],
      skills: [String],
      resume: {
        filename: String,
        url: String,
        uploadedAt: Date,
      },
    },

    // Interview Preferences
    preferences: {
      preferredLanguages: {
        type: [String],
        default: ["English"],
      },
      interviewTypes: {
        type: [String],
        enum: ["technical", "behavioral", "system-design", "case-study"],
        default: ["technical", "behavioral"],
      },
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner",
      },
      sessionDuration: {
        type: Number,
        default: 30, // minutes
        min: 15,
        max: 120,
      },
      // Facial Expression Analysis Settings
      facialAnalysis: {
        enabled: {
          type: Boolean,
          default: false,
        },
        consentGiven: {
          type: Boolean,
          default: false,
        },
        consentDate: Date,
        autoCalibration: {
          type: Boolean,
          default: true,
        },
        showConfidenceMeter: {
          type: Boolean,
          default: true,
        },
        showRealtimeFeedback: {
          type: Boolean,
          default: true,
        },
        feedbackFrequency: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
      },
    },

    // Analytics & Progress
    analytics: {
      totalInterviews: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      strongAreas: [String],
      improvementAreas: [String],
      streak: {
        current: {
          type: Number,
          default: 0,
        },
        longest: {
          type: Number,
          default: 0,
        },
        lastInterviewDate: Date,
      },
    },

    // Account Status
    subscription: {
      plan: {
        type: String,
        enum: ["free", "premium", "enterprise"],
        default: "free",
      },
      interviewsRemaining: {
        type: Number,
        default: 3, // free plan limit
      },
      nextResetDate: Date,
    },

    // Profile Completion
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    profileCompletenessPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance (clerkUserId and email already have unique: true)
userProfileSchema.index({ "professionalInfo.industry": 1 });
userProfileSchema.index({ "analytics.totalInterviews": -1 });

// Calculate profile completeness
userProfileSchema.methods.calculateCompleteness = function () {
  let completeness = 0;
  const fields = [
    this.firstName,
    this.lastName,
    this.professionalInfo.currentRole,
    this.professionalInfo.experience,
    this.professionalInfo.industry,
    this.professionalInfo.skills?.length > 0,
    this.preferences.interviewTypes?.length > 0,
  ];

  fields.forEach((field) => {
    if (field) completeness += 100 / fields.length;
  });

  this.profileCompleteness = Math.round(completeness);
  this.profileCompletenessPercentage = this.profileCompleteness; // For frontend compatibility
  return this.profileCompleteness;
};

module.exports = mongoose.model("UserProfile", userProfileSchema);
