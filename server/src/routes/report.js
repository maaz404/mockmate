const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const comprehensiveReportingService = require("../services/comprehensiveReportingService");
const advancedFeedbackService = require("../services/advancedFeedbackService");
const Interview = require("../models/Interview");
const UserProfile = require("../models/UserProfile");

// @desc    Generate detailed interview report
// @route   POST /api/reports/generate/:interviewId
// @access  Private
router.post("/generate/:interviewId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId } = req.params;
    const { reportType } = req.body;

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

    if (interview.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview must be completed to generate report",
      });
    }

    let report;

    switch (reportType) {
      case "comprehensive":
      case "detailed":
        report = await comprehensiveReportingService.generateDetailedReport(
          interviewId,
          userId
        );
        break;

      case "summary":
        report = await comprehensiveReportingService.generateExecutiveSummary(
          interview
        );
        break;

      case "feedback":
        report = await advancedFeedbackService.generateInterviewReport(
          interview
        );
        break;

      default:
        report = await comprehensiveReportingService.generateDetailedReport(
          interviewId,
          userId
        );
    }

    if (!report.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate report",
        error: report.error,
      });
    }

    res.json({
      success: true,
      message: "Report generated successfully",
      data: {
        reportId: report.report?.reportId || `report_${Date.now()}`,
        reportType: reportType || "comprehensive",
        generatedAt: new Date(),
        report: report.report || report,
      },
    });
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
    });
  }
});

// @desc    Get user reports history
// @route   GET /api/reports
// @access  Private
router.get("/", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { page = 1, limit = 10, reportType } = req.query;

    // Get completed interviews for the user
    let query = {
      userId,
      status: "completed",
    };

    const interviews = await Interview.find(query)
      .sort({ completedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select("_id config results timing createdAt completedAt");

    const reports = interviews.map((interview) => ({
      interviewId: interview._id,
      reportId: `report_${interview._id}`,
      jobRole: interview.config.jobRole,
      interviewType: interview.config.interviewType,
      overallScore: interview.results.overallScore,
      performance: interview.results.performance,
      completedAt: interview.completedAt,
      duration: interview.timing.totalDuration,
      availableReports: ["comprehensive", "summary", "feedback"],
    }));

    const total = await Interview.countDocuments(query);

    res.json({
      success: true,
      message: "Reports retrieved successfully",
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReports: total,
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve reports",
    });
  }
});

// @desc    Get specific report by interview ID
// @route   GET /api/reports/:interviewId
// @access  Private
router.get("/:interviewId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId } = req.params;
    const { type = "comprehensive" } = req.query;

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

    if (interview.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview must be completed to view report",
      });
    }

    // Generate report based on type
    const report = await comprehensiveReportingService.generateDetailedReport(
      interviewId,
      userId
    );

    if (!report.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate report",
        error: report.error,
      });
    }

    res.json({
      success: true,
      message: "Report retrieved successfully",
      data: report.report,
    });
  } catch (error) {
    console.error("Get specific report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve report",
    });
  }
});

// @desc    Get progress analytics across multiple interviews
// @route   GET /api/reports/analytics/progress
// @access  Private
router.get("/analytics/progress", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { timeRange = "6months" } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "1month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6months":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    const interviews = await Interview.find({
      userId,
      status: "completed",
      completedAt: { $gte: startDate, $lte: endDate },
    }).sort({ completedAt: 1 });

    if (interviews.length === 0) {
      return res.json({
        success: true,
        message: "No completed interviews found in the specified time range",
        data: {
          timeRange,
          totalInterviews: 0,
          analytics: null,
        },
      });
    }

    // Generate progress analytics
    const analytics = {
      overallProgress: {
        totalInterviews: interviews.length,
        averageScore:
          interviews.reduce(
            (sum, i) => sum + (i.results.overallScore || 0),
            0
          ) / interviews.length,
        latestScore: interviews[interviews.length - 1].results.overallScore,
        improvementTrend: this.calculateImprovementTrend(interviews),
        scoreProgression: interviews.map((i) => ({
          date: i.completedAt,
          score: i.results.overallScore,
          jobRole: i.config.jobRole,
        })),
      },

      skillAnalytics: this.analyzeSkillProgression(interviews),
      performanceMetrics: this.calculatePerformanceMetrics(interviews),
      recommendations: this.generateProgressRecommendations(interviews),
    };

    res.json({
      success: true,
      message: "Progress analytics retrieved successfully",
      data: {
        timeRange,
        generatedAt: new Date(),
        analytics,
      },
    });
  } catch (error) {
    console.error("Get progress analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve progress analytics",
    });
  }
});

// @desc    Export report in different formats
// @route   GET /api/reports/:interviewId/export
// @access  Private
router.get("/:interviewId/export", requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId } = req.params;
    const { format = "json" } = req.query;

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

    const report = await comprehensiveReportingService.generateDetailedReport(
      interviewId,
      userId
    );

    if (!report.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate report for export",
      });
    }

    // Handle different export formats
    switch (format.toLowerCase()) {
      case "json":
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="interview-report-${interviewId}.json"`
        );
        res.json(report.report);
        break;

      case "txt":
        const textReport = this.convertReportToText(report.report);
        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="interview-report-${interviewId}.txt"`
        );
        res.send(textReport);
        break;

      default:
        res.status(400).json({
          success: false,
          message: "Unsupported export format. Supported formats: json, txt",
        });
    }
  } catch (error) {
    console.error("Export report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export report",
    });
  }
});

