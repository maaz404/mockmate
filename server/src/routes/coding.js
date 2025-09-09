const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const codingChallengeService = require("../services/codingChallengeService");
const Interview = require("../models/Interview");

// @desc    Create coding challenge session
// @route   POST /api/coding/session
// @access  Private
router.post("/session", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId, config } = req.body;

    // Validate interview exists and belongs to user
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

    // Default configuration
    const challengeConfig = {
      challengeCount: config.challengeCount || 3,
      difficulty: config.difficulty || "mixed",
      language: config.language || "javascript",
      timePerChallenge: config.timePerChallenge || 30,
      categories: config.categories || [],
    };

    const session = await codingChallengeService.createChallengeSession(
      interviewId,
      challengeConfig
    );

    if (!session.success) {
      return res.status(400).json(session);
    }

    // Update interview with coding session info
    interview.codingSession = {
      sessionId: session.sessionId,
      startedAt: new Date(),
      config: challengeConfig,
      status: "active",
    };
    await interview.save();

    res.json({
      success: true,
      message: "Coding challenge session created",
      data: {
        sessionId: session.sessionId,
        currentChallenge: session.currentChallenge,
        challengeOverview: session.challenges,
      },
    });
  } catch (error) {
    console.error("Create coding session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coding challenge session",
    });
  }
});

// @desc    Get current challenge
// @route   GET /api/coding/session/:sessionId/current
// @access  Private
router.get("/session/:sessionId/current", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const challenge = codingChallengeService.getCurrentChallenge(sessionId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found or session completed",
      });
    }

    res.json({
      success: true,
      message: "Current challenge retrieved",
      data: challenge,
    });
  } catch (error) {
    console.error("Get current challenge error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get current challenge",
    });
  }
});

// @desc    Submit code for evaluation
// @route   POST /api/coding/session/:sessionId/submit
// @access  Private
router.post("/session/:sessionId/submit", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { sessionId } = req.params;
    const { challengeId, code, language } = req.body;

    if (!code || !challengeId) {
      return res.status(400).json({
        success: false,
        message: "Code and challenge ID are required",
      });
    }

    // Verify session belongs to user (through interview)
    const session = codingChallengeService.getSessionStatus(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Coding session not found",
      });
    }

    const interview = await Interview.findOne({
      _id: session.interviewId || session.id,
      userId,
    });

    if (!interview) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const result = await codingChallengeService.submitCode(
      sessionId,
      challengeId,
      code,
      language
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: "Code submitted successfully",
      data: {
        submissionId: result.submissionId,
        score: result.score,
        testResults: result.testResults,
        feedback: result.feedback,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
      },
    });
  } catch (error) {
    console.error("Code submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit code",
    });
  }
});

// @desc    Get next challenge
// @route   POST /api/coding/session/:sessionId/next
// @access  Private
router.post("/session/:sessionId/next", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { sessionId } = req.params;

    // Verify session belongs to user
    const session = codingChallengeService.getSessionStatus(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Coding session not found",
      });
    }

    const interview = await Interview.findOne({
      _id: session.interviewId,
      userId,
    });

    if (!interview) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const nextChallenge = codingChallengeService.getNextChallenge(sessionId);

    if (!nextChallenge) {
      // Session completed
      const results = codingChallengeService.completeSession(sessionId);

      // Update interview
      if (interview.codingSession) {
        interview.codingSession.status = "completed";
        interview.codingSession.completedAt = new Date();
        interview.codingSession.results = results;
        await interview.save();
      }

      return res.json({
        success: true,
        message: "Coding challenge session completed",
        data: {
          completed: true,
          results,
        },
      });
    }

    res.json({
      success: true,
      message: "Next challenge loaded",
      data: {
        completed: false,
        challenge: nextChallenge,
      },
    });
  } catch (error) {
    console.error("Get next challenge error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get next challenge",
    });
  }
});

