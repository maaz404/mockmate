import React, { createContext, useContext, useState } from "react";

// Mock authentication context for development/testing in absence of backend
const MockAuthContext = createContext();

export const MockAuthProvider = ({ children, defaultSignedIn = true }) => {
  const [user, setUser] = useState(
    defaultSignedIn
      ? { id: "mock-user-123", name: "Test User", email: "test@example.com" }
      : null
  );
  const [userProfile, setUserProfile] = useState(
    defaultSignedIn
      ? {
          _id: "mock-profile-123",
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          onboardingCompleted: false,
          preferences: {
            difficulty: "intermediate",
            sessionDuration: 30,
          },
          analytics: { totalInterviews: 0, averageScore: 0 },
          completeness: 25,
        }
      : null
  );

  const login = () => {
    setUser({
      id: "mock-user-123",
      name: "Test User",
      email: "test@example.com",
    });
  };

  const logout = () => {
    setUser(null);
    setUserProfile(null);
  };

  const updateProfile = async (updates) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    return updated;
  };

  const value = {
    user,
    userProfile,
    loading: false,
    isAuthenticated: !!user,
    loginWithGoogle: login,
    logout,
    updateProfile,
    refresh: async () => {},
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within MockAuthProvider");
  }
  return context;
};
