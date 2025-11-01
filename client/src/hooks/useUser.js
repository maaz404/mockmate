import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import { userService } from "../services/mockmate";

/**
 * Custom hook that combines auth user data with MockMate user stats
 * Provides a complete user profile with authentication and application data
 */
export const useUser = () => {
  const { user, isSignedIn, isLoaded } = useAuthContext();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          setLoading(true);
          const statsResponse = await userService.getStats();
          setUserStats(statsResponse.data);
          setError(null);
        } catch (err) {
          console.warn("Failed to fetch user stats:", err);
          setError(err.message);
          // Don't fail completely - user can still use the app
          setUserStats({
            interviewsCompleted: 0,
            averageScore: 0,
            practiceHours: 0,
            streak: 0,
          });
        } finally {
          setLoading(false);
        }
      } else if (isLoaded) {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, isSignedIn, user]);

  return {
    // Auth user data
    user,
    isSignedIn,
    isLoaded,

    // MockMate user stats
    userStats,

    // Loading states
    loading: loading || !isLoaded,
    error,

    // Utility methods
    refreshStats: async () => {
      if (isSignedIn) {
        try {
          const statsResponse = await userService.getStats();
          setUserStats(statsResponse.data);
        } catch (err) {
          setError(err.message);
        }
      }
    },
  };
};
