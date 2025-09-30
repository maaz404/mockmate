import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(getToken);
  }, [getToken]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Sync user data when authenticated
  useEffect(() => {
    const syncUserData = async () => {
      // If Clerk is not loaded yet, wait
      if (!isLoaded) {
        return;
      }

      // If user is not signed in, stop loading immediately
      if (!isSignedIn) {
        setLoading(false);
        setUserProfile(null);
        return;
      }

      // If user is signed in, set loading to false first for faster UI
      setLoading(false);

      // Then sync data in background (non-blocking)
      if (user) {
        try {
          // Sync with backend (background operation)
          // eslint-disable-next-line no-console
          // console.log('Syncing user data with backend...');
          await api.post("/auth/sync");

          // Get user profile
          try {
            const response = await api.get("/users/profile");
            setUserProfile(response.data.data);
          } catch (err) {
            // If profile endpoint returns 404 early in onboarding, ignore and keep minimal profile
            setUserProfile(
              (prev) =>
                prev || {
                  firstName: user?.firstName || "",
                  lastName: user?.lastName || "",
                  email: user?.primaryEmailAddress?.emailAddress || "",
                  onboardingCompleted: false,
                }
            );
          }
          // eslint-disable-next-line no-console
          // console.log('User profile synced successfully');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Auth sync failed:", error);
          // Error handled silently - set basic profile from Clerk user
          setUserProfile({
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.primaryEmailAddress?.emailAddress || "",
            onboardingCompleted: false, // Default for new users
          });
        }
      }
    };

    syncUserData();
  }, [isLoaded, isSignedIn, user]);

  const value = {
    user,
    userProfile,
    isSignedIn,
    isLoaded,
    loading,
    refreshProfile: async () => {
      if (isSignedIn) {
        try {
          const response = await api.get("/users/profile");
          setUserProfile(response.data.data);
          return response.data.data;
        } catch (error) {
          throw error;
        }
      }
      return null;
    },
    updateProfile: async (updates) => {
      if (isSignedIn) {
        try {
          const response = await api.put("/users/profile", updates);
          setUserProfile(response.data.data);
          return response.data.data;
        } catch (error) {
          throw error;
        }
      }
      return null;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
