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
    // Set the token function for API calls
    setAuthToken(getToken);
  }, [getToken]);

  // Sync user data when authenticated
  useEffect(() => {
    const syncUserData = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          // Sync with backend
          await api.post("/auth/sync");

          // Get user profile
          const response = await api.get("/users/profile");
          setUserProfile(response.data.data);
        } catch (error) {
          // Error handled silently in production
          setUserProfile(null);
        } finally {
          setLoading(false);
        }
      } else if (isLoaded) {
        setLoading(false);
        setUserProfile(null);
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
