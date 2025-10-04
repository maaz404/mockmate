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

// Basic ok/fail helpers (local copy to avoid import cycles)
function ok(res, data = {}, meta = {}) {
  return res
    .status(200)
    .json({ success: true, data, requestId: res.locals.requestId, ...meta });
}
function fail(res, code, message, status = 400, extra = {}) {
  return res
    .status(status)
    .json({
      success: false,
      code,
      message,
      requestId: res.locals.requestId,
      ...extra,
    });
}

// Wrap to normalize existing controllers that may directly res.json today
function wrap(handler, { transform } = {}) {
  return async (req, res, next) => {
    try {
      const result = await handler(req, res, next);
      if (res.headersSent) return; // controller already responded
      const payload = transform ? transform(result, req, res) : result;
      ok(res, payload || {});
    } catch (err) {
      if (res.headersSent) return;
      const code = err.code || "INTERVIEW_LIFECYCLE_ERROR";
      fail(
        res,
        code,
        err.message || "Interview lifecycle operation failed",
        err.status || 500
      );
    }
  };
}

// @desc    Create interview session
// @route   POST /api/interviews
// @access  Private
router.post("/", requireAuth, ensureUserProfile, dbReady, (req, res) => {
  if (req.useInMemory) return wrap(inMem.createInterview)(req, res);
  return wrap(createInterview)(req, res);
});

// @desc    Get user interviews
// @route   GET /api/interviews
// @access  Private
router.get("/", requireAuth, ensureUserProfile, dbReady, (req, res) => {
  return req.useInMemory
    ? wrap(inMem.getUserInterviews)(req, res)
    : wrap(getUserInterviews)(req, res);
});

// @desc    Get specific interview
// @route   GET /api/interviews/:id
// @access  Private
router.get("/:id", requireAuth, ensureUserProfile, dbReady, (req, res) => {
  return req.useInMemory
    ? wrap(inMem.getInterviewDetails)(req, res)
    : wrap(getInterviewDetails)(req, res);
});

// @desc    Generate questions for interview
// @route   POST /api/interviews/:id/questions
// @access  Private
router.post(
  "/:id/questions",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) =>
    req.useInMemory
      ? wrap(inMem.startInterview)(req, res)
      : wrap(startInterview)(req, res)
); // This will generate questions

// @desc    Start interview session
// @route   PUT /api/interviews/:id/start
// @access  Private
router.put("/:id/start", requireAuth, ensureUserProfile, dbReady, (req, res) =>
  req.useInMemory
    ? wrap(inMem.startInterview)(req, res)
    : wrap(startInterview)(req, res)
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
    req.useInMemory
      ? wrap(inMem.submitAnswer)(req, res)
      : wrap(submitAnswer)(req, res)
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
      ? wrap(inMem.generateFollowUp)(req, res)
      : wrap(generateFollowUp)(req, res)
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
      ? wrap(inMem.getAdaptiveQuestion)(req, res)
      : wrap(getAdaptiveQuestion)(req, res)
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
      ? wrap(inMem.completeInterview)(req, res)
      : wrap(completeInterview)(req, res)
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
      ? wrap(inMem.getInterviewResults)(req, res)
      : wrap(getInterviewResults)(req, res);
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
      ? wrap(inMem.markFollowUpsReviewed)(req, res)
      : wrap(markFollowUpsReviewed)(req, res);
  }
);

const C = require("../utils/constants");

// @desc    Delete interview (with Cloudinary cleanup)
// @route   DELETE /api/interviews/:id
// @access  Private
router.delete("/:id", requireAuth, ensureUserProfile, dbReady, (req, res) => {
  if (req.useInMemory) {
    return fail(
      res,
      "NOT_IMPLEMENTED_IN_MEMORY",
      "Not supported in memory mode",
      C.HTTP_STATUS_NOT_IMPLEMENTED
    );
  }
  return wrap(deleteInterview)(req, res);
});

module.exports = router;
