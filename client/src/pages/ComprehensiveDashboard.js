import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import StatsCard from "../components/dashboard/StatsCard";
import RecentInterviews from "../components/dashboard/RecentInterviews";
import QuickActions from "../components/dashboard/QuickActions";
import ProgressChart from "../components/dashboard/ProgressChart";
import OnboardingModal from "../components/onboarding/OnboardingModal";
import { apiService } from "../services/api";

const ComprehensiveDashboard = () => {
  const { user, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData();
    }
  }, [isLoaded, user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const profileResponse = await apiService.get("/users/profile");
      if (profileResponse.success) {
        setUserProfile(profileResponse.data);

        // Check if onboarding is needed
        if (!profileResponse.data.onboardingCompleted) {
          setShowOnboarding(true);
        }
      } else {
        // Profile doesn't exist, show onboarding
        setShowOnboarding(true);
      }

      // Fetch user statistics
      const statsResponse = await apiService.get("/users/stats");
      if (statsResponse.success) {
        setUserStats(statsResponse.data);
      }

      // Fetch recent interviews
      const interviewsResponse = await apiService.get("/interviews");
      if (interviewsResponse.success) {
        setRecentInterviews(interviewsResponse.data.slice(0, 5)); // Latest 5
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching user data:", error);
      // If profile doesn't exist, show onboarding
      if (error.status === 404) {
        setShowOnboarding(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (profileData) => {
    try {
      const response = await apiService.post(
        "/users/onboarding/complete",
        profileData
      );
      if (response.success) {
        setUserProfile(response.data);
        setShowOnboarding(false);
        // Refresh data
        fetchUserData();
      } else {
        throw new Error(response.message || "Failed to complete onboarding");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error completing onboarding:", error);
      // Re-throw the error so the onboarding modal can handle it
      throw error;
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-4">
            Please sign in to continue
          </h2>
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
            <div>
              <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
                Welcome back,{" "}
                {user.firstName || user.emailAddresses[0]?.emailAddress}!
              </h1>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                {userProfile?.jobRole
                  ? `${userProfile.jobRole} - ${userProfile.experienceLevel}`
                  : "Ready to practice your interview skills?"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-surface-600 dark:text-surface-400">
                Profile Completion:{" "}
                {userProfile?.profileCompletenessPercentage || 0}%
              </span>
              <div className="w-20 bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      userProfile?.profileCompletenessPercentage || 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Interviews Completed"
            value={userStats?.interviewsCompleted || 0}
            change={userStats?.interviewsCompletedChange}
            changeType="increase"
            icon="📝"
          />
          <StatsCard
            title="Average Score"
            value={
              userStats?.averageScore ? `${userStats.averageScore}%` : "N/A"
            }
            change={userStats?.averageScoreChange}
            changeType={
              userStats?.averageScoreChange >= 0 ? "increase" : "decrease"
            }
            icon="📊"
          />
          <StatsCard
            title="Practice Hours"
            value={userStats?.practiceHours || 0}
            change={userStats?.practiceHoursChange}
            changeType="increase"
            icon="⏰"
          />
          <StatsCard
            title="Current Streak"
            value={userStats?.streak || 0}
            change={userStats?.streakChange}
            changeType="increase"
            icon="🔥"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Interviews & Progress */}
          <div className="lg:col-span-2 space-y-8">
            <RecentInterviews interviews={recentInterviews} />
            {userStats?.progressData && (
              <ProgressChart data={userStats.progressData} />
            )}
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-8">
            <QuickActions userProfile={userProfile} />

            {/* Skills Overview */}
            {userProfile?.skills && userProfile.skills.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                  Your Skills
                </h3>
                <div className="space-y-3">
                  {userProfile?.skills?.map((skill, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        {skill.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              skill.confidence <= 2
                                ? "bg-red-500"
                                : skill.confidence <= 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${(skill.confidence / 5) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-surface-500 dark:text-surface-400 capitalize w-16">
                          {skill.confidence}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {userProfile?.recentActivity && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {userProfile?.recentActivity
                    ?.slice(0, 5)
                    ?.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 text-sm"
                      >
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="text-surface-700 dark:text-surface-300">
                          {activity.description}
                        </span>
                        <span className="text-surface-400 dark:text-surface-500 ml-auto">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export default ComprehensiveDashboard;
