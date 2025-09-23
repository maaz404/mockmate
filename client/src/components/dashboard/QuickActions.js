import React from "react";

const QuickActions = ({ onStartInterview, userProfile }) => {
  const interviewTypes = [
    {
      type: "technical",
      title: "Technical Interview",
      description: "Practice coding and technical questions",
      icon: "💻",
      color: "bg-primary-500 hover:bg-primary-600",
    },
    {
      type: "behavioral",
      title: "Behavioral Interview",
      description: "Work on soft skills and situational questions",
      icon: "🗣️",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      type: "system-design",
      title: "System Design",
      description: "Practice architecture and design problems",
      icon: "🏗️",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      type: "mixed",
      title: "Mixed Interview",
      description: "Combination of technical and behavioral",
      icon: "🎯",
      color: "bg-accent-500 hover:bg-accent-600",
    },
  ];

  const isProfileComplete = userProfile?.profileCompleteness >= 70;

  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700">
      <div className="p-6 border-b border-surface-700">
        <h3 className="text-lg font-medium text-white">Quick Start</h3>
        <p className="text-sm text-surface-400 mt-1">
          Jump into a practice session
        </p>
      </div>

      {!isProfileComplete && (
        <div className="p-6 bg-yellow-500/10 border-b border-surface-700 backdrop-blur-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-300">
                Complete your profile for better recommendations
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Add your experience, skills, and preferences to get personalized
                interview questions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviewTypes.map((interview) => (
            <button
              key={interview.type}
              onClick={() => onStartInterview(interview.type)}
              className="group relative bg-surface-700/50 backdrop-blur-sm border border-surface-600 rounded-xl p-6 hover:shadow-glow hover:bg-surface-700/70 hover:border-primary-500/50 transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-800"
              disabled={!userProfile?.onboardingCompleted}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl filter group-hover:brightness-110 transition-all duration-300">{interview.icon}</span>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-base font-medium text-white group-hover:text-primary-300 transition-colors">
                    {interview.title}
                  </h4>
                  <p className="text-sm text-surface-400 mt-1 group-hover:text-surface-300 transition-colors">
                    {interview.description}
                  </p>
                </div>
              </div>

              {!userProfile?.onboardingCompleted && (
                <div className="absolute inset-0 bg-surface-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-sm text-surface-300 font-medium">
                    Complete onboarding first
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center text-sm text-primary-400 group-hover:text-primary-300 transition-colors">
                <span>Start practice</span>
                <svg
                  className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Interview Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            disabled={!userProfile?.onboardingCompleted}
          >
            Create Custom Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
