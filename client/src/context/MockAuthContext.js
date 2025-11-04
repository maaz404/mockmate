import React, { createContext, useContext, useState } from "react";

// Mock authentication context for development testing
const MockAuthContext = createContext();

export const MockAuthProvider = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const mockUser = {
    id: "mock-user-123",
    firstName: "Test",
    lastName: "User",
    emailAddresses: [{ emailAddress: "test@example.com" }],
    profileImageUrl: "/api/placeholder/64/64",
  };

  const mockProfile = {
    _id: "mock-profile-123",
    user: "mock-user-123", // ✅ Changed to 'user' field
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    onboardingCompleted: false,
    professionalInfo: {
      title: "",
      company: "",
      experience: "",
      industry: "",
      skills: [],
      careerGoals: "",
    },
    preferences: {
      interviewTypes: [],
      difficulty: "intermediate",
      focusAreas: [],
      sessionDuration: 30,
      preferredLanguages: ["English"],
      facialAnalysis: {
        enabled: false,
        consentGiven: false,
        autoCalibration: true,
        showConfidenceMeter: true,
        showRealtimeFeedback: true,
        feedbackFrequency: "medium",
      },
    },
    analytics: {
      totalInterviews: 0,
      averageScore: 0,
      streak: { current: 0, longest: 0 },
    },
    completeness: 25,
  };

  const signIn = () => {
    setIsSignedIn(true);
    setUser(mockUser);
    setUserProfile(mockProfile);
  };

  const signOut = () => {
    setIsSignedIn(false);
    setUser(null);
    setUserProfile(null);
  };

  const updateProfile = async (updates) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    return updated;
  };

  const refreshProfile = async () => {
    return userProfile;
  };

  const value = {
    user,
    userProfile,
    isSignedIn,
    isLoaded: true,
    loading: false,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
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
