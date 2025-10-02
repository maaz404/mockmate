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
      skills: [
        {
          name: String,
          confidence: {
            type: Number,
            min: 1,
            max: 5,
            default: 3,
          },
          category: {
            type: String,
            enum: ["programming", "framework", "tool", "soft-skill", "domain"],
            default: "programming",
          },
        },
      ],
      skillsToImprove: [
        {
          name: String,
          priority: {
            type: String,
            enum: ["high", "medium", "low"],
            default: "medium",
          },
        },
      ],
      careerGoals: String,
      resume: {
        filename: String,
        url: String,
        uploadedAt: Date,
      },
    },

    // Interview Goals & Timeline
    interviewGoals: {
      primaryGoal: {
        type: String,
        enum: [
          "specific-company",
          "general-practice",
          "technical-communication",
          "behavioral-confidence",
        ],
        default: "general-practice",
      },
      targetCompanies: [String],
      timeline: {
        type: String,
        enum: ["within-1-week", "1-4-weeks", "1-3-months", "exploring"],
        default: "exploring",
      },
      expectedInterviewDate: Date,
    },

    // Interview Preferences
    preferences: {
      preferredLanguages: {
        type: [String],
        default: ["English"],
      },
      interviewTypes: {
        type: [String],
        enum: [
          "technical",
          "behavioral",
          "system-design",
          "case-study",
          "leadership",
          "sales",
        ],
        default: ["technical", "behavioral"],
      },
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
        default: "intermediate",
      },
      focusAreas: {
        type: [String],
        enum: [
          "problem-solving",
          "communication",
          "leadership",
          "technical-skills",
          "industry-knowledge",
          "presentation-skills",
        ],
        default: [],
      },
      sessionDuration: {
        type: Number,
        default: 30, // minutes
        min: 15,
        max: 120,
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        interviews: {
          type: Boolean,
          default: true,
        },
        progress: {
          type: Boolean,
          default: true,
        },
      },
      // Dashboard UI Preferences (for cross-device consistency)
      dashboard: {
        density: {
          type: String,
          enum: ["comfortable", "compact"],
          default: "comfortable",
        },
        upcomingView: {
          type: String,
          enum: ["list", "week"],
          default: "list",
        },
        thisWeekOnly: {
          type: Boolean,
          default: false,
        },
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

    // Simple weekly goals for dashboard
    goals: [
      {
        title: { type: String, required: true },
        done: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

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
  const MAX_COMPLETENESS = 100;
  let completeness = 0;

  // Safely access nested properties
  const fields = [
    this.firstName,
    this.lastName,
    this.professionalInfo?.currentRole,
    this.professionalInfo?.experience,
    this.professionalInfo?.industry,
    this.professionalInfo?.skills?.length > 0,
    this.preferences?.interviewTypes?.length > 0,
  ];

  fields.forEach((field) => {
    if (field) completeness += MAX_COMPLETENESS / fields.length;
  });

  this.profileCompleteness = Math.round(completeness);
  this.profileCompletenessPercentage = this.profileCompleteness; // For frontend compatibility
  return this.profileCompleteness;
};

module.exports = mongoose.model("UserProfile", userProfileSchema);
