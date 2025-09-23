import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoRecorder from "../components/VideoRecorder";
import toast from "react-hot-toast";

const InterviewPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  
  // Mock data - in a real app this would come from API
  const [interview, setInterview] = useState({
    _id: interviewId || "mock-interview-id",
    config: {
      jobRole: "Software Engineer",
      questionCount: 10,
      duration: 60
    },
    questions: [
      {
        questionText: "Tell me about a challenging project you worked on recently. How did you approach the problem, and what was the outcome?",
        category: "Behavioral",
        difficulty: "Intermediate",
        timeAllocated: 300, // 5 minutes
        hasVideo: false
      },
      {
        questionText: "Describe your experience with React and how you would optimize a React application for performance.",
        category: "Technical",
        difficulty: "Intermediate", 
        timeAllocated: 420, // 7 minutes
        hasVideo: false
      },
      {
        questionText: "How do you handle conflict within a team when working on a software project?",
        category: "Behavioral",
        difficulty: "Intermediate",
        timeAllocated: 300, // 5 minutes
        hasVideo: false
      }
    ],
    status: "in-progress"
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes total
  const [settings, setSettings] = useState({
    videoRecording: true,
    audioRecording: true,
    questionAudio: false
  });

  // End interview
  const handleEndInterview = useCallback(() => {
    // In a real app, save responses and navigate to results
    toast.success('Interview completed!');
    navigate('/interview-results');
  }, [navigate]);

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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video uploaded
  const handleVideoUploaded = (questionIndex) => {
    setInterview(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) => 
        idx === questionIndex ? { ...q, hasVideo: true } : q
      )
    }));
    toast.success('Video uploaded successfully!');
  };

  // Handle response change
  const handleResponseChange = (value) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestionIndex]: value
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
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Interview Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{interview.config.jobRole} Interview</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Question {currentQuestionIndex + 1} of {interview.questions.length}
              </span>
              <span className="text-sm text-gray-400">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
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
              <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
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
                  <p className="text-gray-500">Video recording is disabled</p>
                </div>
              </div>
            )}

            {/* Video Status */}
            {currentQuestion.hasVideo && (
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 text-center">
                <svg className="w-5 h-5 text-green-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-400 text-sm">Video recorded for this question</p>
              </div>
            )}
          </div>

          {/* Question Section */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-primary-400">
                  Current Question
                </h2>
                <div className="text-right text-sm">
                  <span className="text-gray-400">Category: </span>
                  <span className="text-primary-400">{currentQuestion.category}</span>
                  <br />
                  <span className="text-gray-400">Difficulty: </span>
                  <span className="text-yellow-400">{currentQuestion.difficulty}</span>
                </div>
              </div>
              <p className="text-lg leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Response Area */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">
                Your Response Notes
              </h3>
              <textarea
                value={responses[currentQuestionIndex] || ''}
                onChange={(e) => handleResponseChange(e.target.value)}
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Take notes or outline your response here..."
              />
              <p className="text-sm text-gray-400 mt-2">
                These notes are for your reference. Your video response is the main submission.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button 
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={handleNext}
                className="flex-1 bg-primary-600 hover:bg-primary-700 py-3 px-6 rounded-lg font-medium transition-colors"
              >
                {currentQuestionIndex === interview.questions.length - 1 ? 'Finish Interview' : 'Next Question'}
              </button>
            </div>

            {/* Interview Settings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Interview Settings</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Video Recording</span>
                  <button 
                    onClick={() => toggleSetting('videoRecording')}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      settings.videoRecording ? 'bg-primary-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full transition-transform ${
                      settings.videoRecording ? 'transform translate-x-6' : ''
                    }`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audio Recording</span>
                  <button 
                    onClick={() => toggleSetting('audioRecording')}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      settings.audioRecording ? 'bg-primary-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full transition-transform ${
                      settings.audioRecording ? 'transform translate-x-6' : ''
                    }`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Question Audio</span>
                  <button 
                    onClick={() => toggleSetting('questionAudio')}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      settings.questionAudio ? 'bg-primary-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full transition-transform ${
                      settings.questionAudio ? 'transform translate-x-6' : ''
                    }`}></div>
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
