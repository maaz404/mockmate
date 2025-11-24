// Canonical, deduplicated Interview schema
const mongoose = require("mongoose");
const AssetSchema = require("./common/Asset");

// ---------------- Question Subdocument ----------------
const questionSubSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    questionText: String,
    category: String,
    type: String,
    difficulty: String,
    timeAllocated: Number,
    timeSpent: Number,
    challengeId: String,
    response: {
      text: String,
      notes: String,
      audioUrl: String,
      submittedAt: Date,
    },
    followUpsReviewed: { type: Boolean, default: false },
    followUpsReviewedAt: Date,
    video: {
      filename: String,
      path: String,
      duration: Number,
      uploadedAt: Date,
      size: Number,
      transcript: {
        text: String,
        generatedAt: Date,
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending",
        },
        language: String,
        segments: [
          new mongoose.Schema(
            {
              id: Number,
              start: Number,
              end: Number,
              text: String,
              confidence: Number,
            },
            { _id: false }
          ),
        ],
        error: String,
      },
      cloudinary: {
        publicId: String,
        url: String,
        bytes: Number,
        format: String,
        width: Number,
        height: Number,
        duration: Number,
        folder: String,
      },
      facialAnalysis: {
        enabled: { type: Boolean, default: false },
        metrics: {
          eyeContact: Number,
          blinkRate: Number,
          smilePercentage: Number,
          headSteadiness: Number,
          offScreenPercentage: Number,
          confidenceScore: Number,
        },
        baseline: {
          completed: { type: Boolean, default: false },
          eyeContact: Number,
          blinkRate: Number,
          smilePercentage: Number,
          headSteadiness: Number,
          calibratedAt: Date,
        },
        sessionSummary: {
          averageEyeContact: Number,
          averageBlinkRate: Number,
          averageSmile: Number,
          averageHeadSteadiness: Number,
          confidenceTrend: String,
        },
        analysisTimestamp: Date,
      },
    },
    score: {
      overall: { type: Number, min: 0, max: 100 },
      rubricScores: {
        relevance: { type: Number, min: 1, max: 5 },
        clarity: { type: Number, min: 1, max: 5 },
        depth: { type: Number, min: 1, max: 5 },
        structure: { type: Number, min: 1, max: 5 },
      },
      breakdown: {
        relevance: Number,
        clarity: Number,
        completeness: Number,
        technical: Number,
      },
    },
    feedback: {
      strengths: [String],
      improvements: [String],
      suggestions: String,
      modelAnswer: String,
    },
    followUpQuestions: [
      {
        text: String,
        type: {
          type: String,
          enum: ["clarification", "example", "technical", "challenge"],
          default: "clarification",
        },
        generatedAt: { type: Date, default: Date.now },
      },
    ],
    facial: {
      eyeContact: Number,
      blinkRate: Number,
      smilePercentage: Number,
      headSteadiness: Number,
      offScreenPercentage: Number,
      confidenceScore: Number,
      capturedAt: Date,
    },
    skipped: { type: Boolean, default: false },
    skippedAt: Date,
  },
  { _id: false, strict: false }
);

