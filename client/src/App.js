import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import "./index.css";

// Import components
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ComprehensiveDashboard from "./pages/ComprehensiveDashboard";
import InterviewCreationPage from "./pages/InterviewCreationPage";
import InterviewExperiencePage from "./pages/InterviewExperiencePage";
import InterviewResultsPage from "./pages/InterviewResultsPage";
import InterviewPage from "./pages/InterviewPage";
import InterviewHistoryPage from "./pages/InterviewHistoryPage";
import QuestionBankPage from "./pages/QuestionBankPage";
import EnhancedSettingsPage from "./pages/EnhancedSettingsPage";
import MockInterviewPage from "./pages/MockInterviewPage";
import PracticePage from "./pages/PracticePage";
import ResourcesPage from "./pages/ResourcesPage";
import ReportsPage from "./pages/ReportsPage";
import SessionSummaryPage from "./pages/SessionSummaryPage";
import SupportPage from "./pages/SupportPage";
import HybridQuestionDemo from "./pages/HybridQuestionDemo";
import CodingChallengeDemo from "./pages/CodingChallengeDemo";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import VideoRecordingDemo from "./components/VideoRecordingDemo";

// Get the Clerk publishable key
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const SIGN_OUT_ON_START =
  (process.env.REACT_APP_SIGN_OUT_ON_START || "true").toLowerCase() === "true";

function OneTimeSignOutGate({ children }) {
  // Sign out on initial load if a session exists and feature is enabled
  const { isSignedIn, isLoaded, signOut } = require("@clerk/clerk-react");
  const ReactRef = require("react");
  const ranRef = ReactRef.useRef(false);
  ReactRef.useEffect(() => {
    if (ranRef.current || !isLoaded) return;
    ranRef.current = true;
    if (SIGN_OUT_ON_START && isSignedIn) {
      // Fire and forget
      signOut().catch(() => {});
    }
  }, [isLoaded, isSignedIn, signOut]);
  return children;
}

function App() {
  // Use the environment key - no fallback to ensure proper configuration
  const clerkKey = clerkPubKey;

  if (!clerkKey) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-400 mb-4">
            Configuration Error
          </h1>
          <p className="text-surface-700 dark:text-surface-300 mb-4">
            Clerk publishable key is required. Please add
            REACT_APP_CLERK_PUBLISHABLE_KEY to your .env file.
          </p>
          <div className="text-left bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-4 rounded-lg max-w-md">
            <h3 className="text-yellow-400 font-semibold mb-2">Quick Fix:</h3>
            <ol className="text-sm text-surface-700 dark:text-surface-300 space-y-1">
              <li>
                1. Go to{" "}
                <a
                  href="https://clerk.com"
                  className="text-blue-400 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  clerk.com
                </a>
              </li>
              <li>2. Create/sign in to your account</li>
              <li>3. Create a new application</li>
              <li>4. Copy your Publishable Key</li>
              <li>5. Add it to client/.env</li>
              <li>6. Configure Google OAuth in Clerk dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      appearance={{
        baseTheme: undefined,
      }}
      // Add proper redirect URLs for OAuth
      redirectUrl={window.location.origin}
      signInUrl="/login"
      signUpUrl="/register"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <ThemeProvider>
        <AuthProvider>
          <OneTimeSignOutGate>
            <Router>
              <Routes>
                {/* Standalone Video Demo Route (no layout wrapper) */}
                <Route path="/video-demo" element={<VideoRecordingDemo />} />
              </Routes>
              <Layout>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/demo" element={<HybridQuestionDemo />} />
                  <Route
                    path="/coding-demo"
                    element={<CodingChallengeDemo />}
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/comprehensive-dashboard"
                    element={
                      <ProtectedRoute>
                        <ComprehensiveDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/interview/new"
                    element={
                      <ProtectedRoute>
                        <InterviewCreationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/interview/experience"
                    element={
                      <ProtectedRoute>
                        <InterviewExperiencePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/interview/:interviewId/results"
                    element={
                      <ProtectedRoute>
                        <InterviewResultsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/interview/:interviewId"
                    element={
                      <ProtectedRoute>
                        <InterviewPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/interviews"
                    element={
                      <ProtectedRoute>
                        <InterviewHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/questions"
                    element={
                      <ProtectedRoute>
                        <QuestionBankPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <EnhancedSettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mock-interview"
                    element={
                      <ProtectedRoute>
                        <MockInterviewPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/practice"
                    element={
                      <ProtectedRoute>
                        <PracticePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resources"
                    element={
                      <ProtectedRoute>
                        <ResourcesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <ReportsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/session-summary/:interviewId"
                    element={
                      <ProtectedRoute>
                        <SessionSummaryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/support"
                    element={
                      <ProtectedRoute>
                        <SupportPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Layout>
            </Router>
            <Toaster position="top-right" />
          </OneTimeSignOutGate>
        </AuthProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;
