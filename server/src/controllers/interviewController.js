const Interview = require("../models/Interview");
const Question = require("../models/Question");
const UserProfile = require("../models/UserProfile");
const aiQuestionService = require("../services/aiQuestionService");
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
      },
      questions: questions.slice(0, config.questionCount || 10).map((q) => ({
        questionId: q._id,
        questionText: q.text,
        category: q.category,
        difficulty: q.difficulty,
        timeAllocated: q.estimatedTime,
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
    const { interviewId } = req.params;

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
    const { interviewId, questionIndex } = req.params;
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

    // AI-powered scoring
    let score;
    try {
      console.log("Evaluating answer with AI for question:", qIndex);
      score = await aiQuestionService.evaluateAnswer(
        interview.questions[qIndex].questionText,
        answer,
        interview.config
      );
      console.log("AI evaluation completed:", score);
    } catch (error) {
      console.error("AI evaluation failed, using basic scoring:", error);
      score = calculateBasicScore(answer, interview.questions[qIndex]);
    }

    interview.questions[qIndex].score = score;

    await interview.save();

    res.json({
      success: true,
      message: "Answer submitted successfully",
      data: {
        questionIndex: qIndex,
        score: score.overall,
      },
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
    const { interviewId, questionIndex } = req.params;

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

    try {
      console.log("Generating AI follow-up question for question:", qIndex);
      const followUp = await aiQuestionService.generateFollowUp(
        question.questionText,
        question.response.text,
        interview.config
      );

      res.json({
        success: true,
        message: "Follow-up question generated",
        data: {
          followUpQuestion: followUp,
          originalQuestion: question.questionText,
          originalAnswer: question.response.text,
        },
      });
    } catch (error) {
      console.error("AI follow-up generation failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate follow-up question",
        fallback:
          "Can you elaborate more on your approach and explain any alternative solutions?",
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
    const { interviewId } = req.params;

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
    const { interviewId } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    }).populate(
      "questions.questionId",
      "text category difficulty evaluationCriteria"
    );

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

// Helper function to get suitable questions using AI
const getQuestionsForInterview = async (config, userProfile) => {
  try {
    console.log("Generating AI-powered questions for config:", config);

    // Use AI service to generate questions
    const aiQuestions = await aiQuestionService.generateQuestions(
      config,
      userProfile
    );

    if (aiQuestions && aiQuestions.length > 0) {
      console.log(`Generated ${aiQuestions.length} AI questions`);

      // Transform AI questions to match our schema
      return aiQuestions.map((question, index) => ({
        _id: `ai_${Date.now()}_${index}`,
        text: question.question,
        category: question.category || config.interviewType,
        difficulty: question.difficulty || config.difficulty,
        type: config.interviewType,
        experienceLevel: [config.experienceLevel],
        estimatedTime: question.timeLimit || 3,
        isAIGenerated: true,
        keywords: question.followUpHints || [],
        stats: { timesUsed: 0, avgScore: 0 },
        status: "active",
      }));
    }
  } catch (error) {
    console.error(
      "AI question generation failed, falling back to database:",
      error
    );
  }

  // Fallback to database questions if AI fails
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

module.exports = {
  createInterview,
  startInterview,
  submitAnswer,
  generateFollowUp,
  completeInterview,
  getUserInterviews,
  getInterviewDetails,
};