// --------------- Resilience Parser -----------------
function parseSerializedQuestions(raw) {
  if (typeof raw !== "string" || !raw.includes("questionText:")) return null;
  try {
    const body = raw.replace(/^[\s\[]+/, "").replace(/[\]]+\s*$/, "");
    const parts = body.split(/}\s*,/);
    const parsed = [];
    for (const chunk of parts) {
      const qt = (chunk.match(/questionText:\s*'([^']+)'/) || [])[1];
      if (!qt) continue;
      const cat = (chunk.match(/category:\s*'([^']+)'/) || [])[1];
      const diff = (chunk.match(/difficulty:\s*'([^']+)'/) || [])[1];
      const time = (chunk.match(/timeAllocated:\s*(\d+)/) || [])[1];
      const reviewed = /followUpsReviewed:\s*true/.test(chunk);
      parsed.push({
        questionId: new mongoose.Types.ObjectId(),
        questionText: qt,
        category: cat,
        difficulty: diff || "intermediate",
        timeAllocated: time ? parseInt(time, 10) : undefined,
        followUpsReviewed: reviewed,
      });
    }
    return parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

// ---------------- Main Schema ----------------
const interviewSchema = new mongoose.Schema(
  {
    // CHANGED: userId: String → user: ObjectId
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },
    config: {
      jobRole: { type: String, required: true },
      industry: String,
      experienceLevel: {
        type: String,
        enum: ["entry", "junior", "mid", "senior", "lead", "executive"],
        required: true,
      },
      interviewType: {
        type: String,
        enum: [
          "technical",
          "behavioral",
          "system-design",
          "case-study",
          "mixed",
        ],
        required: true,
      },
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: true,
      },
      duration: { type: Number, required: true, min: 15, max: 120 },
      questionCount: { type: Number, default: 10, min: 5, max: 50 },
      focusAreas: [String],
      adaptiveDifficulty: {
        enabled: { type: Boolean, default: false },
        initialDifficulty: String,
        currentDifficulty: String,
        difficultyHistory: [
          {
            questionIndex: Number,
            difficulty: String,
            score: Number,
            timestamp: Date,
          },
        ],
      },
      videoAnswersEnabled: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "abandoned"],
      default: "scheduled",
      index: true,
    },
    // Root-level completedAt for easier dashboard queries (duplicates timing.completedAt)
    completedAt: { type: Date, index: true },
    recording: { type: AssetSchema },
    snapshots: { type: [AssetSchema], default: [] },
    transcript: { type: AssetSchema },
    metrics: {
      totalQuestions: Number,
      avgScore: Number,
      avgAnswerDurationMs: Number,
      totalDurationMs: Number,
      eyeContactScore: Number,
      fillerWordsPerMin: Number,
      wpm: Number,
      blinkRate: Number,
      smilePercentage: Number,
      headSteadiness: Number,
      offScreenPercentage: Number,
      environmentQuality: Number,
      confidenceScore: Number,
    },
    questions: {
      type: [questionSubSchema],
      set(val) {
        if (
          Array.isArray(val) &&
          val.every((v) => v && typeof v === "object" && !Array.isArray(v))
        )
          return val;
        if (
          Array.isArray(val) &&
          val.length === 1 &&
          typeof val[0] === "string"
        ) {
          const parsed = parseSerializedQuestions(val[0]);
          return parsed || val;
        }
        if (typeof val === "string") {
          const parsed = parseSerializedQuestions(val);
          if (parsed) return parsed;
          try {
            if (/^\s*\[/.test(val.trim())) {
              const maybe = JSON.parse(val);
              if (Array.isArray(maybe)) return maybe;
            }
          } catch {}
        }
        return val;
      },
    },
    timing: {
      startedAt: Date,
      completedAt: Date,
      totalDuration: Number,
      averageQuestionTime: Number,
      remainingSeconds: Number, // Tracks time left in interview
      lastUpdated: Date, // Last time remaining was calculated
    },
    results: {
      overallScore: { type: Number, min: 0, max: 100 },
      completionRate: { type: Number, min: 0, max: 100 },
      breakdown: {
        technical: Number,
        communication: Number,
        problemSolving: Number,
        behavioral: Number,
      },
      performance: {
        type: String,
        enum: ["excellent", "good", "average", "needs-improvement"],
        default: "average",
      },
      rank: String,
      feedback: {
        summary: String,
        strengths: [String],
        improvements: [String],
        recommendations: [String],
      },
    },
    sessionEnrichment: {
      transcript: String,
      facialMetrics: [
        {
          timestamp: Date,
          eyeContact: Number,
          smilePercentage: Number,
          headSteadiness: Number,
          confidenceScore: Number,
          blinkRate: Number,
          offScreenPercentage: Number,
        },
      ],
      emotionTimeline: [
        {
          timestamp: Number,
          emotion: String,
          emotions: {
            angry: Number,
            disgust: Number,
            fear: Number,
            happy: Number,
            sad: Number,
            surprise: Number,
            neutral: Number,
          },
          confidence: Number,
        },
      ],
      enrichedAt: Date,
    },
    videoSession: {
      isRecording: { type: Boolean, default: false },
      startedAt: Date,
      endedAt: Date,
      totalDuration: Number,
      recordings: [
        {
          questionIndex: Number,
          filename: String,
          originalName: String,
          path: String,
          size: Number,
          duration: Number,
          uploadedAt: Date,
          mimeType: String,
        },
      ],
      settings: {
        videoQuality: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        audioEnabled: { type: Boolean, default: true },
      },
    },
    codingSession: {
      sessionId: String,
      startedAt: Date,
      completedAt: Date,
      status: {
        type: String,
        enum: ["active", "completed", "abandoned"],
        default: "active",
      },
      config: {
        challengeCount: Number,
        difficulty: String,
        language: String,
        timePerChallenge: Number,
        categories: [String],
      },
      results: {
        finalScore: Number,
        challengesCompleted: Number,
        totalChallenges: Number,
        totalTime: Number,
        averageScore: Number,
        submissions: [
          {
            challengeId: String,
            code: String,
            language: String,
            score: Number,
            testResults: [
              { testIndex: Number, passed: Boolean, executionTime: Number },
            ],
            submittedAt: Date,
          },
        ],
        performance: String,
      },
    },
    metadata: {
      browserInfo: String,
      deviceType: String,
      sessionQuality: String,
      notes: String,
    },
  },
  { timestamps: true }
);

