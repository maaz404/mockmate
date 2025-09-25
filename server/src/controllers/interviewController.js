const Interview = require("../models/Interview");
const Question = require("../models/Question");
const UserProfile = require("../models/UserProfile");
const aiQuestionService = require("../services/aiQuestionService");
const hybridQuestionService = require("../services/hybridQuestionService");
const { updateAnalytics } = require("./userController");

// Create new interview session
const createInterview = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { config } = req.body;

    // Validate configuration
    if (!config.jobRole || !config.experienceLevel || !config.interviewType) {
      return res.status(400).json({
        success: false,
        message: "Missing required interview configuration",
      });
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Check interview limits for free users
    if (
      userProfile.subscription.plan === "free" &&
      userProfile.subscription.interviewsRemaining <= 0
    ) {
      return res.status(403).json({
        success: false,
        message: "Interview limit reached. Please upgrade to continue.",
      });
    }

    // Get suitable questions
    const questions = await getQuestionsForInterview(config, userProfile);

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No suitable questions found for this configuration",
      });
    }

    // Create interview
    const interview = new Interview({
      userId,
      userProfile: userProfile._id,
      config: {
        ...config,
        questionCount: Math.min(config.questionCount || 10, questions.length),
        // Initialize adaptive difficulty if enabled
        adaptiveDifficulty: config.adaptiveDifficulty?.enabled
          ? {
              enabled: true,
              initialDifficulty: config.difficulty,
              currentDifficulty: config.difficulty,
              difficultyHistory: [],
            }
          : {
              enabled: false,
            },
      },
      questions: questions.slice(0, config.questionCount || 10).map((q) => ({
        questionId: q._id,
        questionText: q.text,
        category: q.category,
        difficulty: q.difficulty,
        timeAllocated: q.estimatedTime,
        hasVideo: false, // Default to false, can be enabled based on question type
      })),
      status: "scheduled",
    });

    await interview.save();

    res.status(201).json({
      success: true,
      message: "Interview created successfully",
      data: interview,
    });
  } catch (error) {
    console.error("Create interview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create interview",
    });
  }
};

// Start interview session
const startInterview = async (req, res) => {
  try {
    const { userId } = req.auth;
  const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Interview cannot be started",
      });
    }

    // Update interview status and timing
    interview.status = "in-progress";
    interview.timing.startedAt = new Date();

    await interview.save();

    // Update user's interview count (decrement remaining if free user)
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });
    if (userProfile.subscription.plan === "free") {
      userProfile.subscription.interviewsRemaining = Math.max(
        0,
        userProfile.subscription.interviewsRemaining - 1
      );
      await userProfile.save();
    }

    res.json({
      success: true,
      message: "Interview started successfully",
      data: interview,
    });
  } catch (error) {
    console.error("Start interview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start interview",
    });
  }
};

