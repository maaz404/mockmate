import React from "react";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useAuthContext } from "../../context/AuthContext";

/**
 * Protected Route component that wraps pages requiring authentication
 * Redirects to sign-in if user is not authenticated
 * Shows loading spinner while checking authentication status
 */
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuthContext();

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
    window.location.href = "/login";
    return null;
  }

  // Render protected content if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