// Helper methods
function calculateImprovementTrend(interviews) {
  if (interviews.length < 2) return "insufficient-data";

  const firstScore = interviews[0].results.overallScore;
  const lastScore = interviews[interviews.length - 1].results.overallScore;
  const improvement = lastScore - firstScore;

  if (improvement > 10) return "strong-improvement";
  if (improvement > 5) return "moderate-improvement";
  if (improvement > -5) return "stable";
  return "declining";
}

function analyzeSkillProgression(interviews) {
  // Analyze progression in different skill areas
  return {
    technical: calculateSkillTrend(interviews, "technical"),
    communication: calculateSkillTrend(interviews, "communication"),
    behavioral: calculateSkillTrend(interviews, "behavioral"),
    problemSolving: calculateSkillTrend(interviews, "problemSolving"),
  };
}

function calculateSkillTrend(interviews, skillType) {
  // This would analyze specific skill metrics over time
  return {
    trend: "improving", // or 'stable', 'declining'
    currentLevel: "intermediate",
    improvementRate: 2.5, // points per interview
  };
}

function calculatePerformanceMetrics(interviews) {
  return {
    consistency: calculateConsistency(interviews),
    bestPerformance: Math.max(...interviews.map((i) => i.results.overallScore)),
    averageImprovement: calculateAverageImprovement(interviews),
    strongestCategory: determineStrongestCategory(interviews),
  };
}

function generateProgressRecommendations(interviews) {
  return [
    "Continue practicing technical problem-solving",
    "Focus on improving communication clarity",
    "Prepare more behavioral examples",
    "Consider mock interviews for complex scenarios",
  ];
}

function convertReportToText(report) {
  // Convert JSON report to readable text format
  return `INTERVIEW PERFORMANCE REPORT
Generated: ${report.generatedAt}

EXECUTIVE SUMMARY
Overall Score: ${
    report.executiveSummary?.overallAssessment?.overallScore || "N/A"
  }
Performance Level: ${
    report.executiveSummary?.overallAssessment?.performanceLevel || "N/A"
  }
Readiness: ${
    report.executiveSummary?.overallAssessment?.readinessForRole || "N/A"
  }

PERFORMANCE ANALYSIS
Questions Answered: ${
    report.performanceAnalysis?.completionMetrics?.questionsAnswered || "N/A"
  }
Completion Rate: ${
    report.performanceAnalysis?.completionMetrics?.completionRate || "N/A"
  }%
Average Score: ${
    report.performanceAnalysis?.scoreMetrics?.overallScore || "N/A"
  }

RECOMMENDATIONS
${
  report.recommendations?.immediate?.actions?.join("\n") ||
  "No specific recommendations available"
}

For detailed analysis, please view the full JSON report.`;
}

// Import new services
const sessionSummaryService = require("../services/sessionSummaryService");
const pdfGenerationService = require("../services/pdfGenerationService");
const { requireProPlan, checkProPlan } = require("../middleware/proPlan");

// @desc    Get session summary
// @route   GET /api/reports/:interviewId/session-summary
// @access  Private
router.get("/:interviewId/session-summary", requireAuth, async (req, res) => {
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

    const summary = await sessionSummaryService.generateSessionSummary(
      interviewId,
      userId
    );

    if (!summary.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate session summary",
        error: summary.error,
      });
    }

    // Check if user has pro plan for enhanced features
    const hasProPlan = await checkProPlan(userId);

    res.json({
      success: true,
      message: "Session summary generated successfully",
      data: {
        summary: summary.summary,
        hasProAccess: hasProPlan,
        availableExports: hasProPlan ? ["json", "pdf"] : ["json"],
      },
    });
  } catch (error) {
    console.error("Get session summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve session summary",
    });
  }
});

// @desc    Export session summary as PDF
// @route   GET /api/reports/:interviewId/export-pdf
// @access  Private (Pro plan required)
router.get("/:interviewId/export-pdf", requireAuth, requireProPlan, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { interviewId } = req.params;

    // Get interview and user profile
    const [interview, userProfile] = await Promise.all([
      Interview.findOne({ _id: interviewId, userId }),
      UserProfile.findOne({ clerkUserId: userId })
    ]);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    // Generate session summary
    const summaryResult = await sessionSummaryService.generateSessionSummary(
      interviewId,
      userId
    );

    if (!summaryResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate session summary for PDF export",
        error: summaryResult.error,
      });
    }

    // Generate PDF
    const pdfBuffer = await pdfGenerationService.generateSessionSummaryPDF(
      summaryResult.summary,
      userProfile
    );

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="interview-summary-${interviewId}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Export PDF error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export PDF",
      error: error.message,
    });
  }
});

module.exports = router;
