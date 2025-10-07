/* eslint-disable no-magic-numbers */
const { v4: uuidv4 } = require("uuid");

// Simple in-memory store keyed by userId
const store = {
  interviews: new Map(), // userId -> [interviews]
};

const ensureUser = (userId) => {
  if (!store.interviews.has(userId)) store.interviews.set(userId, []);
  return store.interviews.get(userId);
};

const now = () => new Date();

const defaultQuestion = (index, config) => ({
  _id: uuidv4(),
  questionId: uuidv4(),
  questionText: `Q${index + 1}: Tell me about ${
    config.jobRole || "your role"
  }.`,
  category:
    config.interviewType === "behavioral" ? "communication" : "web-development",
  difficulty: config.difficulty || "intermediate",
  timeAllocated: 300,
  hasVideo: false,
});

const buildInterview = (userId, config) => {
  const count = Math.max(1, Math.min(20, config.questionCount || 5));
  const questions = Array.from({ length: count }, (_, i) =>
    defaultQuestion(i, config)
  );
  return {
    _id: uuidv4(),
    id: undefined, // for parity
    userId,
    config: {
      ...config,
      adaptiveDifficulty: config.adaptiveDifficulty || { enabled: false },
      questionCount: count,
    },
    questions,
    status: "scheduled",
    timing: {},
    createdAt: now(),
    updatedAt: now(),
    results: {},
  };
};

const createInterview = async (req, res) => {
  const { userId } = req.auth || {};
  const config = req.body?.config || req.body || {};
  if (!userId)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!config.jobRole || !config.experienceLevel || !config.interviewType) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Missing required interview configuration",
      });
  }
  const interview = buildInterview(userId, config);
  const list = ensureUser(userId);
  list.push(interview);
  return res
    .status(201)
    .json({
      success: true,
      message: "Interview created successfully",
      data: interview,
    });
};

const startInterview = async (req, res) => {
  const { userId } = req.auth || {};
  const interviewId = req.params.interviewId || req.params.id;
  const list = ensureUser(userId);
  const interview = list.find((i) => i._id === interviewId);
  if (!interview)
    return res
      .status(404)
      .json({ success: false, message: "Interview not found" });
  if (interview.status !== "scheduled") {
    return res
      .status(400)
      .json({ success: false, message: "Interview cannot be started" });
  }
  interview.status = "in-progress";
  interview.timing.startedAt = now();
  interview.updatedAt = now();
  return res.json({
    success: true,
    message: "Interview started successfully",
    data: interview,
  });
};

const getUserInterviews = async (req, res) => {
  const { userId } = req.auth || {};
  const list = ensureUser(userId);
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const start = (page - 1) * limit;
  const items = list.slice().reverse();
  const interviews = items.slice(start, start + limit);
  return res.json({
    success: true,
    data: {
      interviews,
      pagination: {
        current: page,
        pages: Math.ceil(items.length / limit),
        total: items.length,
      },
    },
  });
};

const getInterviewDetails = async (req, res) => {
  const { userId } = req.auth || {};
  const interviewId = req.params.interviewId || req.params.id;
  const list = ensureUser(userId);
  const interview = list.find((i) => i._id === interviewId);
  if (!interview)
    return res
      .status(404)
      .json({ success: false, message: "Interview not found" });
  const interviewObj = { ...interview };
  const clientQuestions = (interviewObj.questions || []).map((q) => ({
    ...q,
    text: q.questionText,
    type: q.category?.includes("behavior") ? "behavioral" : "technical",
  }));
  const responsePayload = {
    ...interviewObj,
    jobRole: interviewObj.config?.jobRole,
    duration: interviewObj.config?.duration,
    questions: clientQuestions,
  };
  return res.json({ success: true, data: responsePayload });
};

