const mongoose = require("mongoose");

const codingSubmissionSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      index: true,
    },
    sessionId: { type: String, index: true },
    challengeId: String,
    language: String,
    code: String,
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
    codeReview: mongoose.Schema.Types.Mixed,
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

codingSubmissionSchema.index({ interviewId: 1, challengeId: 1 });

module.exports = mongoose.model("CodingSubmission", codingSubmissionSchema);
