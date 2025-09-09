import React from "react";
import { format } from "date-fns";

const RecentInterviews = ({ interviews, onViewAll }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "abandoned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Interviews
          </h3>
          {interviews.length > 0 && (
            <button
              onClick={onViewAll}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View all
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {interviews.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <p className="text-gray-500 mb-2">No interviews yet</p>
            <p className="text-sm text-gray-400">
              Start your first practice session!
            </p>
          </div>
        ) : (
          interviews.map((interview) => (
            <div
              key={interview._id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-gray-900">
                      {interview.config.jobRole}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        interview.status
                      )}`}
                    >
                      {interview.status}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="capitalize">
                      {interview.config.interviewType}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{interview.config.difficulty}</span>
                    <span className="mx-2">•</span>
                    <span>
                      {format(new Date(interview.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>

                  {interview.status === "completed" &&
                    interview.results?.overallScore && (
                      <div className="mt-2 flex items-center">
                        <span className="text-sm text-gray-600 mr-2">
                          Score:
                        </span>
                        <span
                          className={`text-sm font-medium ${getPerformanceColor(
                            interview.results.overallScore
                          )}`}
                        >
                          {interview.results.overallScore}%
                        </span>
                      </div>
                    )}
                </div>

                <div className="ml-4 flex-shrink-0">
                  {interview.status === "completed" ? (
                    <div className="text-green-400">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : interview.status === "in-progress" ? (
                    <div className="text-blue-400">
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentInterviews;
