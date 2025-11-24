/**
 * Emotion Analysis Routes
 */
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const emotionService = require("../services/emotionService");

/**
 * POST /api/emotion/analyze
 * Analyze emotion from a single frame
 */
router.post("/analyze", requireAuth, async (req, res) => {
  try {
    const { frame, timestamp, interviewId, questionIndex } = req.body;

    if (!frame) {
      return res.status(400).json({
        success: false,
        message: "Frame data is required",
      });
    }

    const result = await emotionService.analyzeFrame(frame, timestamp);

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      console.error("[EmotionRoutes] Analysis failed:", result.error);
      res.status(500).json({
        success: false,
        message: "Emotion analysis failed",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[EmotionRoutes] Analysis error:", error.message);
    const isConnectionError =
      error.code === "ECONNREFUSED" || error.message.includes("ECONNREFUSED");
    res.status(500).json({
      success: false,
      message: isConnectionError
        ? "Emotion service unavailable. Please ensure the Python emotion service is running on port 5001."
        : "Server error during emotion analysis",
      error: error.message,
    });
  }
});

/**
 * POST /api/emotion/batch-analyze
 * Analyze emotions from multiple frames
 */
router.post("/batch-analyze", requireAuth, async (req, res) => {
  try {
    const { frames } = req.body;

    if (!frames || !Array.isArray(frames)) {
      return res.status(400).json({
        success: false,
        message: "Frames array is required",
      });
    }

    const result = await emotionService.analyzeFramesBatch(frames);

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Batch analysis failed",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[EmotionRoutes] Batch analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during batch analysis",
      error: error.message,
    });
  }
});

/**
 * GET /api/emotion/health
 * Check emotion service health
 */
router.get("/health", async (req, res) => {
  try {
    const isHealthy = await emotionService.healthCheck();

    res.json({
      success: true,
      healthy: isHealthy,
      service: "emotion-analysis",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      healthy: false,
      error: error.message,
    });
  }
});

module.exports = router;
