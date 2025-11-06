import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

// Auth Pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import OAuthCallbackPage from "../pages/auth/OAuthCallbackPage";

// Protected Pages
import DashboardPage from "../pages/DashboardPage";
import MockInterviewPage from "../pages/MockInterviewPage";
import InterviewCreationPage from "../pages/InterviewCreationPage";
import InterviewPage from "../pages/InterviewPage";
import InterviewHistoryPage from "../pages/InterviewHistoryPage";
import InterviewResultsPage from "../pages/InterviewResultsPage";
import SessionSummaryPage from "../pages/SessionSummaryPage";
import QuestionBankPage from "../pages/QuestionBankPage";
import PracticePage from "../pages/PracticePage";
import ReportsPage from "../pages/ReportsPage";
import ScheduledSessionsPage from "../pages/ScheduledSessionsPage";
import EnhancedSettingsPage from "../pages/EnhancedSettingsPage";
import ResourcesPage from "../pages/ResourcesPage";
import CodingChallengeDemo from "../pages/CodingChallengeDemo";
import VideoRecordingDemo from "../components/VideoRecordingDemo";
import ComprehensiveDashboard from "../pages/ComprehensiveDashboard";
import HybridQuestionDemo from "../pages/HybridQuestionDemo";
import HomePage from "../pages/HomePage";
import HardwareCheckLobby from "../pages/HardwareCheckLobby";

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children; // Layout is now in App.js, wraps everything
}

// Public Route Wrapper
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // If user is already authenticated, send them to the landing page
    return <Navigate to="/" replace />;
  }

  return children; // Layout is now in App.js, wraps everything
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - Sidebar shows on all pages now */}
      {/* Landing page is now the root, accessible to everyone */}
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      {/* Protected Routes - Sidebar shows on all pages now */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
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
      {/* Interview Routes - IMPORTANT: More specific routes MUST come first! */}
      <Route
        path="/hardware-check-lobby/:id"
        element={
          <ProtectedRoute>
            <HardwareCheckLobby />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/create"
        element={
          <ProtectedRoute>
            <InterviewCreationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/:id/experience"
        element={
          <ProtectedRoute>
            {/* Use the full-featured InterviewPage for the experience route */}
            <InterviewPage />
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
        path="/session-summary/:interviewId"
        element={
          <ProtectedRoute>
            <SessionSummaryPage />
          </ProtectedRoute>
        }
      />
      {/* Less specific route comes last */}
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
        path="/practice"
        element={
          <ProtectedRoute>
            <PracticePage />
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
        path="/scheduled"
        element={
          <ProtectedRoute>
            <ScheduledSessionsPage />
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
        path="/resources"
        element={
          <ProtectedRoute>
            <ResourcesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coding-demo"
        element={
          <ProtectedRoute>
            <CodingChallengeDemo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-demo"
        element={
          <ProtectedRoute>
            <VideoRecordingDemo />
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
        path="/demo"
        element={
          <ProtectedRoute>
            <HybridQuestionDemo />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