// Submit answer to question
const submitAnswer = async (req, res) => {
  try {
    const { userId } = req.auth;
  const interviewId = req.params.interviewId || req.params.id;
  const { questionIndex } = req.params;
    const { answer, timeSpent } = req.body;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Interview is not in progress",
      });
    }

    const qIndex = parseInt(questionIndex);
    if (qIndex >= interview.questions.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid question index",
      });
    }

    // Update question response
    interview.questions[qIndex].response = {
      text: answer,
      submittedAt: new Date(),
    };
    interview.questions[qIndex].timeSpent = timeSpent || 0;

    // AI-powered scoring with enhanced feedback
    let evaluation;
    try {
      console.log("Evaluating answer with AI for question:", qIndex);

      // Create question object with necessary fields for AI evaluation
      const questionObj = {
        text: interview.questions[qIndex].questionText,
        category: interview.questions[qIndex].category,
        type: interview.questions[qIndex].type || "general",
        difficulty: interview.questions[qIndex].difficulty,
      };

      evaluation = await aiQuestionService.evaluateAnswer(
        questionObj,
        answer,
        interview.config
      );
      console.log("AI evaluation completed:", evaluation);
    } catch (error) {
      console.error("AI evaluation failed, using basic scoring:", error);
      const questionObj = {
        text: interview.questions[qIndex].questionText,
        category: interview.questions[qIndex].category,
        type: interview.questions[qIndex].type || "general",
        difficulty: interview.questions[qIndex].difficulty,
      };
      evaluation = aiQuestionService.getBasicEvaluation(questionObj, answer);
    }

    // Update question with enhanced scoring and feedback
    interview.questions[qIndex].score = {
      overall: evaluation.score,
      rubricScores: evaluation.rubricScores || {},
      breakdown: evaluation.breakdown || {},
    };

    interview.questions[qIndex].feedback = {
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      suggestions: evaluation.feedback || "",
      modelAnswer: evaluation.modelAnswer || "",
    };

    // Track score for adaptive difficulty if enabled
    if (interview.config.adaptiveDifficulty?.enabled) {
      const currentDifficulty =
        interview.questions[qIndex].difficulty || interview.config.difficulty;

      // Add to difficulty history for tracking
      if (!interview.config.adaptiveDifficulty.difficultyHistory) {
        interview.config.adaptiveDifficulty.difficultyHistory = [];
      }

      // Update or add current question's score tracking
      const existingEntryIndex =
        interview.config.adaptiveDifficulty.difficultyHistory.findIndex(
          (entry) => entry.questionIndex === qIndex
        );

      const historyEntry = {
        questionIndex: qIndex,
        difficulty: currentDifficulty,
        score: evaluation.score || 0,
        timestamp: new Date(),
      };

      if (existingEntryIndex >= 0) {
        interview.config.adaptiveDifficulty.difficultyHistory[
          existingEntryIndex
        ] = historyEntry;
      } else {
        interview.config.adaptiveDifficulty.difficultyHistory.push(
          historyEntry
        );
      }
    }

    await interview.save();

    // Generate follow-up questions automatically after scoring
    let followUpQuestions = null;
    try {
      console.log("Generating follow-up questions for question:", qIndex);
      followUpQuestions = await aiQuestionService.generateFollowUp(
        interview.questions[qIndex].questionText,
        answer,
        interview.config
      );

      if (followUpQuestions && followUpQuestions.length > 0) {
        interview.questions[qIndex].followUpQuestions = followUpQuestions;
        await interview.save();
        console.log(
          "Follow-up questions generated and saved:",
          followUpQuestions.length
        );
      }
    } catch (error) {
      console.error("Follow-up generation failed:", error);
      // Continue without follow-ups - non-critical feature
    }

    // Prepare response data
    const responseData = {
      questionIndex: qIndex,
      score: interview.questions[qIndex].score?.overall || evaluation.score,
      followUpQuestions: followUpQuestions,
    };

    // Add adaptive difficulty info if enabled
    if (interview.config.adaptiveDifficulty?.enabled) {
      const nextDifficulty = getNextDifficultyLevel(
        responseData.score,
        interview.questions[qIndex].difficulty || interview.config.difficulty
      );
      responseData.adaptiveInfo = {
        currentDifficulty:
          interview.questions[qIndex].difficulty || interview.config.difficulty,
        suggestedNextDifficulty: nextDifficulty,
        difficultyWillChange:
          nextDifficulty !==
          (interview.questions[qIndex].difficulty ||
            interview.config.difficulty),
        scoreBasedRecommendation:
          responseData.score < 60
            ? "easier"
            : responseData.score >= 80
            ? "harder"
            : "same",
      };
    }

    res.json({
      success: true,
      message: "Answer submitted successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Submit answer error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit answer",
    });
  }
};

