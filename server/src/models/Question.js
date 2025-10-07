const mongoose = require("mongoose");

// Question Bank Schema
const questionSchema = new mongoose.Schema(
  {
    // Question Content
    text: {
      type: String,
      required: true,
      trim: true,
    },

    // Categorization
    category: {
      type: String,
      required: true,
      enum: [
        // Technical Categories
        "javascript",
        "python",
        "java",
        "react",
        "nodejs",
        "database",
        "system-design",
        "algorithms",
        "data-structures",
        "web-development",
        "mobile-development",
        "devops",
        "cloud",
        "security",

        // Behavioral Categories
        "leadership",
        "teamwork",
        "problem-solving",
        "communication",
        "conflict-resolution",
        "adaptability",
        "motivation",
        "goals",

        // Industry Specific
        "finance",
        "healthcare",
        "ecommerce",
        "startup",
        "enterprise",

        // Role Specific
        "frontend",
        "backend",
        "fullstack",
        "data-science",
        "product-management",
        "qa-testing",
        "ui-ux",
      ],
    },

    type: {
      type: String,
      required: true,
      enum: [
        "technical",
        "behavioral",
        "system-design",
        "case-study",
        "situational",
      ],
    },

    // Difficulty & Targeting
    difficulty: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced"],
    },

    experienceLevel: {
      type: [String],
      enum: ["entry", "junior", "mid", "senior", "lead", "executive"],
      default: ["entry", "junior", "mid", "senior"],
    },

    industries: {
      type: [String],
      default: ["general"],
    },

    roles: {
      type: [String],
      default: ["general"],
    },

    // Question Metadata
    estimatedTime: {
      type: Number, // in seconds
      required: true,
      min: 30,
      max: 1800, // 30 minutes max
    },

    tags: [String],

    // Evaluation Criteria
    evaluationCriteria: {
      technical: {
        required: Boolean,
        weight: {
          type: Number,
          default: 0.4,
        },
      },
      communication: {
        required: Boolean,
        weight: {
          type: Number,
          default: 0.3,
        },
      },
      problemSolving: {
        required: Boolean,
        weight: {
          type: Number,
          default: 0.3,
        },
      },
    },

    // Ideal Answer/Guidelines
    idealAnswer: {
      keyPoints: [String],
      sampleAnswer: String,
      commonMistakes: [String],
      gradingRubric: {
        excellent: String,
        good: String,
        average: String,
        poor: String,
      },
    },

    // Follow-up Questions
    followUps: [
      {
        text: String,
        condition: String, // when to ask this follow-up
      },
    ],

    // Usage Statistics
    stats: {
      timesUsed: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      averageTime: {
        type: Number,
        default: 0,
      },
      difficultyRating: {
        type: Number,
        default: 0,
      },
    },

    // Content Management
    status: {
      type: String,
      enum: ["active", "inactive", "review", "archived"],
      default: "active",
    },

    createdBy: {
      type: String, // admin user ID
      default: "system",
    },

    lastModified: {
      by: String,
      at: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ type: 1, experienceLevel: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ tags: 1 });
// Separate indexes for array fields (cannot compound index multiple arrays)
questionSchema.index({ industries: 1 });
questionSchema.index({ roles: 1 });

// Method to check if question is suitable for user
questionSchema.methods.isSuitableFor = function (userProfile, interviewConfig) {
  // Check experience level
  if (!this.experienceLevel.includes(interviewConfig.experienceLevel)) {
    return false;
  }

  // Check difficulty matches config
  if (this.difficulty !== interviewConfig.difficulty) {
    return false;
  }

  // Check type matches
  if (
    interviewConfig.interviewType !== "mixed" &&
    this.type !== interviewConfig.interviewType
  ) {
    return false;
  }

  return true;
};

module.exports = mongoose.model("Question", questionSchema);
