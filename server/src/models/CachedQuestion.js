const mongoose = require("mongoose");

// Cached Question Generation Schema
const cachedQuestionSchema = new mongoose.Schema(
  {
    // Cache key based on interview configuration
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Interview configuration used for generation
    config: {
      jobRole: {
        type: String,
        required: true,
      },
      experienceLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: true,
      },
      interviewType: {
        type: String,
        enum: ["technical", "behavioral", "mixed"],
        required: true,
      },
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: true,
      },
      questionCount: {
        type: Number,
        required: true,
      },
    },

    // Generated questions for this configuration
    questions: [
      {
        text: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        tags: [String],
        difficulty: {
          type: String,
          enum: ["beginner", "intermediate", "advanced"],
          required: true,
        },
        estimatedTime: {
          type: Number,
          required: true,
        },
        type: {
          type: String,
          enum: ["technical", "behavioral", "system-design"],
          required: true,
        },
        source: {
          type: String,
          enum: ["template", "ai_generated", "ai_paraphrased"],
          required: true,
        },
        // For AI generated/paraphrased questions
        originalTemplateId: String,
        generatedAt: Date,
        paraphrasedFrom: String,
      },
    ],

    // Cache metadata
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    // Cache expires after 24 hours for fresh content
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Generate cache key from config
cachedQuestionSchema.statics.generateCacheKey = function (config) {
  const { jobRole, experienceLevel, interviewType, difficulty, questionCount } =
    config;
  return `${jobRole}_${experienceLevel}_${interviewType}_${difficulty}_${questionCount}`;
};

// Update usage statistics
cachedQuestionSchema.methods.markUsed = function () {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model("CachedQuestion", cachedQuestionSchema);