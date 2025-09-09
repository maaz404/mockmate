import React from "react";

const InterviewPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Interview Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Software Engineer Interview</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Question 1 of 10</span>
              <span className="text-sm text-gray-400">15:30</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: "10%" }}
            ></div>
          </div>
        </div>

        {/* Interview Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <div className="space-y-4">
            <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-gray-500 mx-auto mb-4"
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
                <p className="text-gray-500">Camera will activate here</p>
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex justify-center space-x-4">
              <button className="bg-red-600 hover:bg-red-700 p-4 rounded-full transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 p-4 rounded-full transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Question Section */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-primary-400">
                Current Question
              </h2>
              <p className="text-lg leading-relaxed">
                Tell me about a challenging project you worked on recently. How
                did you approach the problem, and what was the outcome?
              </p>
            </div>

            {/* Response Area */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-primary-400">
                Your Response
              </h3>
              <textarea
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Take notes or outline your response here..."
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 px-6 rounded-lg font-medium transition-colors">
                Previous
              </button>
              <button className="flex-1 bg-primary-600 hover:bg-primary-700 py-3 px-6 rounded-lg font-medium transition-colors">
                Next Question
              </button>
            </div>

            {/* Additional Controls */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Interview Settings</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Facial Expression Analysis</span>
                  <button className="bg-primary-600 w-12 h-6 rounded-full p-1">
                    <div className="bg-white w-4 h-4 rounded-full transform translate-x-6"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audio Recording</span>
                  <button className="bg-primary-600 w-12 h-6 rounded-full p-1">
                    <div className="bg-white w-4 h-4 rounded-full transform translate-x-6"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Question Audio</span>
                  <button className="bg-gray-600 w-12 h-6 rounded-full p-1">
                    <div className="bg-white w-4 h-4 rounded-full"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exit Button */}
        <div className="mt-8 text-center">
          <button className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium transition-colors">
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
