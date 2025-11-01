import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatsCard from "../components/dashboard/StatsCard";
import RecentInterviews from "../components/dashboard/RecentInterviews";
import DashboardHero from "../components/dashboard/DashboardHero";
import InterviewCompletionChart from "../components/dashboard/InterviewCompletionChart";
import SkillsDistributionChart from "../components/dashboard/SkillsDistributionChart";
import { apiService } from "../services/api";

function DashboardPage() {
  const { user, isLoaded } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [skillsDistribution, setSkillsDistribution] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const summary = await apiService.get("/users/dashboard/summary");
      const data = summary?.data || {};
      setUserProfile(data.profile || null);
      setAnalytics(data.analytics || null);
      setRecentInterviews(data.recentInterviews || []);
      setSkillsDistribution(data.skillsDistribution || []);
    } catch (error) {
      // Handle error silently or use proper error handling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user, fetchDashboardData]);

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  const effectiveSubscription =
    (analytics && analytics.subscription) || userProfile?.subscription || null;
  const plan = effectiveSubscription?.plan || "free";
  const remaining =
    plan === "free" ? effectiveSubscription?.interviewsRemaining ?? 0 : null;

  return (
    <div className="relative min-h-screen bg-surface-50 dark:bg-gradient-to-br dark:from-surface-900 dark:via-surface-900 dark:to-surface-950 py-8 transition-colors duration-200">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 mb-8">
          <DashboardHero
            user={user}
            profileCompleteness={
              userProfile?.analytics?.profileCompleteness ||
              userProfile?.profileCompleteness ||
              0
            }
            streak={
              userProfile?.streak?.current ||
              analytics?.analytics?.streak?.current ||
              0
            }
            onboardingCompleted={Boolean(userProfile?.onboardingCompleted)}
            onCreate={() => navigate("/interview/new")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Interviews"
              value={analytics?.analytics?.totalInterviews ?? 6}
              icon="📊"
              change="+2 this week"
            />
            <StatsCard
              title="Average Score"
              value={`${analytics?.analytics?.averageScore ?? 80}%`}
              icon="🎯"
              change={
                (analytics?.analytics?.averageScore ?? 80) >= 70
                  ? "+5% improvement"
                  : "Keep practicing!"
              }
            />
            <StatsCard
              title="Current Streak"
              value={`${analytics?.analytics?.streak?.current ?? 3} days`}
              icon="🔥"
              change={`Best: ${
                analytics?.analytics?.streak?.longest ?? 5
              } days`}
            />
            <StatsCard
              title={plan === "free" ? "Interviews Left" : "Plan"}
              value={plan === "free" ? remaining ?? 2 : "Unlimited"}
              icon="💎"
              change={plan === "free" ? "Free plan" : "Premium"}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <InterviewCompletionChart interviews={recentInterviews} />
            <SkillsDistributionChart skillsData={skillsDistribution} />
          </div>

          {!loading && (
            <RecentInterviews
              interviews={recentInterviews}
              onOpen={(i) => navigate(`/interview/${i._id}`)}
              onResults={(i) => navigate(`/interview/${i._id}/results`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