// @desc    Get session status and progress
// @route   GET /api/coding/session/:sessionId/status
// @access  Private
router.get("/session/:sessionId/status", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { sessionId } = req.params;

    const session = codingChallengeService.getSessionStatus(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Verify ownership through interview
    const interview = await Interview.findOne({
      _id: session.interviewId,
      userId,
    });

    if (!interview) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      message: "Session status retrieved",
      data: session,
    });
  } catch (error) {
    console.error("Get session status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get session status",
    });
  }
});

// @desc    End coding challenge session
// @route   POST /api/coding/session/:sessionId/complete
// @access  Private
router.post("/session/:sessionId/complete", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { sessionId } = req.params;

    const session = codingChallengeService.getSessionStatus(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const interview = await Interview.findOne({
      _id: session.interviewId,
      userId,
    });

    if (!interview) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const results = codingChallengeService.completeSession(sessionId);

    // Update interview
    if (interview.codingSession) {
      interview.codingSession.status = "completed";
      interview.codingSession.completedAt = new Date();
      interview.codingSession.results = results;
      await interview.save();
    }

    res.json({
      success: true,
      message: "Coding challenge session completed",
      data: results,
    });
  } catch (error) {
    console.error("Complete coding session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete coding session",
    });
  }
});

// @desc    Get available coding challenges
// @route   GET /api/coding/challenges
// @access  Private
router.get("/challenges", requireAuth, async (req, res) => {
  try {
    const { difficulty, category } = req.query;

    // Get available options
    const categories = codingChallengeService.getAvailableCategories();
    const languages = codingChallengeService.getSupportedLanguages();

    res.json({
      success: true,
      message: "Available coding challenges",
      data: {
        categories,
        languages,
        difficulties: ["easy", "medium", "hard"],
        totalChallenges: 5, // Based on our predefined challenges
        features: [
          "Real-time code execution",
          "Multiple test cases",
          "Instant feedback",
          "Performance analysis",
          "Code quality assessment",
        ],
      },
    });
  } catch (error) {
    console.error("Get challenges error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get available challenges",
    });
  }
});

// @desc    Get coding challenge results for an interview
// @route   GET /api/coding/interview/:interviewId/results
// @access  Private
router.get("/interview/:interviewId/results", requireAuth, async (req, res) => {
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

    if (!interview.codingSession || !interview.codingSession.results) {
      return res.status(404).json({
        success: false,
        message: "No coding challenge results found for this interview",
      });
    }

    res.json({
      success: true,
      message: "Coding challenge results retrieved",
      data: {
        sessionInfo: {
          sessionId: interview.codingSession.sessionId,
          startedAt: interview.codingSession.startedAt,
          completedAt: interview.codingSession.completedAt,
          config: interview.codingSession.config,
        },
        results: interview.codingSession.results,
        performance: {
          overallScore: interview.codingSession.results.finalScore,
          challengesCompleted:
            interview.codingSession.results.challengesCompleted,
          totalChallenges: interview.codingSession.results.totalChallenges,
          averageScore: interview.codingSession.results.averageScore,
          timeSpent: interview.codingSession.results.totalTime,
        },
      },
    });
  } catch (error) {
    console.error("Get coding results error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get coding challenge results",
    });
  }
});

// @desc    Test code without submitting (for practice)
// @route   POST /api/coding/test
// @access  Private
router.post("/test", requireAuth, async (req, res) => {
  try {
    const { code, language, challengeId } = req.body;

    if (!code || !challengeId) {
      return res.status(400).json({
        success: false,
        message: "Code and challenge ID are required",
      });
    }

    // Create a temporary session for testing
    const tempSessionId = `temp_${Date.now()}`;
    const result = await codingChallengeService.submitCode(
      tempSessionId,
      challengeId,
      code,
      language || "javascript"
    );

    // Clean up temporary session
    // (In a real implementation, you'd want proper cleanup)

    res.json({
      success: true,
      message: "Code tested successfully",
      data: {
        testResults: result.testResults,
        feedback: result.feedback,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        isTest: true, // Indicate this was just a test run
      },
    });
  } catch (error) {
    console.error("Code test error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test code",
    });
  }
});

module.exports = router;
