const mongoose = require("mongoose");
const AssetSchema = require("./common/Asset");

const UserProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    // ============================================
    // PERSONAL INFORMATION
    // ============================================
    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
        "Please enter a valid phone number",
      ],
    },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    timezone: {
      type: String,
      default: "UTC",
    },

    // ============================================
    // MEDIA ASSETS (Cloudinary) - SINGLE SOURCE
    // ============================================
    avatar: {
      type: AssetSchema,
      default: null,
    },
    resume: {
      type: AssetSchema,
      default: null,
    },

    // ============================================
    // PROFESSIONAL INFORMATION (FIXED - NO RESUME DUPLICATE)
    // ============================================
    professionalInfo: {
      currentRole: { type: String, trim: true },
      company: { type: String, trim: true },
      experience: {
        type: String,
        enum: ["entry", "junior", "mid", "senior", "lead", "executive"],
      },
      industry: { type: String, trim: true },
      targetRoles: [{ type: String, trim: true }],
      skills: [{ type: String, trim: true }],
      skillsToImprove: [{ type: String, trim: true }],
      // ❌ REMOVED: resume field (use top-level resume instead)
    },

    // ============================================
    // SOCIAL LINKS
    // ============================================
    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
        match: [
          /^https?:\/\/(www\.)?linkedin\.com\/.*$/,
          "Please enter a valid LinkedIn URL",
        ],
      },
      github: {
        type: String,
        trim: true,
        match: [
          /^https?:\/\/(www\.)?github\.com\/.*$/,
          "Please enter a valid GitHub URL",
        ],
      },
      portfolio: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.*$/, "Please enter a valid URL"],
      },
    },

    // ============================================
    // ONBOARDING
    // ============================================
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingProgress: {
      step: { type: Number, default: 0 },
      completedSteps: [{ type: Number }],
      lastUpdated: { type: Date },
    },

    // ============================================
    // PREFERENCES
    // ============================================
    preferences: {
      interviewTypes: [
        {
          type: String,
          enum: ["technical", "behavioral", "coding", "system-design", "mixed"],
        },
      ],
      focusAreas: [{ type: String, trim: true }],
      defaultDifficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true },
      },
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      language: {
        type: String,
        default: "en",
      },
      dashboard: {
        density: {
          type: String,
          enum: ["comfortable", "compact", "spacious"],
          default: "comfortable",
        },
        defaultView: {
          type: String,
          enum: ["grid", "list"],
          default: "grid",
        },
        showTips: { type: Boolean, default: true },
        showStreaks: { type: Boolean, default: true },
      },
    },

    // ============================================
    // INTERVIEW GOALS
    // ============================================
    interviewGoals: {
      targetCompanies: [{ type: String, trim: true }],
      targetRoles: [{ type: String, trim: true }],
      weeklyInterviewGoal: { type: Number, default: 3 },
      improvementAreas: [{ type: String, trim: true }],
    },

    // ============================================
    // GOALS (for dashboard)
    // ============================================
    goals: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: String,
        targetDate: Date,
        completed: { type: Boolean, default: false },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        category: {
          type: String,
          enum: ["interview", "skill", "job", "personal"],
          default: "interview",
        },
        createdAt: { type: Date, default: Date.now },
        completedAt: Date,
      },
    ],

    // ============================================
    // ANALYTICS
    // ============================================
    analytics: {
      totalInterviews: { type: Number, default: 0 },
      completedInterviews: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0, min: 0, max: 100 },
      strongAreas: [{ type: String, trim: true }],
      improvementAreas: [{ type: String, trim: true }],
      streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastInterviewDate: Date,
      },
      lastCalculated: Date,
    },

    // ============================================
    // SUBSCRIPTION (SINGLE SOURCE OF TRUTH)
    // ============================================
    subscription: {
      plan: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "cancelled", "expired", "trialing"],
        default: "active",
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      interviewsRemaining: { type: Number, default: 10 },
      interviewsUsedThisMonth: { type: Number, default: 0 },
      lastInterviewReset: { type: Date, default: Date.now },
      // Added for quota reset + idempotency tracking (tests rely on these)
      nextResetDate: { type: Date },
      lastConsumedInterviewId: { type: String },
      periodStart: Date,
      periodEnd: Date,
      cancelAtPeriodEnd: { type: Boolean, default: false },
    },

    // ============================================
    // ACTIVITY
    // ============================================
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
UserProfileSchema.index({ user: 1 }, { unique: true });
UserProfileSchema.index({ email: 1 }); // Non-unique index for lookups
UserProfileSchema.index({ "subscription.plan": 1 });
UserProfileSchema.index({ "subscription.stripeCustomerId": 1 });
UserProfileSchema.index({ lastLoginAt: -1 });
UserProfileSchema.index({ onboardingCompleted: 1 });

// ============================================
// VIRTUALS
// ============================================
UserProfileSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim() || "User";
});

UserProfileSchema.virtual("profileCompleteness").get(function () {
  const fields = [
    this.firstName,
    this.lastName,
    this.bio,
    this.phone,
    this.location?.city,
    this.avatar?.publicId,
    this.professionalInfo?.currentRole,
    this.professionalInfo?.experience,
    this.professionalInfo?.industry,
    this.professionalInfo?.targetRoles?.length > 0,
    this.professionalInfo?.skills?.length > 0,
    this.socialLinks?.linkedin,
  ];

  const completedFields = fields.filter((field) => field).length;
  return Math.round((completedFields / fields.length) * 100);
});

// ============================================
// METHODS
// ============================================
UserProfileSchema.methods.hasUnlimitedInterviews = function () {
  return ["premium", "enterprise"].includes(this.subscription.plan);
};

UserProfileSchema.methods.canCreateInterview = function () {
  if (this.hasUnlimitedInterviews()) {
    return { allowed: true };
  }

  const now = new Date();
  const lastReset = new Date(this.subscription.lastInterviewReset);
  const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

  if (daysSinceReset >= 30) {
    this.subscription.interviewsUsedThisMonth = 0;
    this.subscription.lastInterviewReset = now;
  }

  const remaining =
    this.subscription.interviewsRemaining -
    this.subscription.interviewsUsedThisMonth;

  return {
    allowed: remaining > 0,
    remaining,
    limit: this.subscription.interviewsRemaining,
  };
};

UserProfileSchema.methods.consumeInterview = function () {
  if (!this.hasUnlimitedInterviews()) {
    this.subscription.interviewsUsedThisMonth += 1;
  }
  this.analytics.totalInterviews += 1;
};

// ============================================
// CONFIGURATION
// ============================================
UserProfileSchema.set("toJSON", { virtuals: true });
UserProfileSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("UserProfile", UserProfileSchema);
