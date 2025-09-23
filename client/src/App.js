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

import VideoRecordingDemo from "./components/VideoRecordingDemo";

// Get the Clerk publishable key
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

function App() {
  // Use the environment key
  const clerkKey =
    clerkPubKey || "pk_test_bGF6eS1waWxsLTYxLmNsZXJrLmFjY291bnRzLmRldiQ";

  if (!clerkKey) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-400 mb-4">
            Configuration Error
          </h1>
          <p className="text-white">
            Clerk publishable key is required. Please add
            REACT_APP_CLERK_PUBLISHABLE_KEY to your .env file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/login"
      signUpUrl="/register"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#0f172a",
          colorInputBackground: "#334155",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#cbd5e1",
        },
      }}
    >
      <AuthProvider>
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
              <Route path="/coding-demo" element={<CodingChallengeDemo />} />

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
                path="/interview/results"
                element={
                  <ProtectedRoute>
                    <InterviewResultsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id"
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
      </AuthProvider>
    </ClerkProvider>
  );
}

export default App;
