import React from "react";
import { SignUp, useAuth } from "@clerk/clerk-react";
import AuthLoadingSpinner from "../../components/ui/AuthLoadingSpinner";

const RegisterPage = () => {
  const { isLoaded } = useAuth();

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <AuthLoadingSpinner message="Setting up your account..." />;
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
          Join MockMate Today
        </h2>
        <p className="mt-2 text-center text-sm text-surface-300">
          Start your interview preparation journey with AI-powered practice
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-800/50 backdrop-blur-sm border border-surface-700 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10">
          <SignUp
            afterSignUpUrl="/dashboard"
            signInUrl="/login"
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
                formFieldSuccessText: "text-green-400",
                formFieldErrorText: "text-red-400",
                identityPreview: "bg-surface-700 border-surface-600",
                otpCodeFieldInput:
                  "bg-surface-700 border-surface-600 text-white transition-all duration-200",
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
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-surface-300">
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
        <div className="mt-8 bg-surface-800/30 backdrop-blur-sm border border-surface-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            What you'll get with MockMate:
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-surface-300 text-sm">
                AI-powered interview questions
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-surface-300 text-sm">
                Real-time feedback and analysis
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-surface-300 text-sm">
                Progress tracking and insights
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-surface-300 text-sm">
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
