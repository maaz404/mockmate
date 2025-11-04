import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuthContext();
  const [error, setError] = useState(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessedRef.current) {
      console.log("⏭️ Already processed OAuth callback, skipping...");
      return;
    }

    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const errorParam = searchParams.get("error");

    console.log("🔵 OAuth Callback Page loaded");
    console.log("📋 Token:", token ? "✅ Present" : "❌ Missing");
    console.log(
      "📋 Refresh Token:",
      refreshToken ? "✅ Present" : "❌ Missing"
    );
    console.log("📋 Error:", errorParam || "None");

    if (errorParam) {
      console.error("❌ OAuth error:", errorParam);
      setError(errorParam);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
      return;
    }

    if (token && refreshToken) {
      hasProcessedRef.current = true;
      console.log("✅ Tokens found, calling handleOAuthCallback");
      handleOAuthCallback(token, refreshToken);
    } else {
      console.error("❌ Missing tokens in OAuth callback");
      setError("Invalid OAuth response - missing tokens");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    }
  }, [searchParams, navigate, handleOAuthCallback]);

  if (error) {
    const errorMessages = {
      oauth_failed: "Google authentication failed",
      no_user: "Failed to create user account",
      callback_error: "An error occurred during authentication",
      oauth_not_configured: "Google OAuth is not configured",
    };

    const errorMessage = errorMessages[error] || error;

    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Authentication Failed
          </h2>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
            {errorMessage}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-500">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
        <p className="mt-6 text-lg font-medium text-surface-700 dark:text-surface-300">
          Completing sign in...
        </p>
        <p className="mt-2 text-sm text-surface-500 dark:text-surface-500">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
