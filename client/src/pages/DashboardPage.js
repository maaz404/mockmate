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
} from "lucide-react";

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

  // Last update timestamp
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all dashboard data in parallel
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      // Parallel fetch for better performance
      const [summaryRes, , recommendationRes, subscriptionRes] =
        await Promise.all([
          apiService.get("/users/dashboard/summary"),
          apiService.get("/users/dashboard/metrics?timeRange=30"),
          apiService.get("/users/dashboard/recommendation"),
          apiService.get("/users/subscription"),
        ]);

      // eslint-disable-next-line no-console
      console.log("Summary Response:", summaryRes);
      // eslint-disable-next-line no-console
      console.log("Summary Response Data:", summaryRes.data);
      // eslint-disable-next-line no-console
      console.log("Summary Response Data.data:", summaryRes.data.data);
      // eslint-disable-next-line no-console
      console.log("Summary Stats:", summaryRes.data.data?.stats);
      // eslint-disable-next-line no-console
      console.log("Recommendation Response:", recommendationRes);

      setDashboardData(summaryRes.data);
      setRecommendation(recommendationRes.data);
      setSubscriptionInfo(subscriptionRes.data);
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Dashboard fetch error:", err);
      // eslint-disable-next-line no-console
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard. Please try again."
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

  // Real-time auto-refresh every 30 seconds
  useEffect(() => {
    if (!loading && dashboardData) {
      const interval = setInterval(() => {
        fetchDashboardData(true);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [loading, dashboardData, fetchDashboardData]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-surface-700 dark:text-surface-300">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-6">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
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

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Real-Time Refresh */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-surface-600 dark:text-surface-400 flex items-center gap-2">
              Welcome back, {user?.name || "User"}!
              {lastUpdated && (
                <span className="text-xs">
                  • Last updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="text-sm font-medium">
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
        {recommendation && (
          <div className="mb-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg p-6 text-white">
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
                          ? "bg-green-500/20 text-white"
                          : recommendation.badge.variant === "warning"
                          ? "bg-yellow-500/20 text-white"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {recommendation.badge.text}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {recommendation.title}
                </h2>
                <p className="text-white/90 mb-4">
                  {recommendation.description}
                </p>
                {recommendation.insights && (
                  <ul className="space-y-1 mb-4">
                    {recommendation.insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-white/80">
                        • {insight}
                      </li>
                    ))}
                  </ul>
                )}
                {recommendation.estimatedTime && (
                  <p className="text-xs text-white/70">
                    ⏱️ Estimated time: {recommendation.estimatedTime}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate("/interview/create")}
                  className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors whitespace-nowrap"
                >
                  {recommendation.action.label}
                </button>
                {recommendation.secondaryAction && (
                  <button
                    onClick={() => navigate(recommendation.secondaryAction.url)}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    {recommendation.secondaryAction.label}
                  </button>
                )}
              </div>
            </div>
          </div>
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
        {subscriptionInfo && (
          <div className="mb-8 bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
            <div className="flex items-center justify-between">
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
                      {subscriptionInfo.plan === "premium" ? "Premium" : "Free"}{" "}
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
                      <div className="flex items-center gap-3">
                        <p className="text-surface-600 dark:text-surface-400">
                          <span className="font-semibold text-surface-900 dark:text-white">
                            {subscriptionInfo.interviewsRemaining || 0}
                          </span>{" "}
                          of {subscriptionInfo.interviewsLimit || 10} interviews
                          remaining
                        </p>
                        <div className="w-32 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
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
              {subscriptionInfo.plan === "free" &&
                subscriptionInfo.interviewsRemaining <= 5 && (
                  <button
                    onClick={() => navigate("/pricing")}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                  >
                    Upgrade to Premium
                  </button>
                )}
              {subscriptionInfo.plan === "premium" && (
                <button
                  onClick={() => navigate("/pricing")}
                  className="px-6 py-3 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Manage Subscription
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid - Real-Time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Interviews */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 hover:shadow-md transition-shadow">
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
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 hover:shadow-md transition-shadow">
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
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 hover:shadow-md transition-shadow">
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
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 hover:shadow-md transition-shadow">
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
          {/* Performance Trend Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                Performance Trend
              </h2>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>

            {/* Simple Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-2">
              {performanceTrend.length > 0 ? (
                performanceTrend.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all duration-300 hover:from-primary-700 hover:to-primary-500 cursor-pointer relative group"
                      style={{ height: `${(data.score / 100) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-900 text-white text-xs px-2 py-1 rounded">
                        {data.score}%
                      </div>
                    </div>
                    <span className="text-xs text-surface-600 dark:text-surface-400">
                      {data.label}
                    </span>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-surface-500 dark:text-surface-400">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Complete interviews to see your performance trend</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
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
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
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

            <div className="space-y-4">
              {skillProgress.length > 0 ? (
                skillProgress.map((skill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-surface-900 dark:text-white">
                        {skill.name}
                      </span>
                      <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                        {skill.progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${skill.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Complete interviews to track your skills</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Interviews */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
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
