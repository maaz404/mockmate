import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Import components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ComprehensiveDashboard from './pages/ComprehensiveDashboard';
import InterviewCreationPage from './pages/InterviewCreationPage';
import InterviewExperiencePage from './pages/InterviewExperiencePage';
import InterviewResultsPage from './pages/InterviewResultsPage';
import InterviewPage from './pages/InterviewPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Get the Clerk publishable key
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Check if Clerk key is valid (not placeholder)
const isValidClerkKey =
  clerkPubKey &&
  clerkPubKey !== 'pk_test_your_publishable_key_here' &&
  clerkPubKey !== 'pk_test_cmVhbC1rZXktcGxhY2Vob2xkZXI.mockmate_development' &&
  !clerkPubKey.includes('placeholder');

function App() {
  // Use test key if no valid key is found
  const testClerkKey = "pk_test_dGVuZGVyLWRydW0tNC5jbGVyay5hY2NvdW50cy5kZXYk";
  const clerkKey = isValidClerkKey ? clerkPubKey : testClerkKey;
  
  return (
    <ClerkProvider 
      publishableKey={clerkKey}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-1">
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
                  path="/interview/new"
                  element={
                    <ProtectedRoute>
                      <InterviewCreationPage />
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
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </ClerkProvider>
  );
}

export default App;