// ---------------- Hooks ----------------
interviewSchema.pre("insertMany", function (next, docs) {
  try {
    if (Array.isArray(docs)) {
      docs.forEach((d) => {
        if (!d) return;
        if (
          Array.isArray(d.questions) &&
          d.questions.length === 1 &&
          typeof d.questions[0] === "string"
        ) {
          const parsed = parseSerializedQuestions(d.questions[0]);
          if (parsed) d.questions = parsed;
        } else if (typeof d.questions === "string") {
          const parsed = parseSerializedQuestions(d.questions);
          if (parsed) d.questions = parsed;
        }
      });
    }
  } catch {}
  next();
});

interviewSchema.pre("validate", function (next) {
  try {
    if (Array.isArray(this.questions)) {
      if (
        this.questions.length === 1 &&
        typeof this.questions[0] === "string"
      ) {
        const parsed = parseSerializedQuestions(this.questions[0]);
        if (parsed) this.questions = parsed;
      }
      this.questions = this.questions.map((q) => {
        if (!q) return q;
        const obj = q.toObject ? q.toObject() : { ...q };
        if (obj.category && typeof obj.category === "string") {
          obj.category = obj.category
            .trim()
            .replace(/[_\s]+/g, "-")
            .toLowerCase();
        }
        if (!obj.questionId) obj.questionId = new mongoose.Types.ObjectId();
        if (!obj.questionText && obj.text) obj.questionText = obj.text;
        return obj;
      });
    }
  } catch {}
  next();
});

// ---------------- Indexes ----------------
// CHANGED: All userId indexes → user indexes
interviewSchema.index({ user: 1, createdAt: -1, status: 1 });
interviewSchema.index({ user: 1, "questions.category": 1 });
interviewSchema.index({ user: 1, "questions.tags": 1 });
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ "config.jobRole": 1 });
interviewSchema.index({ "results.overallScore": -1 });
interviewSchema.index({ userProfile: 1 });

// ---------------- Methods ----------------
interviewSchema.methods.calculateOverallScore = function () {
  if (!this.questions || this.questions.length === 0) return 0;
  const valid = this.questions
    .filter((q) => q.score && q.score.overall != null)
    .map((q) => q.score.overall);
  if (!valid.length) return 0;
  const total = valid.reduce((s, v) => s + v, 0);
  this.results.overallScore = Math.round(total / valid.length);
  return this.results.overallScore;
};

interviewSchema.methods.calculateCompletionRate = function () {
  if (!this.questions || this.questions.length === 0) return 0;
  const answered = this.questions.filter(
    (q) => q.response && q.response.text && !q.skipped
  ).length;
  this.results.completionRate = Math.round(
    (answered / this.questions.length) * 100
  );
  return this.results.completionRate;
};

interviewSchema.methods.getPerformanceLevel = function () {
  const score = this.results.overallScore || 0;
  const EXCELLENT_THRESHOLD = 85;
  const GOOD_THRESHOLD = 70;
  const AVERAGE_THRESHOLD = 50;
  if (score >= EXCELLENT_THRESHOLD) return "excellent";
  if (score >= GOOD_THRESHOLD) return "good";
  if (score >= AVERAGE_THRESHOLD) return "average";
  return "needs-improvement";
};

module.exports = mongoose.model("Interview", interviewSchema);