const submitAnswer = async (req, res) => {
  const { userId } = req.auth || {};
  const interviewId = req.params.interviewId || req.params.id;
  const { questionIndex } = req.params;
  const { answer, timeSpent, notes, skip } = req.body || {};
  const list = ensureUser(userId);
  const interview = list.find((i) => i._id === interviewId);
  if (!interview)
    return res
      .status(404)
      .json({ success: false, message: "Interview not found" });
  if (interview.status !== "in-progress") {
    return res
      .status(400)
      .json({ success: false, message: "Interview is not in progress" });
  }
  const qIndex = parseInt(questionIndex, 10);
  if (
    Number.isNaN(qIndex) ||
    qIndex < 0 ||
    qIndex >= interview.questions.length
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid question index" });
  }
  const question = interview.questions[qIndex];
  if (skip === true) {
    question.skipped = true;
    question.skippedAt = now();
    question.timeSpent = timeSpent || 0;
    interview.updatedAt = now();
    return res.json({
      success: true,
      message: "Question skipped",
      data: { questionIndex: qIndex, skipped: true },
    });
  }
  question.response = { text: answer, notes: notes || "", submittedAt: now() };
  question.timeSpent = timeSpent || 0;
  // simple scoring
  const wordCount = (answer || "").trim().split(/\s+/).filter(Boolean).length;
  const overall = Math.max(20, Math.min(95, Math.round(wordCount * 3)));
  question.score = { overall, rubricScores: {}, breakdown: {} };
  question.feedback = {
    strengths: ["Clear structure", "Relevant points"],
    improvements: ["Add more examples"],
    suggestions: "Try to be concise and include specifics.",
    modelAnswer: "A strong answer would include context, action, and results.",
  };
  interview.updatedAt = now();
  return res.json({
    success: true,
    message: "Answer submitted successfully",
    data: { questionIndex: qIndex, score: overall },
  });
};

const generateFollowUp = async (req, res) => {
  const { userId } = req.auth || {};
  const interviewId = req.params.interviewId || req.params.id;
  const { questionIndex } = req.params;
  const list = ensureUser(userId);
  const interview = list.find((i) => i._id === interviewId);
  if (!interview)
    return res
      .status(404)
      .json({ success: false, message: "Interview not found" });
  const qIndex = parseInt(questionIndex, 10);
  const question = interview.questions[qIndex];
  if (!question)
    return res
      .status(400)
      .json({ success: false, message: "Invalid question index" });
  if (question.followUpQuestions && question.followUpQuestions.length) {
    return res.json({
      success: true,
      message: "Follow-up questions retrieved",
      data: { followUpQuestions: question.followUpQuestions },
    });
  }
  question.followUpQuestions = [
    { text: "Can you provide a concrete example?", type: "clarification" },
    { text: "What trade-offs did you consider?", type: "depth" },
  ];
  return res.json({
    success: true,
    message: "Follow-up questions generated",
    data: { followUpQuestions: question.followUpQuestions },
  });
};

const getAdaptiveQuestion = async (req, res) => {
  const { userId } = req.auth || {};
  const interviewId = req.params.interviewId || req.params.id;
  const list = ensureUser(userId);
  const interview = list.find((i) => i._id === interviewId);
  if (!interview)
    return res
      .status(404)
      .json({ success: false, message: "Interview not found" });
  const nextQ = defaultQuestion(interview.questions.length, interview.config);
  interview.questions.push(nextQ);
  interview.updatedAt = now();
  return res.json({
    success: true,
    message: "Adaptive question generated successfully",
    data: { question: { id: nextQ._id, text: nextQ.questionText } },
  });
};

const completeInterview = async (req, res) => {
  const { userId } = req.auth || {};
  const interviewId = req.params.interviewId || req.params.id;
  const list = ensureUser(userId);
  const interview = list.find((i) => i._id === interviewId);
  if (!interview)
    return res
      .status(404)
      .json({ success: false, message: "Interview not found" });
  if (interview.status !== "in-progress") {
    return res
      .status(400)
      .json({ success: false, message: "Interview is not in progress" });
  }
  interview.status = "completed";
  interview.timing.completedAt = now();
  interview.timing.totalDuration = Math.round(
    (interview.timing.completedAt - interview.timing.startedAt) / 60000
  );
  // naive score
  const answered = interview.questions.filter((q) => q.response?.text).length;
  const overallScore = Math.min(100, Math.max(50, answered * 15));
  interview.results = { overallScore, breakdown: {}, feedback: {} };
  interview.updatedAt = now();
  return res.json({
    success: true,
    message: "Interview completed successfully",
    data: interview,
  });
};

