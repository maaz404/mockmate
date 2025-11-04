import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

/**
 * EmailVerificationGate - Ensures user has verified their email before accessing content
 * Only applies to email/password users (Google OAuth users are auto-verified)
 */
const EmailVerificationGate = ({ children }) => {
  const { user, isLoaded } = useAuthContext();
  const navigate = useNavigate();

  // Still loading auth state
  if (!isLoaded || !user) {
    return null;
  }

  // Google OAuth users are auto-verified, skip check
  if (user.authProvider === "google") {
    return children;
  }

  // Email/password users need verification
  if (!user.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-surface-800 shadow-xl rounded-xl p-8 border border-surface-200 dark:border-surface-700">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Heading */}
            <h3 className="mt-4 text-center text-xl font-semibold text-surface-900 dark:text-surface-50">
              Verify your email
            </h3>

            {/* Message */}
            <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
              Please verify your email address to access this content. We've
              sent a verification link to{" "}
              <span className="font-semibold text-surface-900 dark:text-surface-50">
                {user.email}
              </span>
            </p>

            {/* Instructions */}
            <div className="mt-6 bg-surface-50 dark:bg-surface-900/50 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
              <p className="text-sm text-surface-700 dark:text-surface-300">
                <strong>Didn't receive the email?</strong>
              </p>
              <ul className="mt-2 text-sm text-surface-600 dark:text-surface-400 space-y-1">
                <li>• Check your spam folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Wait a few minutes and refresh this page</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                I've verified my email
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-surface-300 dark:border-surface-600 text-sm font-medium rounded-lg shadow-sm text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>

            {/* Support Link */}
            <p className="mt-6 text-center text-xs text-surface-500 dark:text-surface-500">
              Need help?{" "}
              <a
                href="mailto:support@mockmate.com"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is verified, render children
  return children;
};

export default EmailVerificationGate;
