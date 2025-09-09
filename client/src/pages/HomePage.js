import React from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const HomePage = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Ace Your Next Interview with AI
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-fade-in animation-delay-200">
            MockMate helps you prepare for job interviews with AI-powered
            practice sessions, real-time feedback, and comprehensive performance
            analysis.
          </p>

          {/* Different CTAs for signed in/out users */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animation-delay-400">
            <SignedOut>
              <Link
                to="/register"
                className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg"
              >
                Start Free Trial
              </Link>
              <a
                href="#features"
                className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-primary-600 transition-all duration-200"
              >
                Learn More
              </a>
            </SignedOut>

            <SignedIn>
              <div className="mb-4">
                <p className="text-blue-100 mb-4">
                  Welcome back, {user?.firstName}! Ready to continue your
                  interview prep?
                </p>
              </div>
              <Link
                to="/dashboard"
                className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg"
              >
                Go to Dashboard
              </Link>
              <button className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-primary-600 transition-all duration-200">
                Start New Interview
              </button>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose MockMate?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform provides comprehensive interview
              preparation tailored to your specific needs and career goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI-Generated Questions
              </h3>
              <p className="text-gray-600">
                Get personalized interview questions based on your role,
                experience level, and industry requirements.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Video Practice
              </h3>
              <p className="text-gray-600">
                Practice with webcam recording and get feedback on your body
                language, facial expressions, and overall presentation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibent text-gray-900 mb-2">
                Detailed Analytics
              </h3>
              <p className="text-gray-600">
                Receive comprehensive performance reports with actionable
                insights to improve your interview skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User-specific sections */}
      <SignedIn>
        {/* Quick Start for Logged-in Users */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Continue Your Journey, {user?.firstName}! 🚀
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Pick up where you left off and improve your interview skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
                View Dashboard
              </Link>
              <button className="btn-secondary text-lg px-8 py-3">
                Start Practice Session
              </button>
            </div>
          </div>
        </section>
      </SignedIn>

      <SignedOut>
        {/* CTA Section for Guest Users */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of candidates who have improved their interview
              skills with MockMate.
            </p>
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Start Your Free Trial Today
            </Link>
          </div>
        </section>
      </SignedOut>
    </div>
  );
};

export default HomePage;
