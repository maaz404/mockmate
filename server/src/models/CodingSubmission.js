const mongoose = require("mongoose");

const codingSubmissionSchema = new mongoose.Schema(
  {
    // ADDED: User reference for direct queries
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      index: true,
    },
    sessionId: { type: String, index: true },
    challengeId: String,
    challengeTitle: String,
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    topic: String,
    problemStatement: String,
    language: {
      type: String,
      required: true,
      enum: ["javascript", "python", "java", "cpp", "go", "typescript"],
    },
    code: String,
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "failed"],
      default: "pending",
      index: true,
    },
    score: Number,
    testResults: [
      {
        testIndex: Number,
        passed: Boolean,
        executionTime: Number,
        expected: mongoose.Schema.Types.Mixed,
        actual: mongoose.Schema.Types.Mixed,
        error: String,
      },
    ],
    feedback: {
      summary: String,
      strengths: [String],
      improvements: [String],
      suggestions: [String],
    },
    codeReview: {
      complexity: String,
      efficiency: String,
      readability: String,
      bestPractices: [String],
      suggestions: [String],
    },
    submittedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);

// Indexes for efficient queries
codingSubmissionSchema.index({ user: 1, createdAt: -1 });
codingSubmissionSchema.index({ user: 1, status: 1 });
codingSubmissionSchema.index({ interviewId: 1, challengeId: 1 });
codingSubmissionSchema.index({ sessionId: 1 });

module.exports = mongoose.model("CodingSubmission", codingSubmissionSchema);
