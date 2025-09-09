import React, { useEffect, useState } from "react";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

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
      // eslint-disable-next-line no-console
      console.log("✅ User is signed in, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, userId, navigate]);

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            Initializing authentication...
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-2 bg-yellow-100 rounded text-xs">
              <strong>Debug:</strong> Clerk Key: {debugInfo?.clerkKey}...
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to MockMate
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to your interview preparation journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignIn
            afterSignInUrl="/dashboard"
            signUpUrl="/register"
            routing="path"
            path="/login"
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-primary-600 hover:bg-primary-700 text-sm normal-case",
                card: "shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-gray-300 hover:bg-gray-50",
                socialButtonsBlockButtonText: "text-gray-700 font-medium",
                formFieldInput:
                  "border-gray-300 focus:ring-primary-500 focus:border-primary-500",
                footerActionLink: "text-primary-600 hover:text-primary-500",
              },
            }}
          />

          {/* Development debug info */}
          {process.env.NODE_ENV === "development" && debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
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
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Sign up for free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
