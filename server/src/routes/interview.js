const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const ensureUserProfile = require("../middleware/ensureUserProfile");
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
  markFollowUpsReviewed,
  deleteInterview,
} = require("../controllers/interviewController");
const dbReady = require("../middleware/dbReady");
const inMem = require("../services/inMemoryInterviewService");

// @desc    Create interview session
// @route   POST /api/interviews
// @access  Private
router.post("/", requireAuth, ensureUserProfile, dbReady, (req, res) =>
  req.useInMemory ? inMem.createInterview(req, res) : createInterview(req, res)
);

// @desc    Get user interviews
// @route   GET /api/interviews
// @access  Private
router.get("/", requireAuth, ensureUserProfile, dbReady, (req, res) =>
  req.useInMemory
    ? inMem.getUserInterviews(req, res)
    : getUserInterviews(req, res)
);

// @desc    Get specific interview
// @route   GET /api/interviews/:id
// @access  Private
router.get("/:id", requireAuth, ensureUserProfile, dbReady, (req, res) =>
  req.useInMemory
    ? inMem.getInterviewDetails(req, res)
    : getInterviewDetails(req, res)
);

// @desc    Generate questions for interview
// @route   POST /api/interviews/:id/questions
// @access  Private
router.post(
  "/:id/questions",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) =>
    req.useInMemory ? inMem.startInterview(req, res) : startInterview(req, res)
); // This will generate questions

// @desc    Start interview session
// @route   PUT /api/interviews/:id/start
// @access  Private
router.put("/:id/start", requireAuth, ensureUserProfile, dbReady, (req, res) =>
  req.useInMemory ? inMem.startInterview(req, res) : startInterview(req, res)
);

// @desc    Submit answer to question
// @route   POST /api/interviews/:id/answer/:questionIndex
// @access  Private
router.post(
  "/:id/answer/:questionIndex",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) =>
    req.useInMemory ? inMem.submitAnswer(req, res) : submitAnswer(req, res)
);

// @desc    Generate follow-up question
// @route   POST /api/interviews/:id/followup/:questionIndex
// @access  Private
router.post(
  "/:id/followup/:questionIndex",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) =>
    req.useInMemory
      ? inMem.generateFollowUp(req, res)
      : generateFollowUp(req, res)
);

// @desc    Get next adaptive question
// @route   POST /api/interviews/:id/adaptive-question
// @access  Private
router.post(
  "/:id/adaptive-question",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) =>
    req.useInMemory
      ? inMem.getAdaptiveQuestion(req, res)
      : getAdaptiveQuestion(req, res)
);

// @desc    Complete interview with final submission
// @route   POST /api/interviews/:id/complete
// @access  Private
router.post(
  "/:id/complete",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) =>
    req.useInMemory
      ? inMem.completeInterview(req, res)
      : completeInterview(req, res)
);

// @desc    Get interview results (formatted)
// @route   GET /api/interviews/:id/results
// @access  Private
router.get(
  "/:id/results",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) => {
    req.params.interviewId = req.params.id;
    return req.useInMemory
      ? inMem.getInterviewResults(req, res)
      : getInterviewResults(req, res);
  }
);

// @desc    Mark follow-ups reviewed for a question
// @route   POST /api/interviews/:id/followups-reviewed/:questionIndex
// @access  Private
router.post(
  "/:id/followups-reviewed/:questionIndex",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) => {
    req.params.interviewId = req.params.id;
    return req.useInMemory
      ? inMem.markFollowUpsReviewed(req, res)
      : markFollowUpsReviewed(req, res);
  }
);

const C = require("../utils/constants");

// @desc    Delete interview (with Cloudinary cleanup)
// @route   DELETE /api/interviews/:id
// @access  Private
router.delete("/:id", requireAuth, ensureUserProfile, dbReady, (req, res) =>
  req.useInMemory
    ? res
        .status(C.HTTP_STATUS_NOT_IMPLEMENTED)
        .json({ success: false, message: "Not supported in memory mode" })
    : deleteInterview(req, res)
);

module.exports = router;
