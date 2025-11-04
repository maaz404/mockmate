import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import { apiService } from "../services/api";

/**
 * Custom hook that combines auth user data with MockMate user profile
 * Provides a complete user profile with authentication and application data
 */
export const useUser = () => {
  const { user, userProfile, isAuthenticated, isLoaded, refreshProfile } =
    useAuthContext();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (isLoaded && isAuthenticated && user) {
        try {
          setLoading(true);

          // Try to get stats from bootstrap (includes everything)
          const bootstrapResponse = await apiService.get("/bootstrap");

          if (bootstrapResponse?.data?.profile?.analytics) {
            setUserStats(bootstrapResponse.data.profile.analytics);
          } else {
            // Fallback: use profile analytics if available
            setUserStats({
              totalInterviews: userProfile?.analytics?.totalInterviews || 0,
              averageScore: userProfile?.analytics?.averageScore || 0,
              streak: userProfile?.analytics?.streak || {
                current: 0,
                longest: 0,
              },
              practiceHours: 0, // Calculate if needed
            });
          }

          setError(null);
        } catch (err) {
          console.warn("Failed to fetch user stats:", err);
          setError(err.message);

          // Don't fail completely - use profile data as fallback
          setUserStats({
            totalInterviews: userProfile?.analytics?.totalInterviews || 0,
            averageScore: userProfile?.analytics?.averageScore || 0,
            streak: userProfile?.analytics?.streak || {
              current: 0,
              longest: 0,
            },
            practiceHours: 0,
          });
        } finally {
          setLoading(false);
        }
      } else if (isLoaded) {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [isLoaded, isAuthenticated, user, userProfile]);

  return {
    // Auth user data
    user,
    userProfile,
    isSignedIn: isAuthenticated,
    isAuthenticated,
    isLoaded,

    // MockMate user stats
    userStats,

    // Loading states
    loading: loading || !isLoaded,
    error,

    // Utility methods
    refreshStats: async () => {
      if (isAuthenticated) {
        try {
          const bootstrapResponse = await apiService.get("/bootstrap");
          if (bootstrapResponse?.data?.profile?.analytics) {
            setUserStats(bootstrapResponse.data.profile.analytics);
          }
        } catch (err) {
          setError(err.message);
        }
      }
    },

    refreshProfile, // From AuthContext
  };
};
