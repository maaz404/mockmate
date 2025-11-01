import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, fetch current session user
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const resp = await api.get("/session/me");
        const { user: me, authenticated } = resp?.data || {};
        if (cancelled) return;
        if (authenticated && me) {
          setUser(me);
          // try to hydrate profile
          try {
            const prof = await api.get("/users/profile");
            setUserProfile(prof.data.data);
          } catch (_) {
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (e) {
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = {
    user,
    userProfile,
    isSignedIn: !!user,
    isLoaded: !loading,
    loading,
    signInWithGoogle: () => {
      window.location.href = "/api/session/auth/google";
    },
    signOut: async () => {
      try {
        await api.post("/session/logout");
      } catch (_) {}
      window.location.href = "/";
    },
    refreshProfile: async () => {
      if (user) {
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
      if (user) {
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
