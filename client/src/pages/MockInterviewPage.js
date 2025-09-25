import React from "react";

const MockInterviewPage = () => {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            Mock Interview Practice
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Quick practice sessions with instant feedback.
          </p>
        </div>

        <div className="card text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-4">
            Start Quick Practice Session
          </h3>
          <p className="text-surface-600 dark:text-surface-400 mb-8">
            Practice with random questions and get instant AI feedback to
            improve your interview skills.
          </p>
          <button className="btn-primary text-lg px-8 py-3">
            Start Practice
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockInterviewPage;
