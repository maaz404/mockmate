import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import {
  Activity,
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  Play,
  BookOpen,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Crown,
  Star,
  TrendingDown,
  Minus,
  LineChart,
  AlertCircle,
  Info,
} from "lucide-react";
import SkillProgressPieChart from "../components/dashboard/SkillProgressPieChart";
import PerformanceEChart from "../components/dashboard/PerformanceEChart";

function DashboardPage() {
  const { user, isLoaded } = useAuthContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard data states
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  // Section-specific error states for error isolation
  const [sectionErrors, setSectionErrors] = useState({
    summary: null,
    recommendation: null,
    subscription: null,
  });

  // Last update timestamp
  const [lastUpdated, setLastUpdated] = useState(null);

  // Skill progress display mode: 'percentage' or 'count'
  const [skillMode, setSkillMode] = useState("percentage");

  // Fetch all dashboard data in parallel with error isolation
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      // Use Promise.allSettled for error isolation - one failure doesn't crash everything
      const results = await Promise.allSettled([
        apiService.get("/users/dashboard/summary"),
        apiService.get("/users/dashboard/metrics?timeRange=30"),
        apiService.get("/users/dashboard/recommendation"),
        apiService.get("/users/subscription"),
      ]);

      const newSectionErrors = {
        summary: null,
        recommendation: null,
        subscription: null,
      };

      // Handle summary data
      if (results[0].status === "fulfilled") {
        setDashboardData(results[0].value.data);
      } else {
        newSectionErrors.summary =
          results[0].reason?.response?.data?.message ||
          "Failed to load dashboard stats";
      }

      // Handle recommendation data
      if (results[2].status === "fulfilled") {
        setRecommendation(results[2].value.data);
      } else {
        newSectionErrors.recommendation =
          results[2].reason?.response?.data?.message ||
          "Failed to load recommendations";
      }

      // Handle subscription data
      if (results[3].status === "fulfilled") {
        setSubscriptionInfo(results[3].value.data);
      } else {
        newSectionErrors.subscription =
          results[3].reason?.response?.data?.message ||
          "Failed to load subscription info";
      }

      setSectionErrors(newSectionErrors);
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Dashboard fetch error:", err);
      setError(
        "We're having trouble connecting. Please check your internet and try again."
      );
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user, fetchDashboardData]);

  // Real-time auto-refresh every 2 minutes (reduced from 30s for better performance)
  useEffect(() => {
    if (!loading && dashboardData) {
      const interval = setInterval(() => {
        fetchDashboardData(true);
      }, 120000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [loading, dashboardData, fetchDashboardData]);

  // Helper function to format last updated time
  const getTimeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Manual refresh handler
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
            <div className="h-4 w-64 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-28 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-surface-200 dark:bg-surface-700 rounded-xl animate-pulse"></div>
                <div className="h-6 w-16 bg-surface-200 dark:bg-surface-700 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart and quick actions skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
            <div className="h-6 w-48 bg-surface-200 dark:bg-surface-700 rounded animate-pulse mb-6"></div>
            <div className="h-64 bg-surface-100 dark:bg-surface-700/50 rounded-xl animate-pulse"></div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
            <div className="h-6 w-32 bg-surface-200 dark:bg-surface-700 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-surface-100 dark:bg-surface-700/50 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state - only show if critical failure (all sections failed)
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
            We're having trouble connecting
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchDashboardData()}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/interview/create")}
              className="px-6 py-3 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Start Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    stats = {},
    recentInterviews = [],
    upcomingSession = null,
    skillProgress = [],
    performanceTrend = [],
  } = dashboardData || {};

  // Filter out invalid performance trend items to prevent crashes
  const validPerformanceTrend = (performanceTrend || []).filter(
    (item) =>
      item &&
      typeof item === "object" &&
      item.label &&
      typeof item.score === "number"
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Real-Time Refresh */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-surface-600 dark:text-surface-400 flex flex-wrap items-center gap-2">
              Welcome back, {user?.name || "User"}!
              {lastUpdated && (
                <span className="text-xs text-surface-500 dark:text-surface-500">
                  • Updated {getTimeAgo(lastUpdated)}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-4 h-4 transition-transform ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            <span className="text-sm font-medium hidden sm:inline">
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>

        {/* Real-Time Activity Indicator */}
        {refreshing && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Updating dashboard with latest data...
            </span>
          </div>
        )}

        {/* AI Recommendation Card */}
        {sectionErrors.recommendation ? (
          <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  {sectionErrors.recommendation}
                </p>
              </div>
              <button
                onClick={() => fetchDashboardData(true)}
                className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          recommendation && (
            <div className="mb-8 bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-300 dark:border-surface-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">
                      {recommendation.type === "start"
                        ? "🚀"
                        : recommendation.type === "improve"
                        ? "📚"
                        : "🎯"}
                    </span>
                    {recommendation.badge && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          recommendation.badge.variant === "success"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : recommendation.badge.variant === "warning"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300"
                        }`}
                      >
                        {recommendation.badge.text}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                    {recommendation.title}
                  </h2>
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    {recommendation.description}
                  </p>
                  {recommendation.insights && (
                    <ul className="space-y-1 mb-4">
                      {recommendation.insights.map((insight, idx) => {
                        // If insight is a string, render directly; if object, render its fields
                        if (typeof insight === "string") {
                          return (
                            <li
                              key={idx}
                              className="text-sm text-surface-600 dark:text-surface-400"
                            >
                              • {insight}
                            </li>
                          );
                        } else if (insight && typeof insight === "object") {
                          // Render object fields (questionText, reason, difficulty) if present
                          return (
                            <li
                              key={idx}
                              className="text-sm text-surface-600 dark:text-surface-400"
                            >
                              •{" "}
                              {insight.questionText ? (
                                <span className="font-semibold">
                                  {insight.questionText}
                                </span>
                              ) : null}
                              {insight.reason ? (
                                <span> — {insight.reason}</span>
                              ) : null}
                              {insight.difficulty ? (
                                <span>
                                  {" "}
                                  <span className="italic">
                                    [{insight.difficulty}]
                                  </span>
                                </span>
                              ) : null}
                            </li>
                          );
                        } else {
                          return null;
                        }
                      })}
                    </ul>
                  )}
                  {recommendation.estimatedTime && (
                    <p className="text-xs text-surface-500 dark:text-surface-500">
                      ⏱️ Estimated time: {recommendation.estimatedTime}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                  {recommendation.action && (
                    <button
                      onClick={() =>
                        navigate(
                          recommendation.action.url || "/interview/create"
                        )
                      }
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm sm:text-base font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      {recommendation.action.label || "Start Interview"}
                    </button>
                  )}
                  {recommendation.secondaryAction && (
                    <button
                      onClick={() =>
                        navigate(recommendation.secondaryAction.url)
                      }
                      className="px-4 sm:px-6 py-2 sm:py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 text-sm sm:text-base font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      {recommendation.secondaryAction.label}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Upcoming Session Alert */}
        {upcomingSession && (
          <div className="mb-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">
                    Upcoming Session
                  </p>
                  <h3 className="text-xl font-bold mb-1">
                    {upcomingSession.title}
                  </h3>
                  <p className="text-sm opacity-90">
                    {new Date(upcomingSession.scheduledAt).toLocaleString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/interview/${upcomingSession.id}`)}
                className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
              >
                Join Now
              </button>
            </div>
          </div>
        )}

        {/* Subscription Status Widget */}
        {sectionErrors.subscription ? (
          <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  {sectionErrors.subscription}
                </p>
              </div>
              <button
                onClick={() => fetchDashboardData(true)}
                className="px-3 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          subscriptionInfo && (
            <div className="mb-8 bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-300 dark:border-surface-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      subscriptionInfo.plan === "premium"
                        ? "bg-gradient-to-br from-primary-500 to-primary-600"
                        : "bg-surface-100 dark:bg-surface-700"
                    }`}
                  >
                    {subscriptionInfo.plan === "premium" ? (
                      <Crown className="w-7 h-7 text-white" />
                    ) : (
                      <Star className="w-7 h-7 text-surface-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                        {subscriptionInfo.plan === "premium"
                          ? "Premium"
                          : "Free"}{" "}
                        Plan
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          subscriptionInfo.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {subscriptionInfo.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {subscriptionInfo.plan === "premium" ? (
                        <p className="text-surface-600 dark:text-surface-400">
                          ✨ Unlimited interviews • Advanced AI feedback
                        </p>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400">
                            <span className="font-semibold text-surface-900 dark:text-white">
                              {subscriptionInfo.interviewsRemaining || 0}
                            </span>{" "}
                            of {subscriptionInfo.interviewsLimit || 10}{" "}
                            interviews remaining
                          </p>
                          <div className="w-full sm:w-32 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                subscriptionInfo.interviewsRemaining <= 2
                                  ? "bg-red-500"
                                  : subscriptionInfo.interviewsRemaining <= 5
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${
                                  ((subscriptionInfo.interviewsRemaining || 0) /
                                    (subscriptionInfo.interviewsLimit || 10)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {subscriptionInfo.plan === "free" && (
                  <button
                    onClick={() => navigate("/pricing")}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg whitespace-nowrap"
                  >
                    Upgrade to Premium
                  </button>
                )}
                {subscriptionInfo.plan === "premium" && (
                  <button
                    onClick={() => navigate("/pricing")}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Manage Subscription
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {/* Stats Grid - Real-Time Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Interviews */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-300 dark:border-surface-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  stats.interviewChange >= 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {stats.interviewChange >= 0 ? "+" : ""}
                {stats.interviewChange || 0}%
              </span>
            </div>
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">
                Total Interviews
              </p>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">
                {stats.totalInterviews || 0}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                This week: {stats.interviewChange >= 0 ? "↑" : "↓"} vs last week
              </p>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-300 dark:border-surface-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  stats.scoreChange >= 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {stats.scoreChange >= 0 ? "+" : ""}
                {stats.scoreChange || 0}%
              </span>
            </div>
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">
                Average Score
              </p>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">
                {stats.averageScore || 0}%
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                {stats.scoreChange >= 0 ? "Improving" : "Needs focus"}
              </p>
            </div>
          </div>

          {/* Practice Time */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-300 dark:border-surface-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                This month
              </span>
            </div>
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">
                Practice Time
              </p>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">
                {stats.practiceTime || 0}h
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                Keep up the momentum!
              </p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-300 dark:border-surface-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  stats.successRateChange >= 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {stats.successRateChange >= 0 ? "+" : ""}
                {stats.successRateChange || 0}%
              </span>
            </div>
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">
                Success Rate
              </p>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">
                {stats.successRate || 0}%
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                Interviews scoring ≥70%
              </p>
            </div>
          </div>
        </div>

        {/* Performance & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Enhanced Performance Trend Visualization */}
          <div className="lg:col-span-2 bg-gradient-to-br from-white via-white to-surface-100/30 dark:from-surface-800 dark:to-surface-850 rounded-2xl shadow-lg border border-surface-300 dark:border-surface-700/50 p-6 overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  Performance Trajectory
                </h2>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 ml-10">
                  Your journey to excellence
                </p>
              </div>
              <div className="flex items-center gap-2">
                {validPerformanceTrend.length > 0 &&
                  (() => {
                    const scores = validPerformanceTrend.map((d) => d.score);
                    const avgScore = Math.round(
                      scores.reduce((a, b) => a + b, 0) / scores.length
                    );
                    const firstScore = scores[0];
                    const lastScore = scores[scores.length - 1];
                    const trend = lastScore - firstScore;

                    return (
                      <div className="flex items-center gap-3">
                        <div className="text-right px-4 py-2 rounded-xl bg-white dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600 shadow-sm">
                          <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                            {avgScore}%
                          </div>
                          <div
                            className={`text-xs font-semibold flex items-center justify-center gap-1 ${
                              trend > 0
                                ? "text-green-600 dark:text-green-400"
                                : trend < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-surface-500"
                            }`}
                          >
                            {trend > 0 ? (
                              <>
                                <TrendingUp className="w-3 h-3" />+{trend}%
                              </>
                            ) : trend < 0 ? (
                              <>
                                <TrendingDown className="w-3 h-3" />
                                {trend}%
                              </>
                            ) : (
                              <>
                                <Minus className="w-3 h-3" />
                                Stable
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>

            {validPerformanceTrend.length > 0 ? (
              <div className="space-y-4">
                {/* Chart Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-4 py-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
                      Excellent (≥70%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
                      Good (50-69%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
                      Needs Work (&lt;50%)
                    </span>
                  </div>
                </div>

                {/* Modern Area Chart Visualization (ECharts) */}
                <div className="relative h-64 sm:h-72 rounded-xl p-2 sm:p-4">
                  <PerformanceEChart
                    data={validPerformanceTrend}
                    className="absolute inset-0"
                  />
                </div>

                {/* Enhanced Timeline labels */}
                <div className="flex justify-between items-center pl-8 sm:pl-12 pr-2 sm:pr-4 mt-2">
                  {validPerformanceTrend.map((data, index) => (
                    <div key={index} className="flex-1 text-center group">
                      <div className="text-[9px] sm:text-xs font-bold text-surface-800 dark:text-surface-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate px-1">
                        {data.label}
                      </div>
                      <div className="text-[8px] sm:text-[10px] text-surface-400 dark:text-surface-600 mt-0.5 font-medium truncate px-1">
                        {data.type
                          ? data.type.split("-")[0].substring(0, 4)
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Performance Insights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 mt-3 sm:mt-4 border-t border-surface-200/50 dark:border-surface-700/50">
                  {(() => {
                    const scores = validPerformanceTrend.map((d) => d.score);
                    const avgScore = Math.round(
                      scores.reduce((a, b) => a + b, 0) / scores.length
                    );
                    const maxScore = Math.max(...scores);
                    const trend = scores[scores.length - 1] - scores[0];

                    return (
                      <>
                        <div className="relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl transition-opacity group-hover:opacity-80"></div>
                          <div className="relative text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/30 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <BarChart3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                                Average
                              </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                              {avgScore}%
                            </div>
                          </div>
                        </div>

                        <div className="relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl transition-opacity group-hover:opacity-80"></div>
                          <div className="relative text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 rounded-xl border border-green-200/50 dark:border-green-700/30 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 font-bold uppercase tracking-wider">
                                Peak
                              </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-400">
                              {maxScore}%
                            </div>
                          </div>
                        </div>

                        <div className="relative overflow-hidden group">
                          <div
                            className={`absolute inset-0 rounded-xl transition-opacity group-hover:opacity-80 ${
                              trend >= 0
                                ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5"
                                : "bg-gradient-to-br from-orange-500/10 to-orange-600/5"
                            }`}
                          ></div>
                          <div
                            className={`relative text-center p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-all ${
                              trend >= 0
                                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 border border-emerald-200/50 dark:border-emerald-700/30"
                                : "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/30 dark:to-orange-800/20 border border-orange-200/50 dark:border-orange-700/30"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                              <div
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center ${
                                  trend >= 0
                                    ? "bg-emerald-500/20"
                                    : "bg-orange-500/20"
                                }`}
                              >
                                {trend > 0 ? (
                                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 dark:text-emerald-400" />
                                ) : trend < 0 ? (
                                  <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-600 dark:text-orange-400" />
                                ) : (
                                  <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-surface-600 dark:text-surface-400" />
                                )}
                              </div>
                              <div
                                className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                                  trend >= 0
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : "text-orange-700 dark:text-orange-300"
                                }`}
                              >
                                Trend
                              </div>
                            </div>
                            <div
                              className={`text-xl sm:text-2xl font-black flex items-center justify-center gap-1 ${
                                trend >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-orange-600 dark:text-orange-400"
                              }`}
                            >
                              {trend > 0 && "+"}
                              {trend}%
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-surface-500 dark:text-surface-400">
                <div className="text-center">
                  <LineChart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-medium mb-2">
                    No Performance Data Yet
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">
                    Complete your first interview to start tracking your
                    progress
                  </p>
                  <button
                    onClick={() => navigate("/interview/create")}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    Begin Your Journey
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-300 dark:border-surface-700 p-6">
            <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/interview/create")}
                className="w-full flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
              >
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    Start Interview
                  </p>
                  <p className="text-xs text-surface-600 dark:text-surface-400">
                    Begin a new mock interview
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-primary-600" />
              </button>

              <button
                onClick={() => navigate("/questions")}
                className="w-full flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-surface-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                    Question Bank
                  </p>
                  <p className="text-xs text-surface-600 dark:text-surface-400">
                    Browse practice questions
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-green-600" />
              </button>

              <button
                onClick={() => navigate("/scheduled")}
                className="w-full flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-surface-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Schedule Session
                  </p>
                  <p className="text-xs text-surface-600 dark:text-surface-400">
                    Plan your practice time
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-purple-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Skills & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skill Progress */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-300 dark:border-surface-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                Skill Progress
              </h2>
              <button
                onClick={() => navigate("/reports")}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View Reports
              </button>
            </div>
            {/* Mode Toggle */}
            <div className="flex items-center gap-3 mb-4">
              {["percentage", "count"].map((m) => (
                <button
                  key={m}
                  onClick={() => setSkillMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                    skillMode === m
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-200 dark:hover:bg-surface-600"
                  }`}
                  aria-pressed={skillMode === m}
                >
                  {m === "percentage" ? "Percent" : "Count"}
                </button>
              ))}
            </div>
            <div className="relative h-72 sm:h-80">
              <SkillProgressPieChart
                data={skillProgress}
                mode={skillMode}
                onSliceClick={({ slug }) => navigate(`/reports?skill=${slug}`)}
                className="absolute inset-0"
              />
            </div>
            {/* Accessible list of skills for screen readers */}
            <ul className="sr-only" aria-label="Skill progress breakdown">
              {skillProgress.map((s, i) => (
                <li key={i}>
                  {s.name}: {s.progress}%
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Interviews */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-md border border-surface-300 dark:border-surface-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                Recent Interviews
              </h2>
              <button
                onClick={() => navigate("/interviews")}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentInterviews.length > 0 ? (
                recentInterviews.map((interview) => (
                  <button
                    key={interview.id}
                    onClick={() =>
                      navigate(`/interview/${interview.id}/results`)
                    }
                    className="w-full p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-surface-900 dark:text-white">
                        {interview.jobTitle}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          interview.score >= 80
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : interview.score >= 60
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {interview.score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-600 dark:text-surface-400">
                        {interview.questionsAnswered} questions
                      </span>
                      <span className="text-surface-500 dark:text-surface-500">
                        {new Date(interview.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No interviews yet</p>
                  <button
                    onClick={() => navigate("/interview/create")}
                    className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                  >
                    Start your first interview
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
