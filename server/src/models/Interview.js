const mongoose = require("mongoose");

// Interview Session Schema
const interviewSchema = new mongoose.Schema(
  {
    // User Information
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },

    // Interview Configuration
    config: {
      jobRole: {
        type: String,
        required: true,
      },
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
      duration: {
        type: Number, // in minutes
        required: true,
        min: 15,
        max: 120,
      },
      questionCount: {
        type: Number,
        default: 10,
        min: 5,
        max: 50,
      },
      // Adaptive difficulty settings
      adaptiveDifficulty: {
        enabled: {
          type: Boolean,
          default: false,
        },
        initialDifficulty: String, // Store original difficulty
        currentDifficulty: String, // Track current adaptive difficulty
        difficultyHistory: [
          {
            questionIndex: Number,
            difficulty: String,
            score: Number,
            timestamp: Date,
          },
        ],
      },
    },

    // Interview Status
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "abandoned"],
      default: "scheduled",
    },

    // Questions and Responses
    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        questionText: String, // cached for performance
        category: String,
        difficulty: String,
        timeAllocated: Number, // seconds
        timeSpent: Number, // seconds
        response: {
          text: String,
          // User's own notes captured alongside the answer
          notes: String,
          audioUrl: String, // for future voice responses
          submittedAt: Date,
        },
        // Whether the user reviewed AI follow-up questions for this prompt
        followUpsReviewed: {
          type: Boolean,
          default: false,
        },
        followUpsReviewedAt: Date,
        video: {
          filename: String,
          path: String,
          duration: Number, // in seconds
          uploadedAt: Date,
          size: Number, // file size in bytes
          transcript: {
            text: String,
            generatedAt: Date,
            status: {
              type: String,
              enum: ["pending", "completed", "failed"],
              default: "pending",
            },
          },
          // Facial Expression Analysis Results
          facialAnalysis: {
            enabled: {
              type: Boolean,
              default: false,
            },
            metrics: {
              eyeContact: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
              },
              blinkRate: {
                type: Number,
                min: 0,
                default: 0,
              },
              headSteadiness: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
              },
              smilePercentage: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
              },
              offScreenPercentage: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
              },
              confidenceScore: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
              },
              environmentQuality: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
              },
            },
            baseline: {
              completed: {
                type: Boolean,
                default: false,
              },
              timestamp: Date,
              duration: Number, // calibration duration in seconds
            },
            sessionSummary: {
              duration: Number, // analysis duration in seconds
              totalFrames: Number,
              faceDetectedFrames: Number,
              detectionRate: Number,
              recommendations: [
                {
                  type: String,
                  message: String,
                  priority: {
                    type: String,
                    enum: ["low", "medium", "high"],
                    default: "medium",
                  },
                },
              ],
            },
            analysisTimestamp: Date,
          },
        },
        score: {
          overall: {
            type: Number,
            min: 0,
            max: 100,
          },
          // 1-5 scale rubric scores as per requirements
          rubricScores: {
            relevance: {
              type: Number,
              min: 1,
              max: 5,
            },
            clarity: {
              type: Number,
              min: 1,
              max: 5,
            },
            depth: {
              type: Number,
              min: 1,
              max: 5,
            },
            structure: {
              type: Number,
              min: 1,
              max: 5,
            },
          },
          breakdown: {
            relevance: Number,
            clarity: Number,
            completeness: Number,
            technical: Number, // for technical questions
          },
        },
        feedback: {
          strengths: [String],
          improvements: [String],
          suggestions: String,
          // AI-generated model answer as per requirements
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
            generatedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],

    // Session Timing
    timing: {
      startedAt: Date,
      completedAt: Date,
      totalDuration: Number, // actual time spent in minutes
      averageQuestionTime: Number, // seconds per question
    },

    // Overall Results
    results: {
      overallScore: {
        type: Number,
        min: 0,
        max: 100,
      },
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
      rank: String, // percentile rank
      feedback: {
        summary: String,
        strengths: [String],
        improvements: [String],
        recommendations: [String],
      },
    },

    // Video Session Data
    videoSession: {
      isRecording: {
        type: Boolean,
        default: false,
      },
      startedAt: Date,
      endedAt: Date,
      totalDuration: Number, // in seconds
      recordings: [
        {
          questionIndex: Number,
          filename: String,
          originalName: String,
          path: String,
          size: Number,
          duration: Number, // in seconds
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
        audioEnabled: {
          type: Boolean,
          default: true,
        },
      },
    },

    // Coding Challenge Session Data
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
              {
                testIndex: Number,
                passed: Boolean,
                executionTime: Number,
              },
            ],
            submittedAt: Date,
          },
        ],
        performance: String,
      },
    },

    // Metadata
    metadata: {
      browserInfo: String,
      deviceType: String,
      sessionQuality: String, // stable, unstable
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ "config.jobRole": 1 });
interviewSchema.index({ "results.overallScore": -1 });

// Calculate overall score from individual question scores
interviewSchema.methods.calculateOverallScore = function () {
  if (!this.questions || this.questions.length === 0) return 0;

  const validScores = this.questions
    .filter((q) => q.score && q.score.overall !== null)
    .map((q) => q.score.overall);

  if (validScores.length === 0) return 0;

  const totalScore = validScores.reduce((sum, score) => sum + score, 0);
  this.results.overallScore = Math.round(totalScore / validScores.length);

  return this.results.overallScore;
};

// Determine performance level based on score
interviewSchema.methods.getPerformanceLevel = function () {
  const score = this.results.overallScore || 0;

  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "average";
  return "needs-improvement";
};

module.exports = mongoose.model("Interview", interviewSchema);
