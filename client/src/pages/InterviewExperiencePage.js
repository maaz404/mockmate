import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { apiService } from "../services/api";

const InterviewExperiencePage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Function to fetch interview data
  const fetchInterview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/interviews/${interviewId}`);
      if (response.success) {
        setInterview(response.data);
        setTimeRemaining(response.data.duration * 60); // Convert to seconds

        // Initialize answers object
        const initialAnswers = {};
        response.data.questions.forEach((q) => {
          initialAnswers[q._id] = "";
        });
        setAnswers(initialAnswers);
      } else {
        throw new Error("Failed to fetch interview");
      }
    } catch (error) {
      // Error fetching interview data
      alert("Failed to load interview. Redirecting to dashboard.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [interviewId, navigate]);

  const handleSaveAnswer = useCallback(() => {
    if (interview && interview.questions[currentQuestionIndex]) {
      const questionId = interview.questions[currentQuestionIndex]._id;
      setAnswers((prev) => ({
        ...prev,
        [questionId]: currentAnswer,
      }));
    }
  }, [interview, currentQuestionIndex, currentAnswer]);

  const handleInterviewComplete = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      
      // Save current answer before submitting
      handleSaveAnswer();

      const response = await apiService.post(`/interviews/${interviewId}/submit`, {
        answers,
        timeTaken: interview?.duration * 60 - timeRemaining,
      });

      if (response.success) {
        navigate(`/interview/${interviewId}/results`);
      } else {
        throw new Error("Failed to submit interview");
      }
    } catch (error) {
      // Error submitting interview
      alert("Failed to submit interview. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [interviewId, answers, interview, timeRemaining, navigate, submitting, handleSaveAnswer]);

  // Timer functionality
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      // Auto-submit when time runs out
      handleInterviewComplete();
    }
  }, [timeRemaining, handleInterviewComplete]);

  // Fetch interview data
  useEffect(() => {
    if (isLoaded && user && interviewId) {
      fetchInterview();
    }
  }, [isLoaded, user, interviewId, fetchInterview]);

  const handleAnswerChange = (e) => {
    setCurrentAnswer(e.target.value);
  };

  const handleNextQuestion = () => {
    handleSaveAnswer();
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const nextQuestionId = interview.questions[currentQuestionIndex + 1]._id;
      setCurrentAnswer(answers[nextQuestionId] || "");
    }
  };

  const handlePreviousQuestion = () => {
    handleSaveAnswer();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQuestionId = interview.questions[currentQuestionIndex - 1]._id;
      setCurrentAnswer(answers[prevQuestionId] || "");
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    if (!interview?.questions.length) return 0;
    return Math.round(
      ((currentQuestionIndex + 1) / interview.questions.length) * 100
    );
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Interview not found
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

  const currentQuestion = interview.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress and Timer */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                {interview.jobRole} Interview
              </h1>
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of{" "}
                {interview.questions.length}
              </span>
            </div>

            <div className="flex items-center space-x-6">
              {/* Progress Bar */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Progress:</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {getProgressPercentage()}%
                </span>
              </div>

              {/* Timer */}
              <div
                className={`text-lg font-mono font-bold px-3 py-1 rounded ${
                  timeRemaining < 300
                    ? "text-red-600 bg-red-100"
                    : "text-blue-600 bg-blue-100"
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentQuestion.type === "technical"
                      ? "bg-blue-100 text-blue-800"
                      : currentQuestion.type === "behavioral"
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {currentQuestion.type.charAt(0).toUpperCase() +
                    currentQuestion.type.slice(1)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentQuestion.difficulty === "easy"
                      ? "bg-green-100 text-green-800"
                      : currentQuestion.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {currentQuestion.difficulty.charAt(0).toUpperCase() +
                    currentQuestion.difficulty.slice(1)}
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentQuestion.text}
            </h2>

            {currentQuestion.context && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Context:</h4>
                <p className="text-gray-700">{currentQuestion.context}</p>
              </div>
            )}
          </div>

          {/* Answer Section */}
          <div className="mb-8">
            <label
              htmlFor="answer"
              className="block text-lg font-medium text-gray-900 mb-4"
            >
              Your Answer:
            </label>

            {currentQuestion.type === "technical" &&
            currentQuestion.category === "coding" ? (
              <div className="space-y-4">
                <textarea
                  id="answer"
                  value={currentAnswer}
                  onChange={handleAnswerChange}
                  placeholder="Write your code solution here..."
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                  style={{ fontFamily: "Monaco, Menlo, monospace" }}
                />
                <p className="text-sm text-gray-600">
                  💡 Tip: Explain your thought process and consider edge cases
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  id="answer"
                  value={currentAnswer}
                  onChange={handleAnswerChange}
                  placeholder="Provide your detailed answer here..."
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-sm text-gray-600">
                  💡 Tip: Use the STAR method (Situation, Task, Action, Result)
                  for behavioral questions
                </p>
              </div>
            )}

            {/* Voice Recording Option */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Voice Response (Optional)
                  </h4>
                  <p className="text-sm text-gray-600">
                    Practice speaking your answer out loud
                  </p>
                </div>
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isRecording
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isRecording ? "🎙️ Stop Recording" : "🎤 Start Recording"}
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="flex space-x-4">
              <button
                onClick={handleSaveAnswer}
                className="px-6 py-3 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
              >
                💾 Save Answer
              </button>

              {currentQuestionIndex === interview.questions.length - 1 ? (
                <button
                  onClick={handleInterviewComplete}
                  disabled={submitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "🎯 Complete Interview"}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {/* Question Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {interview.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  handleSaveAnswer();
                  setCurrentQuestionIndex(index);
                  const questionId = interview.questions[index]._id;
                  setCurrentAnswer(answers[questionId] || "");
                }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentQuestionIndex
                    ? "bg-blue-600"
                    : answers[interview.questions[index]._id]
                    ? "bg-green-400"
                    : "bg-gray-300"
                }`}
                title={`Question ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewExperiencePage;
