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
import QuestionCategoryPage from "./pages/QuestionCategoryPage";
import EnhancedSettingsPage from "./pages/EnhancedSettingsPage";
import PracticePage from "./pages/PracticePage";
import ResourcesPage from "./pages/ResourcesPage";
import ReportsPage from "./pages/ReportsPage";
import ScheduledSessionsPage from "./pages/ScheduledSessionsPage";
import SessionSummaryPage from "./pages/SessionSummaryPage";
import SupportPage from "./pages/SupportPage";
import HybridQuestionDemo from "./pages/HybridQuestionDemo";
import CodingChallengeDemo from "./pages/CodingChallengeDemo";
import RequireAuth from "./components/routing/RequireAuth";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import ChatbotWidget from "./components/ui/ChatbotWidget";
import GlobalErrorBoundary from "./components/ui/GlobalErrorBoundary";

import VideoRecordingDemo from "./components/VideoRecordingDemo";

function ChatbotWrapper() {
  // Always show in dev, or if authenticated (replace with AuthContext if needed)
  return <ChatbotWidget />;
}

function App() {
  // Use the environment key - no fallback to ensure proper configuration
  // Auth is handled via session-based AuthContext
  // Attach once at app root
  useGlobalApiErrors();
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    // Debug App render state
  }

  // One-time readiness check with toast warnings
  useEffect(() => {
    let cancelled = false;
    const fetchReadiness = async () => {
      try {
        const resp = await fetch("/api/system/readiness");
        if (!resp.ok) return;
        const data = await resp.json();
        if (cancelled) return;
        // data example: { ok: true, services: { cloudinary: { ready: true }, openai: { ready: false, reason: 'Missing key' } } }
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
      } catch (_) {
        // silent
      }
    };
    fetchReadiness();
    // Optional lightweight follow-up after 20s to catch late init
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
              <Layout>
                <Routes>
                  {/* Demo routes are now inside the sidebar layout */}
                  <Route path="/video-demo" element={<VideoRecordingDemo />} />
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/demo" element={<HybridQuestionDemo />} />
                  <Route
                    path="/coding-demo"
                    element={<CodingChallengeDemo />}
                  />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth>
                        <DashboardPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/comprehensive-dashboard"
                    element={
                      <RequireAuth>
                        <ComprehensiveDashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/interview/new"
                    element={
                      <RequireAuth>
                        <InterviewCreationPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/interview/experience"
                    element={
                      <RequireAuth>
                        <InterviewExperiencePage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/interview/:interviewId/experience"
                    element={
                      <RequireAuth>
                        <InterviewExperiencePage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/interview/:interviewId/results"
                    element={
                      <RequireAuth>
                        <InterviewResultsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/interview/:interviewId"
                    element={
                      <RequireAuth>
                        <InterviewPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/interviews"
                    element={
                      <RequireAuth>
                        <InterviewHistoryPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/questions"
                    element={
                      <RequireAuth>
                        <QuestionBankPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/questions/:categorySlug"
                    element={
                      <RequireAuth>
                        <QuestionCategoryPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RequireAuth>
                        <EnhancedSettingsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/mock-interview"
                    element={<Navigate to="/interview/new" replace />}
                  />
                  <Route
                    path="/practice"
                    element={
                      <RequireAuth>
                        <PracticePage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/resources"
                    element={
                      <RequireAuth>
                        <ResourcesPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <RequireAuth>
                        <ReportsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/scheduled"
                    element={
                      <RequireAuth>
                        <ScheduledSessionsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/session-summary/:interviewId"
                    element={
                      <RequireAuth>
                        <SessionSummaryPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/support"
                    element={
                      <RequireAuth>
                        <SupportPage />
                      </RequireAuth>
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
