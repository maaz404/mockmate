const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const {
  createInterview,
  getUserInterviews,
  getInterviewDetails,
  startInterview,
  submitAnswer,
  generateFollowUp,
  completeInterview,
  getAdaptiveQuestion,
  getInterviewResults,
} = require("../controllers/interviewController");

// @desc    Create interview session
// @route   POST /api/interviews
// @access  Private
router.post("/", requireAuth, createInterview);

// @desc    Get user interviews
// @route   GET /api/interviews
// @access  Private
router.get("/", requireAuth, getUserInterviews);

// @desc    Get specific interview
// @route   GET /api/interviews/:id
// @access  Private
router.get("/:id", requireAuth, getInterviewDetails);

// @desc    Generate questions for interview
// @route   POST /api/interviews/:id/questions
// @access  Private
router.post("/:id/questions", requireAuth, startInterview); // This will generate questions

// @desc    Start interview session
// @route   PUT /api/interviews/:id/start
// @access  Private
router.put("/:id/start", requireAuth, startInterview);

// @desc    Submit answer to question
// @route   POST /api/interviews/:id/answer/:questionIndex
// @access  Private
router.post("/:id/answer/:questionIndex", requireAuth, submitAnswer);

// @desc    Generate follow-up question
// @route   POST /api/interviews/:id/followup/:questionIndex
// @access  Private
router.post("/:id/followup/:questionIndex", requireAuth, generateFollowUp);

// @desc    Get next adaptive question
// @route   POST /api/interviews/:id/adaptive-question
// @access  Private
router.post("/:id/adaptive-question", requireAuth, getAdaptiveQuestion);

// @desc    Complete interview with final submission
// @route   POST /api/interviews/:id/complete
// @access  Private
router.post("/:id/complete", requireAuth, completeInterview);

// @desc    Get interview results (formatted)
// @route   GET /api/interviews/:id/results
// @access  Private
router.get("/:id/results", requireAuth, (req, res) => {
  req.params.interviewId = req.params.id;
  return getInterviewResults(req, res);
});

module.exports = router;