// Generate follow-up question based on answer
const generateFollowUp = async (req, res) => {
  try {
    const { userId } = req.auth;
  const interviewId = req.params.interviewId || req.params.id;
  const { questionIndex } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    const qIndex = parseInt(questionIndex);
    if (qIndex >= interview.questions.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid question index",
      });
    }

    const question = interview.questions[qIndex];
    if (!question.response || !question.response.text) {
      return res.status(400).json({
        success: false,
        message: "No answer provided for this question",
      });
    }

    // Check if follow-up questions already exist
    if (question.followUpQuestions && question.followUpQuestions.length > 0) {
      return res.json({
        success: true,
        message: "Follow-up questions retrieved",
        data: {
          followUpQuestions: question.followUpQuestions,
          originalQuestion: question.questionText,
          originalAnswer: question.response.text,
        },
      });
    }

    try {
      console.log("Generating AI follow-up questions for question:", qIndex);
      const followUpQuestions = await aiQuestionService.generateFollowUp(
        question.questionText,
        question.response.text,
        interview.config
      );

      // Save the generated follow-ups to the interview
      if (followUpQuestions && followUpQuestions.length > 0) {
        interview.questions[qIndex].followUpQuestions = followUpQuestions;
        await interview.save();
      }

      res.json({
        success: true,
        message: "Follow-up questions generated",
        data: {
          followUpQuestions: followUpQuestions || [],
          originalQuestion: question.questionText,
          originalAnswer: question.response.text,
        },
      });
    } catch (error) {
      console.error("AI follow-up generation failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate follow-up questions",
        fallback: [
          {
            text: "Can you elaborate more on your approach and explain any alternative solutions?",
            type: "clarification",
          },
        ],
      });
    }
  } catch (error) {
    console.error("Generate follow-up error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate follow-up question",
    });
  }
};

// Complete interview
const completeInterview = async (req, res) => {
  try {
    const { userId } = req.auth;
  const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    }).populate("userProfile");

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Interview is not in progress",
      });
    }

    // Update timing
    interview.timing.completedAt = new Date();
    interview.timing.totalDuration = Math.round(
      (interview.timing.completedAt - interview.timing.startedAt) / (1000 * 60)
    );

    // Calculate overall results
    interview.calculateOverallScore();
    interview.results.performance = interview.getPerformanceLevel();
    interview.status = "completed";

    await interview.save();

    // Update user analytics
    const userProfile = interview.userProfile;
    const newTotalInterviews = userProfile.analytics.totalInterviews + 1;
    const newAverageScore = Math.round(
      (userProfile.analytics.averageScore *
        userProfile.analytics.totalInterviews +
        interview.results.overallScore) /
        newTotalInterviews
    );

    await updateAnalytics(userId, {
      totalInterviews: newTotalInterviews,
      averageScore: newAverageScore,
      lastInterviewDate: new Date(),
    });

    res.json({
      success: true,
      message: "Interview completed successfully",
      data: interview,
    });
  } catch (error) {
    console.error("Complete interview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete interview",
    });
  }
};

// Get user's interviews
const getUserInterviews = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { page = 1, limit = 10, status, type } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (type) query["config.interviewType"] = type;

    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-questions.questionText -questions.response.text"); // Exclude large text fields

    const totalCount = await Interview.countDocuments(query);

    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          current: page,
          pages: Math.ceil(totalCount / limit),
          total: totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Get interviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
    });
  }
};

// Get interview details
const getInterviewDetails = async (req, res) => {
  try {
    const { userId } = req.auth;
  const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    res.json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error("Get interview details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interview details",
    });
  }
};

