import React from "react";
import { useAuth, RedirectToSignIn } from "@clerk/clerk-react";
import LoadingSpinner from "../ui/LoadingSpinner";
import EmailVerificationGate from "./EmailVerificationGate";

/**
 * Protected Route component that wraps pages requiring authentication
 * Redirects to sign-in if user is not authenticated
 * Shows loading spinner while checking authentication status
 */
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while authentication state is being determined
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900">
        <RedirectToSignIn signInUrl="/login" />
      </div>
    );
  }

  // Render protected content if authenticated
  return <EmailVerificationGate>{children}</EmailVerificationGate>;
};

export default ProtectedRoute;