const markFollowUpsReviewed = async (req, res) => {
  const { userId } = req.auth || {};
  const interviewId = req.params.interviewId || req.params.id;
  const { questionIndex } = req.params;
  const list = ensureUser(userId);
  const interview = list.find((i) => i._id === interviewId);
  if (!interview)
    return res
      .status(404)
      .json({ success: false, message: "Interview not found" });
  const qIndex = parseInt(questionIndex, 10);
  const q = interview.questions[qIndex];
  if (!q)
    return res
      .status(400)
      .json({ success: false, message: "Invalid question index" });
  q.followUpsReviewed = true;
  q.followUpsReviewedAt = now();
  interview.updatedAt = now();
  return res.json({
    success: true,
    data: { questionIndex: qIndex, followUpsReviewed: true },
  });
};

module.exports = {
  createInterview,
  getUserInterviews,
  getInterviewDetails,
  startInterview,
  submitAnswer,
  generateFollowUp,
  getAdaptiveQuestion,
  completeInterview,
  markFollowUpsReviewed,
  getInterviewResults,
};

async function getInterviewResults(req, res) {
  const { userId } = req.auth || {};
  const { interviewId } = req.params;
  const list = ensureUser(userId);
  const interview = list.find((i) => i._id === interviewId);
  if (!interview)
    return res
      .status(404)
      .json({ success: false, message: "Interview not found" });
  if (!interview.results || !interview.results.overallScore) {
    // compute naive result if missing
    const answered = interview.questions.filter((q) => q.response?.text).length;
    interview.results = {
      overallScore: Math.min(100, Math.max(50, answered * 15)),
      breakdown: {},
      feedback: {},
    };
  }
  const payload = {
    interview: {
      jobRole: interview?.config?.jobRole || "",
      interviewType: interview?.config?.interviewType || "",
      duration: (interview?.timing?.totalDuration || 0) * 60,
      questions: interview?.questions || [],
      completedAt: interview?.timing?.completedAt || interview?.updatedAt,
      config: interview?.config || {},
    },
    analysis: {
      overallScore: interview?.results?.overallScore || 0,
      technicalScore: 0,
      communicationScore: 0,
      problemSolvingScore: 0,
      questionAnalysis: (interview?.questions || []).map((q) => ({
        question: q.questionText || "",
        type: q.category?.includes("behavior") ? "behavioral" : "technical",
        difficulty: q.difficulty || interview?.config?.difficulty || "",
        userAnswer: q.response?.text || "",
        userNotes: q.response?.notes || "",
        followUpsReviewed: !!q.followUpsReviewed,
        timeSpent: q.timeSpent || 0,
        score: q.score
          ? {
              overall: q.score.overall ?? 0,
              rubricScores: q.score.rubricScores || {},
            }
          : 0,
        feedback: {
          strengths: q.feedback?.strengths || [],
          improvements: q.feedback?.improvements || [],
          modelAnswer: q.feedback?.modelAnswer || "",
        },
        followUpQuestions: (q.followUpQuestions || []).map((f) => f.text || f),
      })),
      recommendations: [
        "Practice articulating your thought process more clearly",
        "Incorporate concrete examples from past projects",
        "Balance depth with breadth when answering technical questions",
      ],
      focusAreas: [
        {
          skill: "communication",
          priority: "high",
          currentLevel: "developing",
        },
        {
          skill: "problem-solving",
          priority: "medium",
          currentLevel: "intermediate",
        },
      ],
    },
  };
  return res.json({ success: true, data: payload });
}