// Helper function to get suitable questions using hybrid approach
const getQuestionsForInterview = async (config, userProfile) => {
  try {
    console.log("Generating hybrid questions for config:", config);

    // Use hybrid service to generate questions (70% templates, 30% AI)
    const hybridQuestions = await hybridQuestionService.generateHybridQuestions(
      config
    );

    if (hybridQuestions && hybridQuestions.length > 0) {
      console.log(`Generated ${hybridQuestions.length} hybrid questions`);

      // Save questions to database and return the saved documents
      const savedQuestions = [];
      for (const question of hybridQuestions) {
        const questionDoc = new Question({
          text: question.text,
          category: question.category,
          difficulty: question.difficulty,
          type: question.type,
          tags: question.tags || [],
          experienceLevel: [config.experienceLevel],
          estimatedTime: Math.max(
            question.estimatedTime || question.timeEstimate * 60 || 180,
            30
          ), // Convert minutes to seconds, minimum 30 seconds
          source: question.source || "hybrid",
          generatedAt: question.generatedAt || new Date(),
          isHybridGenerated: true,
          keywords: question.keywords || [],
          stats: { timesUsed: 0, avgScore: 0 },
          status: "active",
        });
        const savedQuestion = await questionDoc.save();
        savedQuestions.push(savedQuestion);
      }
      return savedQuestions;
    }
  } catch (error) {
    console.error(
      "Hybrid question generation failed, falling back to AI service:",
      error
    );
  }

  // Fallback to AI service if hybrid fails
  try {
    const aiQuestions = await aiQuestionService.generateQuestions({
      ...config,
      userProfile,
      skills:
        userProfile?.professionalInfo?.skills?.map((s) =>
          typeof s === "object" ? s.name : s
        ) || [],
    });

    if (aiQuestions && aiQuestions.length > 0) {
      console.log(`Generated ${aiQuestions.length} AI fallback questions`);

      // Save AI questions to database
      const savedQuestions = [];
      for (const question of aiQuestions) {
        const questionDoc = new Question({
          text: question.question || question.text,
          category: question.category || config.interviewType,
          difficulty: question.difficulty || config.difficulty,
          type: config.interviewType,
          experienceLevel: [config.experienceLevel],
          estimatedTime: Math.max(question.timeLimit * 60 || 180, 30), // Convert minutes to seconds, minimum 30 seconds
          isAIGenerated: true,
          keywords: question.followUpHints || [],
          stats: { timesUsed: 0, avgScore: 0 },
          status: "active",
        });
        const savedQuestion = await questionDoc.save();
        savedQuestions.push(savedQuestion);
      }
      return savedQuestions;
    }
  } catch (aiError) {
    console.error(
      "AI question generation also failed, falling back to database:",
      aiError
    );
  }

  // Final fallback to database questions
  const query = {
    status: "active",
    difficulty: config.difficulty,
    experienceLevel: { $in: [config.experienceLevel] },
  };

  // Filter by interview type
  if (config.interviewType !== "mixed") {
    query.type = config.interviewType;
  }

  // Get questions with randomization
  const questions = await Question.aggregate([
    { $match: query },
    { $sample: { size: Math.max(config.questionCount * 2, 20) } }, // Get more than needed for variety
    { $sort: { "stats.timesUsed": 1 } }, // Prefer less used questions
  ]);

  return questions;
};

// Enhanced fallback scoring function
const calculateBasicScore = (answer, question) => {
  const score = {
    overall: 0,
    breakdown: {
      relevance: 0,
      clarity: 0,
      completeness: 0,
      technical: 0,
    },
    feedback: "",
  };

  if (!answer || answer.trim().length === 0) {
    score.feedback =
      "No answer provided. Consider providing a response even if you're unsure.";
    return score;
  }

  const answerLength = answer.trim().split(" ").length;
  const answerText = answer.toLowerCase();

  // Enhanced completeness scoring
  if (answerLength < 10) {
    score.breakdown.completeness = 20;
  } else if (answerLength < 30) {
    score.breakdown.completeness = 50;
  } else if (answerLength < 100) {
    score.breakdown.completeness = 80;
  } else {
    score.breakdown.completeness = 95;
  }

  // Enhanced clarity scoring based on structure
  const hasPunctuation = /[.!?]/.test(answer);
  const hasStructure = answerLength > 20 && hasPunctuation;
  score.breakdown.clarity = hasStructure ? 75 : answerLength > 10 ? 60 : 40;

  // Basic keyword relevance check
  const questionText = question.questionText || question.text || "";
  const questionKeywords =
    questionText.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const matchedKeywords = questionKeywords.filter((keyword) =>
    answerText.includes(keyword)
  );
  score.breakdown.relevance = Math.min(90, 40 + matchedKeywords.length * 10);

  // Technical depth based on category and content
  const technicalTerms = [
    "function",
    "variable",
    "object",
    "array",
    "api",
    "database",
    "component",
    "state",
    "props",
    "async",
    "await",
    "promise",
  ];
  const hasTechnicalTerms = technicalTerms.some((term) =>
    answerText.includes(term)
  );

  if (question.category && question.category.includes("technical")) {
    score.breakdown.technical = hasTechnicalTerms ? 70 : 45;
  } else {
    score.breakdown.technical = 80; // Non-technical questions get higher base score
  }

  // Calculate overall score with weighted average
  score.overall = Math.round(
    score.breakdown.completeness * 0.3 +
      score.breakdown.clarity * 0.25 +
      score.breakdown.relevance * 0.25 +
      score.breakdown.technical * 0.2
  );

  // Generate basic feedback
  if (score.overall >= 80) {
    score.feedback =
      "Excellent response! Your answer demonstrates good understanding and clarity.";
  } else if (score.overall >= 60) {
    score.feedback =
      "Good response. Consider adding more detail or examples to strengthen your answer.";
  } else if (score.overall >= 40) {
    score.feedback =
      "Your answer touches on relevant points but could benefit from more depth and clarity.";
  } else {
    score.feedback =
      "Consider providing a more comprehensive answer with specific examples and clearer structure.";
  }

  return score;
};

