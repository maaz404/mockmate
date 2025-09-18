import React from "react";

const InterviewHistoryPage = () => {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Interview History
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage your past mock interviews and their results.
          </p>
        </div>

        {/* Placeholder content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Interviews Yet
          </h3>
          <p className="text-gray-600 mb-6">
            You haven't completed any mock interviews yet. Start your first
            interview to see your history here.
          </p>
          <button className="btn-primary">Start Your First Interview</button>
        </div>
      </div>
    </div>
  );
};

export default InterviewHistoryPage;
