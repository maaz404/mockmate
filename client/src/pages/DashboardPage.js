import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatsCard from "../components/dashboard/StatsCard";
import RecentInterviews from "../components/dashboard/RecentInterviews";
import QuickActions from "../components/dashboard/QuickActions";
import ProgressChart from "../components/dashboard/ProgressChart";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import GoalsPanel from "../components/dashboard/GoalsPanel";
import TipsPanel from "../components/dashboard/TipsPanel";
import UpcomingCard from "../components/dashboard/UpcomingCard";
import { apiService } from "../services/api";

const DashboardPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tips, setTips] = useState([]);

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

      // Fetch upcoming scheduled sessions
      try {
        const schedRes = await apiService.get("/users/scheduled-sessions?limit=3");
        setScheduled(schedRes.data || []);
      } catch (_e) {
        setScheduled([]);
      }

      // Fetch goals
      try {
        const goalsRes = await apiService.get("/users/goals");
        setGoals(goalsRes.data || []);
      } catch (_e) {
        setGoals([]);
      }

      // Fetch dynamic tips
      try {
        const tipsRes = await apiService.get("/users/tips");
        setTips(tipsRes.data || []);
      } catch (_e) {
        setTips([]);
      }
    } catch (error) {
      // Handle dashboard data fetching error
      setAnalytics(null);
      setUserProfile(null);
      setRecentInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Persist goal toggle
  const toggleGoal = async (index) => {
    const nextGoals = goals.map((g, i) => (i === index ? { ...g, done: !g.done } : g));
    setGoals(nextGoals);
    try {
      await apiService.put("/users/goals", { goals: nextGoals });
    } catch (_e) {
      // revert on error
      setGoals(goals);
    }
  };

  // Onboarding modal handled by Layout

  const startQuickInterview = async (type) => {
    try {
      // Map experience levels to match server expectations
      const experienceMapping = {
        entry: "entry",
        junior: "junior",
        mid: "mid",
        senior: "senior",
        lead: "lead",
        executive: "executive",
      };

      const interviewConfig = {
        jobRole:
          userProfile?.professionalInfo?.currentRole || "Software Developer",
        industry: userProfile?.professionalInfo?.industry || "Technology",
        experienceLevel:
          experienceMapping[userProfile?.professionalInfo?.experience] ||
          "junior",
        interviewType: type,
        difficulty: "intermediate", // Default to intermediate for quick interviews
        duration: 30,
        questionCount: 10,
      };

      const response = await apiService.post("/interviews", {
        config: interviewConfig,
      });

      if (response.success) {
        navigate(`/interview/${response.data._id}`);
      } else {
        alert("Failed to create interview. Please try again.");
      }
    } catch (error) {
      alert("Failed to create interview. Please try again.");
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
          <DashboardHeader user={user} userProfile={userProfile} onStartInterview={startQuickInterview} />
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
          <div className="lg:col-span-1 space-y-8">
            <ProgressChart analytics={analytics} />
            <UpcomingCard next={scheduled[0] ? { title: scheduled[0].title, when: new Date(scheduled[0].scheduledAt).toLocaleString() } : null} />
            <GoalsPanel goals={goals} onToggle={toggleGoal} />
            <TipsPanel tips={tips} />
          </div>
        </div>

        {/* Onboarding modal is rendered by Layout when required */}
      </div>
    </div>
  );
};

export default DashboardPage;