// Helper function to determine next difficulty level based on score
const getNextDifficultyLevel = (currentScore, currentDifficulty) => {
  // Convert 100-point scale to 5-point scale: < 60 = < 3/5, >= 80 = >= 4/5
  const normalizedScore = currentScore / 20; // Convert to 5-point scale

  const difficulties = ["beginner", "intermediate", "advanced"];
  const currentIndex = difficulties.indexOf(currentDifficulty);

  if (normalizedScore < 3.0) {
    // Score < 3/5: make it easier (move down one level if possible)
    return currentIndex > 0
      ? difficulties[currentIndex - 1]
      : currentDifficulty;
  } else if (normalizedScore >= 4.0) {
    // Score >= 4/5: make it harder (move up one level if possible)
    return currentIndex < difficulties.length - 1
      ? difficulties[currentIndex + 1]
      : currentDifficulty;
  } else {
    // Score 3-4/5: keep same difficulty
    return currentDifficulty;
  }
};

// Get adaptive question for interview
const getAdaptiveQuestion = async (req, res) => {
  try {
    const { userId } = req.auth;
  const interviewId = req.params.interviewId || req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Interview is not in progress",
      });
    }

    // Check if adaptive difficulty is enabled
    if (!interview.config.adaptiveDifficulty?.enabled) {
      return res.status(400).json({
        success: false,
        message: "Adaptive difficulty is not enabled for this interview",
      });
    }

    // Check if there are more questions needed
    const answeredQuestions = interview.questions.filter(
      (q) => q.response?.text
    ).length;
    if (answeredQuestions >= interview.config.questionCount) {
      return res.status(400).json({
        success: false,
        message: "Interview has reached the maximum number of questions",
      });
    }

    // Get current difficulty level
    let currentDifficulty =
      interview.config.adaptiveDifficulty.currentDifficulty ||
      interview.config.difficulty;

    // If we have previous answers, check if we need to adjust difficulty
    if (answeredQuestions > 0) {
      const lastQuestion = interview.questions[answeredQuestions - 1];
      if (lastQuestion.score?.overall !== undefined) {
        const nextDifficulty = getNextDifficultyLevel(
          lastQuestion.score.overall,
          currentDifficulty
        );

        // Update current difficulty if it changed
        if (nextDifficulty !== currentDifficulty) {
          currentDifficulty = nextDifficulty;
          interview.config.adaptiveDifficulty.currentDifficulty =
            currentDifficulty;

          // Track difficulty change
          interview.config.adaptiveDifficulty.difficultyHistory.push({
            questionIndex: answeredQuestions,
            difficulty: currentDifficulty,
            score: lastQuestion.score.overall,
            timestamp: new Date(),
          });
        }
      }
    }

    // Get a question with the current difficulty level
    const adaptiveConfig = {
      ...interview.config,
      difficulty: currentDifficulty,
      questionCount: 1, // We only need one question
    };

    const questions = await getQuestionsForInterview(adaptiveConfig, null);

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No suitable questions found for difficulty level: ${currentDifficulty}`,
      });
    }

    // Select the best question (avoid duplicates if possible)
    const existingQuestionIds = interview.questions.map(
      (q) => q.questionId?.toString() || q._id
    );
    const availableQuestions = questions.filter(
      (q) => !existingQuestionIds.includes(q._id?.toString() || q.id)
    );

    const selectedQuestion =
      availableQuestions.length > 0 ? availableQuestions[0] : questions[0];

    // Add the new question to the interview
    const newQuestion = {
      questionId: selectedQuestion._id,
      questionText: selectedQuestion.text,
      category: selectedQuestion.category,
      difficulty: currentDifficulty,
      timeAllocated: selectedQuestion.estimatedTime || 300, // Default 5 minutes
    };

    interview.questions.push(newQuestion);
    await interview.save();

    res.json({
      success: true,
      message: "Adaptive question generated successfully",
      data: {
        question: {
          id: newQuestion.questionId,
          text: newQuestion.questionText,
          category: newQuestion.category,
          difficulty: newQuestion.difficulty,
          timeAllocated: newQuestion.timeAllocated,
          index: interview.questions.length - 1,
        },
        adaptiveInfo: {
          currentDifficulty,
          previousDifficulty:
            answeredQuestions > 0
              ? interview.config.adaptiveDifficulty.difficultyHistory[
                  interview.config.adaptiveDifficulty.difficultyHistory.length -
                    2
                ]?.difficulty || interview.config.difficulty
              : interview.config.difficulty,
          difficultyChanged:
            answeredQuestions > 0 &&
            interview.config.adaptiveDifficulty.difficultyHistory.length > 0 &&
            interview.config.adaptiveDifficulty.difficultyHistory[
              interview.config.adaptiveDifficulty.difficultyHistory.length - 1
            ]?.questionIndex === answeredQuestions,
        },
      },
    });
  } catch (error) {
    console.error("Get adaptive question error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate adaptive question",
    });
  }
};

module.exports = {
  createInterview,
  startInterview,
  submitAnswer,
  generateFollowUp,
  completeInterview,
  getUserInterviews,
  getInterviewDetails,
  getAdaptiveQuestion,
};

// Compose interview results payload for frontend consumption
const composeResultsPayload = (interviewDoc) => {
  const interview = {
    jobRole: interviewDoc?.config?.jobRole || "",
    interviewType: interviewDoc?.config?.interviewType || "",
    duration: (interviewDoc?.timing?.totalDuration || 0) * 60, // seconds
    questions: interviewDoc?.questions || [],
    completedAt: interviewDoc?.timing?.completedAt || interviewDoc?.updatedAt,
  };

  const breakdown = interviewDoc?.results?.breakdown || {};
  const analysis = {
    overallScore: interviewDoc?.results?.overallScore || 0,
    technicalScore: breakdown.technical ?? 0,
    communicationScore: breakdown.communication ?? 0,
    problemSolvingScore: breakdown.problemSolving ?? 0,
    questionAnalysis: (interviewDoc?.questions || []).map((q) => ({
      question: q.questionText || "",
      type: q.category?.includes("behavior") ? "behavioral" : "technical",
      difficulty: q.difficulty || interviewDoc?.config?.difficulty || "",
      userAnswer: q.response?.text || "",
      timeSpent: q.timeSpent || 0,
      score: q.score
        ? { overall: q.score.overall ?? 0, rubricScores: q.score.rubricScores || {} }
        : 0,
      feedback: {
        strengths: q.feedback?.strengths || [],
        improvements: q.feedback?.improvements || [],
        modelAnswer: q.feedback?.modelAnswer || "",
      },
    })),
    recommendations:
      interviewDoc?.results?.feedback?.recommendations &&
      interviewDoc.results.feedback.recommendations.length > 0
        ? interviewDoc.results.feedback.recommendations
        : [
            "Practice articulating your thought process more clearly",
            "Incorporate concrete examples from past projects",
            "Balance depth with breadth when answering technical questions",
          ],
    focusAreas: [
      { skill: "communication", priority: "high", currentLevel: "developing" },
      { skill: "problem-solving", priority: "medium", currentLevel: "intermediate" },
    ],
  };

  return { interview, analysis };
};

// Get interview results formatted for the results page
const getInterviewResults = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId } = req.params;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    // Ensure results are computed if missing
    if (!interview.results?.overallScore) {
      interview.calculateOverallScore();
      await interview.save();
    }

    const payload = composeResultsPayload(interview);
    return res.json({ success: true, data: payload });
  } catch (error) {
    console.error("Get interview results error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch interview results" });
  }
};

module.exports.getInterviewResults = getInterviewResults;
