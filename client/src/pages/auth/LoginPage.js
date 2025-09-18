import React, { useEffect, useState } from "react";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import AuthLoadingSpinner from "../../components/ui/AuthLoadingSpinner";

const LoginPage = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    // Debug information
    setDebugInfo({
      isLoaded,
      isSignedIn,
      userId,
      clerkKey: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY?.substring(0, 20),
      timestamp: new Date().toISOString(),
    });

    // Redirect if already signed in
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, userId, navigate]);

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <AuthLoadingSpinner message="Initializing authentication..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          Sign in to MockMate
        </h2>
        <p className="mt-2 text-center text-sm text-surface-300">
          Welcome back to your interview preparation journey
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-800/50 backdrop-blur-sm border border-surface-700 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10">
          <SignIn
            afterSignInUrl="/dashboard"
            signUpUrl="/register"
            routing="path"
            path="/login"
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-primary-600 hover:bg-primary-700 text-sm normal-case font-medium rounded-lg py-3 transition-all duration-200",
                card: "shadow-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-surface-600 hover:bg-surface-700 bg-surface-800 text-white rounded-lg transition-all duration-200",
                socialButtonsBlockButtonText: "text-white font-medium",
                formFieldInput:
                  "bg-surface-700 border-surface-600 text-white placeholder-surface-400 focus:ring-primary-500 focus:border-primary-500 rounded-lg transition-all duration-200",
                footerActionLink:
                  "text-primary-400 hover:text-primary-300 transition-colors duration-200",
                formFieldLabel: "text-surface-200",
                formResendCodeLink:
                  "text-primary-400 hover:text-primary-300 transition-colors duration-200",
                identityPreviewText: "text-surface-300",
                identityPreviewEditButtonIcon: "text-surface-400",
                spinner: "text-primary-500",
                formFieldAction: "text-primary-400 hover:text-primary-300",
              },
              variables: {
                colorPrimary: "#3b82f6",
                colorBackground: "transparent",
                colorInputBackground: "#334155",
                colorInputText: "#ffffff",
                colorText: "#ffffff",
                colorTextSecondary: "#cbd5e1",
                colorNeutral: "#64748b",
                colorSuccess: "#10b981",
                colorWarning: "#f59e0b",
                colorDanger: "#ef4444",
              },
            }}
          />

          {/* Development debug info */}
          {process.env.NODE_ENV === "development" && debugInfo && (
            <div className="mt-4 p-3 bg-surface-800 border border-surface-700 rounded text-xs text-surface-300">
              <strong>Debug Info:</strong>
              <br />
              Loaded: {debugInfo.isLoaded ? "✅" : "❌"}
              <br />
              Signed In: {debugInfo.isSignedIn ? "✅" : "❌"}
              <br />
              User ID: {debugInfo.userId || "None"}
              <br />
              Time: {debugInfo.timestamp}
            </div>
          )}
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-surface-300">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
