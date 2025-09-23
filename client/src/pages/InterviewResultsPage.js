import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { apiService } from "../services/api";
import TranscriptDisplay from "../components/TranscriptDisplay";

const InterviewResultsPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get(
        `/interviews/${interviewId}/results`
      );
      if (response.success) {
        setResults(response.data);
      } else {
        throw new Error("Failed to fetch results");
      }
    } catch (error) {
      // Error fetching results
      alert("Failed to load results. Redirecting to dashboard.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [interviewId, navigate]);

  useEffect(() => {
    if (isLoaded && user && interviewId) {
      fetchResults();
    }
  }, [isLoaded, user, interviewId, fetchResults]);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Results not available
          </h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { interview, analysis } = results;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div className="text-6xl">🎉</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Interview Complete!
                </h1>
                <p className="text-gray-600 mt-2">
                  {interview.jobRole} • {interview.interviewType} interview
                </p>
              </div>
            </div>

            {/* Overall Score */}
            <div
              className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${getScoreBgColor(
                analysis.overallScore
              )} ${getScoreColor(analysis.overallScore)}`}
            >
              Overall Score: {analysis.overallScore}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Detailed Analysis */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Performance Breakdown
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${getScoreColor(
                      analysis.technicalScore
                    )}`}
                  >
                    {analysis.technicalScore}%
                  </div>
                  <div className="text-gray-600 font-medium">
                    Technical Skills
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        analysis.technicalScore >= 80
                          ? "bg-green-500"
                          : analysis.technicalScore >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.technicalScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${getScoreColor(
                      analysis.communicationScore
                    )}`}
                  >
                    {analysis.communicationScore}%
                  </div>
                  <div className="text-gray-600 font-medium">Communication</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        analysis.communicationScore >= 80
                          ? "bg-green-500"
                          : analysis.communicationScore >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.communicationScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${getScoreColor(
                      analysis.problemSolvingScore
                    )}`}
                  >
                    {analysis.problemSolvingScore}%
                  </div>
                  <div className="text-gray-600 font-medium">
                    Problem Solving
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        analysis.problemSolvingScore >= 80
                          ? "bg-green-500"
                          : analysis.problemSolvingScore >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.problemSolvingScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Question by Question Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Question Analysis
              </h3>

              <div className="space-y-6">
                {analysis.questionAnalysis.map((qa, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Question {index + 1}
                        </h4>
                        <p className="text-gray-700 text-sm mb-2">
                          {qa.question}
                        </p>
                        <div className="flex space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              qa.type === "technical"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {qa.type}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              qa.difficulty === "easy"
                                ? "bg-green-100 text-green-800"
                                : qa.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {qa.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`text-2xl font-bold ${getScoreColor(
                            qa.score
                          )}`}
                        >
                          {qa.score}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {qa.timeSpent}s
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Your Answer:
                      </h5>
                      <p className="text-gray-700 text-sm">{qa.userAnswer}</p>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <h5 className="font-medium text-green-800 mb-1">
                          ✅ Strengths:
                        </h5>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {qa.feedback.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium text-red-800 mb-1">
                          ❌ Areas for Improvement:
                        </h5>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {qa.feedback.improvements.map((improvement, i) => (
                            <li key={i}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Video Transcript Section */}
                    <div className="mt-4">
                      <TranscriptDisplay 
                        interviewId={interviewId}
                        questionIndex={index}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Interview Stats
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {Math.floor(interview.duration / 60)}m{" "}
                    {interview.duration % 60}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-medium">
                    {interview.questions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium">
                    {new Date(interview.completedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">
                    {interview.interviewType}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Recommendations */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Key Recommendations
              </h3>

              <div className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Development */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Focus Areas
              </h3>

              <div className="space-y-3">
                {analysis.focusAreas.map((area, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {area.skill}
                      </div>
                      <div className="text-xs text-gray-600">
                        {area.priority} priority
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        area.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : area.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {area.currentLevel}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Next Steps
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/interview/create")}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🎯 Start New Interview
                </button>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full px-4 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  📊 View Dashboard
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full px-4 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  📄 Print Results
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResultsPage;
