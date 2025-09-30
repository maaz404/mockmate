import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoRecorder from "../components/VideoRecorder";
import toast from "react-hot-toast";
import { apiService } from "../services/api";

const InterviewPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes total
  const [settings, setSettings] = useState({
    videoRecording: true,
    audioRecording: true,
    questionAudio: false,
  });

  // End interview
  const handleEndInterview = useCallback(() => {
    // In a real app, save responses and navigate to results
    toast.success("Interview completed!");
    navigate(`/interview/${interviewId}/results`);
  }, [navigate, interviewId]);

  // Fetch interview data on component mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(`/interviews/${interviewId}`);

        if (response.success) {
          setInterview(response.data);
          // Set initial time remaining based on interview duration (convert minutes to seconds)
          setTimeRemaining((response.data.config.duration || 30) * 60);
        } else {
          setError("Failed to load interview");
        }
      } catch (err) {
        setError("Failed to load interview");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleEndInterview]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle video uploaded
  const handleVideoUploaded = (questionIndex) => {
    setInterview((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === questionIndex ? { ...q, hasVideo: true } : q
      ),
    }));
    toast.success("Video uploaded successfully!");
  };

  // Handle response change
  const handleResponseChange = (value) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestionIndex]: value,
    }));
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleEndInterview();
    }
  };

  // Toggle setting
  const toggleSetting = (setting) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-surface-50">Loading interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-50 mb-4">
            Interview Not Found
          </h2>
          <p className="text-surface-400 mb-6">
            {error || "Unable to load interview"}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Now it's safe to access interview data
  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / interview.questions.length) * 100;

  return (
    <div className="min-h-screen bg-surface-900 text-surface-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Interview Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              {interview.config.jobRole} Interview
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-surface-400">
                Question {currentQuestionIndex + 1} of{" "}
                {interview.questions.length}
              </span>
              <span className="text-sm text-surface-400">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          <div className="w-full bg-surface-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Interview Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <div className="space-y-4">
            {settings.videoRecording ? (
              <VideoRecorder
                interviewId={interview._id}
                currentQuestionIndex={currentQuestionIndex}
                onVideoUploaded={handleVideoUploaded}
              />
            ) : (
              <div className="bg-surface-800 rounded-lg aspect-video flex items-center justify-center border border-surface-700">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-surface-400 mx-auto mb-4"
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
                  <p className="text-surface-400">
                    Video recording is disabled
                  </p>
                </div>
              </div>
            )}

            {/* Video Status */}
            {currentQuestion.hasVideo && (
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 text-center">
                <svg
                  className="w-5 h-5 text-green-400 mx-auto mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-green-400 text-sm">
                  Video recorded for this question
                </p>
              </div>
            )}
          </div>

          {/* Question Section */}
          <div className="space-y-6">
            <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-primary-400">
                  Current Question
                </h2>
                <div className="text-right text-sm">
                  <span className="text-surface-400">Category: </span>
                  <span className="text-primary-400">
                    {currentQuestion.category}
                  </span>
                  <br />
                  <span className="text-surface-400">Difficulty: </span>
                  <span className="text-yellow-400">
                    {currentQuestion.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-lg leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Response Area */}
            <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">
                Your Response Notes
              </h3>
              <textarea
                value={responses[currentQuestionIndex] || ""}
                onChange={(e) => handleResponseChange(e.target.value)}
                className="w-full h-32 bg-surface-700 border border-surface-600 rounded-lg p-4 text-surface-50 placeholder-surface-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Take notes or outline your response here..."
              />
              <p className="text-sm text-surface-400 mt-2">
                These notes are for your reference. Your video response is the
                main submission.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex-1 bg-surface-600 hover:bg-surface-700 disabled:bg-surface-800 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-primary-600 hover:bg-primary-700 py-3 px-6 rounded-lg font-medium transition-colors"
              >
                {currentQuestionIndex === interview.questions.length - 1
                  ? "Finish Interview"
                  : "Next Question"}
              </button>
            </div>

            {/* Interview Settings */}
            <div className="bg-surface-800 rounded-lg p-4 border border-surface-700">
              <h4 className="font-medium mb-3">Interview Settings</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Video Recording</span>
                  <button
                    onClick={() => toggleSetting("videoRecording")}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      settings.videoRecording
                        ? "bg-primary-600"
                        : "bg-surface-600"
                    }`}
                  >
                    <div
                      className={`bg-white dark:bg-surface-100 w-4 h-4 rounded-full transition-transform ${
                        settings.videoRecording ? "transform translate-x-6" : ""
                      }`}
                    ></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audio Recording</span>
                  <button
                    onClick={() => toggleSetting("audioRecording")}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      settings.audioRecording
                        ? "bg-primary-600"
                        : "bg-surface-600"
                    }`}
                  >
                    <div
                      className={`bg-white dark:bg-surface-100 w-4 h-4 rounded-full transition-transform ${
                        settings.audioRecording ? "transform translate-x-6" : ""
                      }`}
                    ></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Question Audio</span>
                  <button
                    onClick={() => toggleSetting("questionAudio")}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      settings.questionAudio
                        ? "bg-primary-600"
                        : "bg-surface-600"
                    }`}
                  >
                    <div
                      className={`bg-white dark:bg-surface-100 w-4 h-4 rounded-full transition-transform ${
                        settings.questionAudio ? "transform translate-x-6" : ""
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleEndInterview}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
