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
import SupportPage from "./pages/SupportPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Get the Clerk publishable key
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Check if Clerk key is valid (not placeholder)
const isValidClerkKey =
  clerkPubKey &&
  clerkPubKey !== "pk_test_your_publishable_key_here" &&
  clerkPubKey !== "pk_test_cmVhbC1rZXktcGxhY2Vob2xkZXI.mockmate_development" &&
  !clerkPubKey.includes("placeholder") &&
  !clerkPubKey.includes("your_clerk");

function App() {
  // Use production or development key
  const clerkKey = isValidClerkKey
    ? clerkPubKey
    : "pk_test_dGVuZGVyLWRydW0tNC5jbGVyay5hY2NvdW50cy5kZXYk";

  if (!clerkKey) {
    throw new Error(
      "Clerk publishable key is required. Please add REACT_APP_CLERK_PUBLISHABLE_KEY to your .env file."
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#2563eb",
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

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
                path="/interview/create"
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
