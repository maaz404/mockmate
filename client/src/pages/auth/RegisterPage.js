import React, { useState, useEffect } from "react";
import { SignUp, useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import AuthLoadingSpinner from "../../components/ui/AuthLoadingSpinner";

const RegisterPage = () => {
  const { isLoaded } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [showTimeout, setShowTimeout] = useState(false);
  const { theme } = useTheme();

  // Add a reasonable timeout to show content even if Clerk is slow to load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, 2000); // 2 second timeout - much shorter

    return () => clearTimeout(timer);
  }, []);

  // Detect verification status
  const emailStatus = user?.primaryEmailAddress?.verification?.status;
  const isVerified = emailStatus === "verified";
  const shouldShowSignUp = isLoaded || showTimeout;

  // When user becomes verified (and is on /register), navigate manually
  useEffect(() => {
    if (isVerified) {
      // eslint-disable-next-line no-console
      console.debug("[RegisterPage] Email verified. Navigating to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [isVerified, navigate]);

  // Poll for verification if user exists but not verified (handles separate tab verification)
  useEffect(() => {
    if (!user || isVerified) return;
    const id = setInterval(async () => {
      try {
        // eslint-disable-next-line no-console
        console.debug("[RegisterPage] polling verification status...");
        await user.reload();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[RegisterPage] reload failed", e);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [user, isVerified]);

  if (!shouldShowSignUp) {
    return <AuthLoadingSpinner message="Initializing authentication..." />;
  }
  return (
    <div className="min-h-screen bg-white dark:bg-surface-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-surface-900 dark:text-surface-50">
          Join MockMate Today
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-300">
          Start your interview preparation journey with AI-powered practice
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 dark:bg-surface-800/60 backdrop-blur-sm border border-surface-200 dark:border-surface-700 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10">
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            // Remove automatic redirect; handle manually when verified
            unsafeMetadata={{ source: "register-page" }}
            // (Clerk v5) Use localization or event listeners if needed
            // We can optionally intercept but for now rely on default. Add debug styling to see step component.
            appearance={{
              elements:
                theme === "dark"
                  ? {
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
                      formFieldSuccessText: "text-green-400",
                      formFieldErrorText: "text-red-400",
                      identityPreview: "bg-surface-700 border-surface-600",
                      otpCodeFieldInput:
                        "bg-surface-700 border-surface-600 text-white transition-all duration-200",
                      spinner: "text-primary-500",
                      formFieldAction:
                        "text-primary-400 hover:text-primary-300",
                    }
                  : {
                      formButtonPrimary:
                        "bg-primary-600 hover:bg-primary-700 text-sm normal-case font-medium rounded-lg py-3 transition-all duration-200",
                      card: "shadow-none bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "border border-surface-300 hover:bg-surface-50 bg-white text-surface-800 rounded-lg transition-all duration-200",
                      socialButtonsBlockButtonText:
                        "text-surface-800 font-medium",
                      formFieldInput:
                        "bg-white border-surface-300 text-surface-900 placeholder-surface-400 focus:ring-primary-500 focus:border-primary-500 rounded-lg transition-all duration-200",
                      footerActionLink:
                        "text-primary-600 hover:text-primary-700 transition-colors duration-200",
                      formFieldLabel: "text-surface-700",
                      formResendCodeLink:
                        "text-primary-600 hover:text-primary-700 transition-colors duration-200",
                      identityPreviewText: "text-surface-700",
                      identityPreviewEditButtonIcon: "text-surface-500",
                      formFieldSuccessText: "text-green-600",
                      formFieldErrorText: "text-red-600",
                      identityPreview: "bg-white border-surface-200",
                      otpCodeFieldInput:
                        "bg-white border-surface-300 text-surface-900 transition-all duration-200",
                      spinner: "text-primary-500",
                      formFieldAction:
                        "text-primary-600 hover:text-primary-700",
                    },
              variables:
                theme === "dark"
                  ? {
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
                    }
                  : {
                      colorPrimary: "#2563eb",
                      colorBackground: "transparent",
                      colorInputBackground: "#ffffff",
                      colorInputText: "#0f172a",
                      colorText: "#0f172a",
                      colorTextSecondary: "#475569",
                      colorNeutral: "#64748b",
                      colorSuccess: "#16a34a",
                      colorWarning: "#ea580c",
                      colorDanger: "#dc2626",
                    },
            }}
            // Instrumentation callbacks
            afterSignUp={(res) => {
              // eslint-disable-next-line no-console
              console.debug("[RegisterPage] afterSignUp callback", res);
              // Some flows persist unverified state, rely on manual redirect effect above.
            }}
            signUpStart={(ctx) => {
              // eslint-disable-next-line no-console
              console.debug("[RegisterPage] signUpStart", ctx);
            }}
            signUpComplete={(ctx) => {
              // eslint-disable-next-line no-console
              console.debug("[RegisterPage] signUpComplete", ctx);
            }}
          />
          {!isVerified && user && (
            <div className="mt-4 text-center text-xs text-surface-500 dark:text-surface-400">
              Status: {emailStatus || "unknown"} (waiting for verification)
            </div>
          )}
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-surface-600 dark:text-surface-300">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Sign in here
            </a>
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-8 bg-surface-50 dark:bg-surface-800/40 backdrop-blur-sm border border-surface-200 dark:border-surface-700 rounded-xl p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4 text-center">
            What you'll get with MockMate:
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-surface-600 dark:text-surface-300 text-sm">
                AI-powered interview questions
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-surface-600 dark:text-surface-300 text-sm">
                Real-time feedback and analysis
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-surface-600 dark:text-surface-300 text-sm">
                Progress tracking and insights
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-surface-600 dark:text-surface-300 text-sm">
                Industry-specific practice sessions
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
