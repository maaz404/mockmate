import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import useGlobalApiErrors from "./hooks/useGlobalApiErrors";
import "./index.css";
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
import QuestionCategoryPage from "./pages/QuestionCategoryPage";
import EnhancedSettingsPage from "./pages/EnhancedSettingsPage";
import PracticePage from "./pages/PracticePage";
import ResourcesPage from "./pages/ResourcesPage";
import ReportsPage from "./pages/ReportsPage";
import ScheduledSessionsPage from "./pages/ScheduledSessionsPage";
import SupportPage from "./pages/SupportPage";
import SessionSummaryPage from "./pages/SessionSummaryPage";
import HybridQuestionDemo from "./pages/HybridQuestionDemo";
import CodingChallengeDemo from "./pages/CodingChallengeDemo";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ChatbotWidget from "./components/ui/ChatbotWidget";
import GlobalErrorBoundary from "./components/ui/GlobalErrorBoundary";
import VideoRecordingDemo from "./components/VideoRecordingDemo";

function ChatbotWrapper() {
  const { isSignedIn } = useAuthContext();
  const allowInDev = process.env.NODE_ENV !== "production";
  return isSignedIn || allowInDev ? <ChatbotWidget /> : null;
}

function App() {
  useGlobalApiErrors();

  useEffect(() => {
    let cancelled = false;
    const fetchReadiness = async () => {
      try {
        const resp = await fetch("/api/system/readiness");
        if (!resp.ok) return;
        const data = await resp.json();
        if (cancelled) return;
        if (data?.services) {
          Object.entries(data.services).forEach(([name, svc]) => {
            if (!svc.ready) {
              toast(
                () => (
                  <div className="text-sm">
                    <div className="font-semibold mb-1">
                      Service Degraded: {name}
                    </div>
                    <div className="opacity-80">
                      {svc.reason || "Not ready"}
                    </div>
                  </div>
                ),
                { icon: "⚠️", duration: 6000 }
              );
            }
          });
        }
      } catch (_) {}
    };
    fetchReadiness();
    const id = setTimeout(fetchReadiness, 20000);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <GlobalErrorBoundary>
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
                    path="/interview/:interviewId/experience"
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
                    path="/questions/:categorySlug"
                    element={
                      <ProtectedRoute>
                        <QuestionCategoryPage />
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
                    element={<Navigate to="/interview/new" replace />}
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
                    path="/scheduled"
                    element={
                      <ProtectedRoute>
                        <ScheduledSessionsPage />
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
            </GlobalErrorBoundary>
          </Router>
          <Toaster position="top-right" />
          <ChatbotWrapper />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
