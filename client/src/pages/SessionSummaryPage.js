import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  Target,
  TrendingUp,
  Download,
  ArrowLeft,
  Star,
  CheckCircle,
  AlertCircle,
  BarChart3,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiService } from "../services/api";

const SessionSummaryPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProAccess, setHasProAccess] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchSessionSummary = useCallback(async () => {
    try {
      setLoading(true);
      const envelope = await apiService.get(
        `/reports/${interviewId}/session-summary`
      );
      if (envelope.success) {
        setSummary(envelope.data.summary);
        setHasProAccess(envelope.data.hasProAccess);
      } else toast.error(envelope.message || "Failed to load session summary");
    } catch (err) {
      toast.error(err.message || "Failed to load session summary");
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    if (interviewId) {
      fetchSessionSummary();
    }
  }, [interviewId, fetchSessionSummary]);

  const handlePDFExport = async () => {
    if (!hasProAccess) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setExportingPDF(true);

      const response = await fetch(`/api/reports/${interviewId}/export-pdf`, {
        credentials: "include",
      });

      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `interview-summary-${interviewId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("PDF downloaded successfully!");
      } else if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === "UPGRADE_REQUIRED") {
          setShowUpgradeModal(true);
        } else {
          toast.error("PDF export requires Pro plan");
        }
      } else {
        toast.error("Failed to export PDF");
      }
    } catch (error) {
      // Remove console.error for production
      toast.error("Failed to export PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  const getPerformanceColor = (level) => {
    switch (level) {
      case "excellent":
        return "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-500/10";
      case "good":
        return "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/10";
      case "average":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-500/10";
      case "needs-improvement":
        return "text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-500/10";
      default:
        return "text-surface-600 bg-surface-100 dark:text-surface-300 dark:bg-surface-700/50";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
        ))}
        {hasHalfStar && (
          <Star className="h-5 w-5 text-yellow-400 fill-current opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} className="h-5 w-5 text-surface-300" />
        ))}
        <span className="ml-2 text-sm text-surface-600 dark:text-surface-400">
          ({rating}/5)
        </span>
      </div>
    );
  };

  const UpgradeModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-800 rounded-lg max-w-md w-full p-6 border border-surface-200 dark:border-surface-700">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-500/20 mb-4">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-2">
            Upgrade to Pro for PDF Export
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">
            Get detailed PDF reports and advanced analytics with our Pro plan.
          </p>

          <div className="space-y-2 text-left mb-6">
            <div className="flex items-center text-sm text-surface-700 dark:text-surface-300">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              PDF report exports
            </div>
            <div className="flex items-center text-sm text-surface-700 dark:text-surface-300">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Advanced analytics
            </div>
            <div className="flex items-center text-sm text-surface-700 dark:text-surface-300">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Detailed performance insights
            </div>
            <div className="flex items-center text-sm text-surface-700 dark:text-surface-300">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Progress tracking
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                // In a real app, this would redirect to payment/upgrade page
                toast.info("Upgrade functionality coming soon!");
                setShowUpgradeModal(false);
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-surface-600 dark:text-surface-400">
            Loading session summary...
          </p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Session Not Found
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-4">
            The requested interview session could not be found.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 shadow border-b border-surface-200 dark:border-surface-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-50 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  Session Summary
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  {summary.sessionInfo.jobRole} -{" "}
                  {summary.sessionInfo.interviewType}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePDFExport}
                disabled={exportingPDF}
                className={`btn-primary ${
                  exportingPDF ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportingPDF ? "Exporting..." : "Export PDF"}
                {!hasProAccess && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Pro
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Overall Score */}
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                  Overall Score
                </p>
                <p
                  className={`text-2xl font-bold ${getScoreColor(
                    summary.overallAssessment.overallScore
                  )}`}
                >
                  {summary.overallAssessment.overallScore}/100
                </p>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                  Completion
                </p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {summary.aggregateMetrics.completionRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Total Time */}
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                  Duration
                </p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {summary.sessionInfo.totalDuration}m
                </p>
              </div>
            </div>
          </div>

          {/* Session Rating */}
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                  Rating
                </p>
                <div className="flex items-center mt-1">
                  {renderStars(summary.overallAssessment.sessionRating)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Metrics */}
          <div className="bg-white dark:bg-surface-800 rounded-lg shadow p-6 border border-surface-200 dark:border-surface-700">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance Breakdown
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Questions Answered</span>
                  <span>
                    {summary.aggregateMetrics.answeredQuestions}/
                    {summary.aggregateMetrics.totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${summary.aggregateMetrics.completionRate}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-3">
                  Score Distribution
                </h4>
                <div className="space-y-2">
                  {Object.entries(
                    summary.aggregateMetrics.scoreDistribution
                  ).map(([level, count]) => {
                    const percentage =
                      summary.aggregateMetrics.answeredQuestions > 0
                        ? (count / summary.aggregateMetrics.answeredQuestions) *
                          100
                        : 0;

                    return (
                      <div
                        key={level}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="capitalize">
                          {level.replace("-", " ")}
                        </span>
                        <div className="flex items-center">
                          <div className="w-20 bg-surface-200 dark:bg-surface-700 rounded-full h-2 mr-3">
                            <div
                              className={`h-2 rounded-full ${
                                level === "excellent"
                                  ? "bg-green-500"
                                  : level === "good"
                                  ? "bg-blue-500"
                                  : level === "average"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-surface-600 dark:text-surface-400 w-8">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="bg-white dark:bg-surface-800 rounded-lg shadow p-6 border border-surface-200 dark:border-surface-700">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Category Performance
            </h3>
            <div className="space-y-3">
              {summary.categoryScores.slice(0, 6).map((category, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700"
                >
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50 capitalize">
                      {category.category}
                    </p>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {category.questionsCount} questions
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${getScoreColor(
                        category.averageScore
                      )}`}
                    >
                      {category.averageScore}/100
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getPerformanceColor(
                        category.performance
                      )}`}
                    >
                      {category.performance.replace("-", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Answers */}
          <div className="bg-white dark:bg-surface-800 rounded-lg shadow p-6 border border-surface-200 dark:border-surface-700">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              Best Performing Answers
            </h3>
            <div className="space-y-4">
              {summary.performanceHighlights.bestAnswers
                .slice(0, 3)
                .map((answer, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-surface-900 dark:text-surface-50 mb-1">
                      {answer.question}
                    </p>
                    <div className="flex items-center justify-between text-xs text-surface-600 dark:text-surface-400">
                      <span>Score: {answer.score}/100</span>
                      <span>Time: {answer.timeSpent}s</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {answer.category}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white dark:bg-surface-800 rounded-lg shadow p-6 border border-surface-200 dark:border-surface-700">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              Areas for Improvement
            </h3>
            <div className="space-y-4">
              {summary.performanceHighlights.worstAnswers
                .slice(0, 3)
                .map((answer, index) => (
                  <div key={index} className="border-l-4 border-red-500 pl-4">
                    <p className="text-sm text-surface-900 dark:text-surface-50 mb-1">
                      {answer.question}
                    </p>
                    <div className="flex items-center justify-between text-xs text-surface-600 dark:text-surface-400">
                      <span>Score: {answer.score}/100</span>
                      <span>Time: {answer.timeSpent}s</span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                        {answer.category}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {summary.performanceHighlights.improvementOpportunities.length >
              0 && (
              <div className="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                  Focus Areas
                </h4>
                <div className="space-y-2">
                  {summary.performanceHighlights.improvementOpportunities.map(
                    (opp, index) => (
                      <div key={index} className="flex items-start">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-3 mt-2 ${
                            opp.priority === "high"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        ></span>
                        <div>
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                            {opp.area}
                          </p>
                          <p className="text-xs text-surface-600 dark:text-surface-400">
                            {opp.suggestion}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
            Overall Assessment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                Readiness Level
              </h4>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(
                  summary.overallAssessment.readinessLevel
                )}`}
              >
                {summary.overallAssessment.readinessLevel.replace("-", " ")}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                Recommendation
              </h4>
              <p className="text-surface-700 dark:text-surface-300">
                {summary.overallAssessment.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Time Analysis */}
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Time Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                Average Response Time
              </h4>
              <p className="text-2xl font-bold text-blue-600">
                {summary.timeAnalysis.averageTime}s
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Time efficiency: {summary.timeAnalysis.timeEfficiency}
              </p>
            </div>
            {summary.timeAnalysis.fastestAnswer && (
              <div>
                <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                  Fastest Response
                </h4>
                <p className="text-lg font-bold text-green-600">
                  {summary.timeAnalysis.fastestAnswer.time}s
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Score: {summary.timeAnalysis.fastestAnswer.score}/100
                </p>
              </div>
            )}
            {summary.timeAnalysis.slowestAnswer && (
              <div>
                <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                  Slowest Response
                </h4>
                <p className="text-lg font-bold text-red-600">
                  {summary.timeAnalysis.slowestAnswer.time}s
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Score: {summary.timeAnalysis.slowestAnswer.score}/100
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showUpgradeModal && <UpgradeModal />}
    </div>
  );
};

export default SessionSummaryPage;
