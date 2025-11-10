const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const ensureUserProfile = require("../middleware/ensureUserProfile");
const FEATURES = require("../config/features");
const {
  createInterview,
  getUserInterviews,
  getInterviewDetails,
  startInterview,
  submitAnswer,
  generateFollowUp,
  completeInterview,
  // Advanced features - now enabled
  getAdaptiveQuestion,
  getInterviewResults,
  markFollowUpsReviewed,
  deleteInterview,
  getInterviewTranscripts,
  updateAdaptiveDifficulty,
  exportInterviewMetrics,
} = require("../controllers/interviewController");
const { getRemaining } = require("../utils/subscription");
const dbReady = require("../middleware/dbReady");
const inMem = FEATURES.IN_MEMORY_FALLBACK
  ? require("../services/inMemoryInterviewService")
  : null;

function ok(res, data = {}, meta = {}) {
  return res
    .status(200)
    .json({ success: true, data, requestId: res.locals.requestId, ...meta });
}
function fail(res, code, message, status = 400, extra = {}) {
  return res.status(status).json({
    success: false,
    code,
    message,
    requestId: res.locals.requestId,
    ...extra,
  });
}

function wrap(handler, { transform } = {}) {
  return async (req, res, next) => {
    try {
      const result = await handler(req, res, next);
      if (res.headersSent) return;
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
router.post("/", requireAuth, ensureUserProfile, dbReady, async (req, res) => {
  if (req.useInMemory) return wrap(inMem.createInterview)(req, res);
  try {
    const remaining = await getRemaining(req.user.id);
    if (remaining !== null && remaining <= 0) {
      return fail(
        res,
        "INTERVIEW_LIMIT",
        "Interview limit reached. Upgrade your plan to continue.",
        403
      );
    }
  } catch (_) {
    /* non-fatal */
  }
  return wrap(createInterview)(req, res);
});

// @desc    Get user interviews
// Add no-store to avoid client/proxy caching for this frequently-changing list
router.get("/", requireAuth, ensureUserProfile, dbReady, (req, res) => {
  res.set("Cache-Control", "no-store");
  return req.useInMemory
    ? wrap(inMem.getUserInterviews)(req, res)
    : wrap(getUserInterviews)(req, res);
});

// @desc    Get specific interview
router.get("/:id", requireAuth, ensureUserProfile, dbReady, (req, res) => {
  return req.useInMemory
    ? wrap(inMem.getInterviewDetails)(req, res)
    : wrap(getInterviewDetails)(req, res);
});

// @desc    Generate questions
router.post(
  "/:id/questions",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) =>
    req.useInMemory
      ? wrap(inMem.startInterview)(req, res)
      : wrap(startInterview)(req, res)
);

// @desc    Start interview session
router.put("/:id/start", requireAuth, ensureUserProfile, dbReady, (req, res) =>
  req.useInMemory
    ? wrap(inMem.startInterview)(req, res)
    : wrap(startInterview)(req, res)
);

// Alias
router.post("/:id/start", requireAuth, ensureUserProfile, dbReady, (req, res) =>
  req.useInMemory
    ? wrap(inMem.startInterview)(req, res)
    : wrap(startInterview)(req, res)
);

// @desc    Submit answer
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

// @desc    Generate follow-up
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

// ===== ADVANCED FEATURES - DISABLED FOR SIMPLIFICATION =====
// Advanced Features Routes (Now Enabled)

// @desc    Get next adaptive question (ADAPTIVE_DIFFICULTY feature)
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

// @desc    Update adaptive difficulty (ADAPTIVE_DIFFICULTY feature)
router.patch(
  "/:id/adaptive-difficulty",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) => {
    req.params.interviewId = req.params.id;
    return wrap(updateAdaptiveDifficulty)(req, res);
  }
);

// @desc    Export metrics CSV (CSV_EXPORT feature)
router.get(
  "/:id/metrics/export",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) => {
    req.params.interviewId = req.params.id;
    return exportInterviewMetrics(req, res);
  }
);

// @desc    Get transcripts (TRANSCRIPT_POLLING feature)
router.get(
  "/:id/transcripts",
  requireAuth,
  ensureUserProfile,
  dbReady,
  (req, res) => {
    req.params.interviewId = req.params.id;
    return wrap(getInterviewTranscripts)(req, res);
  }
);

// ===== END ADVANCED FEATURES =====
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

// @desc    Get interview results
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

// @desc    Mark follow-ups reviewed
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

// @desc    Delete interview
router.delete("/:id", requireAuth, ensureUserProfile, dbReady, (req, res) => {
  if (req.useInMemory && FEATURES.IN_MEMORY_FALLBACK) {
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
