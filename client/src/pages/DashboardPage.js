import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatsCard from "../components/dashboard/StatsCard";
import RecentInterviews from "../components/dashboard/RecentInterviews";
import QuickActions from "../components/dashboard/QuickActions";
import ProgressChart from "../components/dashboard/ProgressChart";
import { apiService } from "../services/api";

const DashboardPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const profileResponse = await apiService.get("/users/profile");
      setUserProfile(profileResponse.data || {});

      // Layout will handle showing onboarding modal if not completed

      // Fetch analytics
      const analyticsResponse = await apiService.get("/users/analytics");
      setAnalytics(analyticsResponse.data || {});

      // Fetch recent interviews
      const interviewsResponse = await apiService.get("/interviews?limit=5");
      setRecentInterviews(interviewsResponse.data?.interviews || []);
    } catch (error) {
      // Handle dashboard data fetching error
      setAnalytics(null);
      setUserProfile(null);
      setRecentInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Onboarding modal handled by Layout

  const startQuickInterview = async (type) => {
    try {
      const interviewConfig = {
        jobRole:
          userProfile?.professionalInfo?.currentRole || "Software Developer",
        industry: userProfile?.professionalInfo?.industry || "Technology",
        experienceLevel: userProfile?.professionalInfo?.experience || "junior",
        interviewType: type,
        difficulty: userProfile?.preferences?.difficulty || "beginner",
        duration: 30,
        questionCount: 10,
      };

      const response = await apiService.post("/interviews", {
        config: interviewConfig,
      });

      navigate(`/interview/${response.data._id}`);
    } catch (error) {
      // Handle interview creation error
      // Could show a toast notification here
    }
  };

  if (!isLoaded || loading) {
    return <LoadingSpinner />;
  }

  const stats = analytics
    ? [
        {
          title: "Total Interviews",
          value: analytics.analytics?.totalInterviews || 0,
          icon: "📊",
          change: "+2 this week",
        },
        {
          title: "Average Score",
          value: `${analytics.analytics?.averageScore || 0}%`,
          icon: "🎯",
          change:
            (analytics.analytics?.averageScore || 0) >= 70
              ? "+5% improvement"
              : "Keep practicing!",
        },
        {
          title: "Current Streak",
          value: `${analytics.analytics?.streak?.current || 0} days`,
          icon: "🔥",
          change: `Best: ${analytics.analytics?.streak?.longest || 0} days`,
        },
        {
          title: "Interviews Left",
          value:
            analytics.subscription?.plan === "free"
              ? analytics.subscription?.interviewsRemaining || 0
              : "Unlimited",
          icon: "💎",
          change:
            analytics.subscription?.plan === "free" ? "Free plan" : "Premium",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                Welcome back, {user?.firstName || "there"}! 👋
              </h1>
              <p className="mt-2 text-surface-600 dark:text-surface-300">
                {userProfile?.onboardingCompleted
                  ? "Ready for your next interview practice session?"
                  : "Let's get your profile set up first!"}
              </p>
            </div>

            {/* Profile Completeness */}
            {userProfile && userProfile.profileCompleteness < 100 && (
              <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                        {userProfile.profileCompleteness}%
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-primary-900 dark:text-primary-300">
                      Complete your profile
                    </p>
                    <p className="text-xs text-primary-600 dark:text-primary-400">
                      Get better interview recommendations
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions
          onStartInterview={startQuickInterview}
          userProfile={userProfile}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Recent Interviews */}
          <div className="lg:col-span-2">
            <RecentInterviews
              interviews={recentInterviews}
              onViewAll={() => navigate("/interviews")}
            />
          </div>

          {/* Progress Chart */}
          <div className="lg:col-span-1">
            <ProgressChart analytics={analytics} />
          </div>
        </div>

        {/* Onboarding modal is rendered by Layout when required */}
      </div>
    </div>
  );
};

export default DashboardPage;
