import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Token management
  const getToken = () => localStorage.getItem("accessToken");
  const getRefreshToken = () => localStorage.getItem("refreshToken");
  const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  };
  const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  // Set up API to use our token function
  useEffect(() => {
    setAuthToken(getToken);
  }, []);

  // Load user on mount if token exists
  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const token = getToken();
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // Fetch user data using bootstrap endpoint
        const response = await api.get("/bootstrap");
        if (!isMounted) return;

        const { user: userData, profile } = response.data.data;

        setUser(userData);
        setUserProfile(profile);
        setIsAuthenticated(true);
      } catch (error) {
        if (!isMounted) return;
        // eslint-disable-next-line no-console
        console.error("Failed to load user:", error);
        // Token might be expired, try to refresh
        await refreshAccessToken();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh access token using refresh token
  const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }

    try {
      const response = await api.post("/auth/refresh", { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      setTokens(accessToken, newRefreshToken);

      // Reload user data
      const userData = await api.get("/bootstrap");
      setUser(userData.data.data.user);
      setUserProfile(userData.data.data.profile);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to refresh token:", error);
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      setUserProfile(null);
      return false;
    }
  };

  // Login with email/password
  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, refreshToken, user: userData } = response.data.data;

      setTokens(accessToken, refreshToken);
      setUser(userData);
      setIsAuthenticated(true);

      // Fetch full profile
      try {
        const profileResponse = await api.get("/users/profile");
        setUserProfile(profileResponse.data.data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to fetch profile:", error);
      }

      return { success: true, user: userData };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Login failed:", error);
      return {
        success: false,
        error: error.message || "Login failed",
      };
    }
  };

  // Register new user
  const register = async (email, password, name) => {
    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        name,
      });
      const { accessToken, refreshToken, user: userData } = response.data.data;

      setTokens(accessToken, refreshToken);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Registration failed:", error);
      return {
        success: false,
        error: error.message || "Registration failed",
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
    } finally {
      clearTokens();
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      window.location.href = "/login";
    }
  };

  // Google OAuth - redirect to backend
  const signInWithGoogle = () => {
    // Save current location to redirect back after OAuth
    localStorage.setItem("oauth_redirect", window.location.pathname);
    // Must use full URL to backend server, not relative path
    window.location.href = "http://localhost:5000/api/session/auth/google";
  };

  // Handle Google OAuth callback
  const handleOAuthCallback = async (token, refreshToken) => {
    console.log("🔵 handleOAuthCallback called");
    console.log("📋 Token:", token ? "✅ Received" : "❌ Missing");
    console.log(
      "📋 Refresh Token:",
      refreshToken ? "✅ Received" : "❌ Missing"
    );

    // Store tokens
    setTokens(token, refreshToken);
    console.log("✅ Tokens stored in localStorage");

    try {
      // Load user data
      console.log("📡 Fetching user data from /bootstrap...");
      const response = await api.get("/bootstrap");
      console.log("✅ Bootstrap response received");

      const userData = response.data.data.user;
      const profileData = response.data.data.profile;

      if (userData) {
        console.log("✅ User data found:", userData.email);
        setUser(userData);
        setUserProfile(profileData);
        setIsAuthenticated(true);

        // FIXED: Check onboarding status and redirect accordingly
        const needsOnboarding = profileData?.onboardingCompleted === false;
        const savedRedirect = localStorage.getItem("oauth_redirect");
        localStorage.removeItem("oauth_redirect");

        // Determine redirect path
        let redirectPath = "/"; // Default to landing page

        if (needsOnboarding) {
          redirectPath = "/onboarding";
        } else if (
          savedRedirect &&
          savedRedirect !== "/login" &&
          savedRedirect !== "/register"
        ) {
          redirectPath = savedRedirect;
        }

        // eslint-disable-next-line no-console
        console.log("🔄 Redirecting to:", redirectPath);
        window.location.href = redirectPath;
      } else {
        // eslint-disable-next-line no-console
        console.error("❌ No user data in bootstrap response");
        clearTokens();
        window.location.href = "/login?error=no_user_data";
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to load user after OAuth:", error);
      // eslint-disable-next-line no-console
      console.error("Error details:", error.response?.data);
      clearTokens();
      window.location.href = "/login?error=bootstrap_failed";
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (!isAuthenticated) return null;

    try {
      const response = await api.get("/users/profile");
      setUserProfile(response.data.data);
      return response.data.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to refresh profile:", error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!isAuthenticated) return null;

    try {
      const response = await api.put("/users/profile", updates);
      setUserProfile(response.data.data);
      return response.data.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  const value = {
    // State
    user,
    userProfile,
    isAuthenticated,
    isSignedIn: isAuthenticated,
    isLoaded: !loading,
    loading,

    // Auth methods
    login,
    register,
    logout,
    signOut: logout,
    signInWithGoogle,
    handleOAuthCallback,
    refreshAccessToken,

    // Profile methods
    refreshProfile,
    updateProfile,

    // Token methods
    getToken,
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

export const useAuth = useAuthContext;
