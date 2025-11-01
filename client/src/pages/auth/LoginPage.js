import React, { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import AuthLoadingSpinner from "../../components/ui/AuthLoadingSpinner";
import { useAuthContext } from "../../context/AuthContext";

const LoginPage = () => {
  const { isLoaded, isSignedIn, signInWithGoogle } = useAuthContext();
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    // Redirect if already signed in
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Show the SignIn component if Clerk is loaded OR after timeout
  const shouldShowSignIn = isLoaded;

  if (!shouldShowSignIn) {
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
        <h2 className="font-heading mt-6 text-center text-3xl font-bold text-surface-900 dark:text-surface-50">
          Sign in to MockMate
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-300">
          Welcome back to your interview preparation journey
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 dark:bg-surface-800/60 backdrop-blur-sm border border-surface-200 dark:border-surface-700 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10">
          {/* Debug info for development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Development Mode:</strong> Clerk OAuth may require
                proper dashboard configuration.
                <br />
                Check:{" "}
                <a
                  href="https://clerk.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Clerk Dashboard
                </a>{" "}
                → Social Connections → Enable Google
              </p>
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              theme === "dark"
                ? "bg-surface-800 hover:bg-surface-700 text-white border border-surface-600"
                : "bg-white hover:bg-surface-100 text-surface-800 border border-surface-300"
            }`}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-surface-600 dark:text-surface-300">
            Trouble signing in? Contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
