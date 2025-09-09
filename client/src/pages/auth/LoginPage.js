import React from "react";
import { SignIn } from "@clerk/clerk-react";

const LoginPage = () => {
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
                  "border border-gray-300 focus:border-primary-500 focus:ring-primary-500",
                footerActionLink: "text-primary-600 hover:text-primary-500",
              },
            }}
          />
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
