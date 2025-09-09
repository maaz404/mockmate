import { useUser as useClerkUser, useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { userService } from "../services/mockmate";

/**
 * Custom hook that combines Clerk user data with MockMate user stats
 * Provides a complete user profile with authentication and application data
 */
export const useUser = () => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const { isSignedIn } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (clerkLoaded && isSignedIn && clerkUser) {
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
      } else if (clerkLoaded) {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [clerkLoaded, isSignedIn, clerkUser]);

  return {
    // Clerk user data
    user: clerkUser,
    isSignedIn,
    isLoaded: clerkLoaded,

    // MockMate user stats
    userStats,

    // Loading states
    loading: loading || !clerkLoaded,
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
