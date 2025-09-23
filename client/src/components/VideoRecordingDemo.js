import React, { useState } from "react";
import VideoRecorder from "../components/VideoRecorder";

const VideoRecordingDemo = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [uploadedVideos, setUploadedVideos] = useState(new Set());

  const questions = [
    {
      text: "Tell me about a challenging project you worked on recently. How did you approach the problem, and what was the outcome?",
      category: "Behavioral",
      difficulty: "Intermediate"
    },
    {
      text: "Describe your experience with React and how you would optimize a React application for performance.",
      category: "Technical", 
      difficulty: "Intermediate"
    },
    {
      text: "How do you handle conflict within a team when working on a software project?",
      category: "Behavioral",
      difficulty: "Intermediate"
    }
  ];

  const handleVideoUploaded = (questionIndex) => {
    setUploadedVideos(prev => new Set([...prev, questionIndex]));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Demo Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Video Recording Demo - Software Engineer Interview</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-yellow-400">DEMO MODE</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary-400 mb-4">Video Recording</h2>
            
            {/* Demo Notice */}
            <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-yellow-400 font-medium">Demo Mode</p>
                  <p className="text-yellow-200 text-sm">This is a demonstration of the video recording functionality. In a real interview, videos would be uploaded to the server.</p>
                </div>
              </div>
            </div>

            <VideoRecorder
              interviewId="demo-interview-123"
              currentQuestionIndex={currentQuestionIndex}
              onVideoUploaded={handleVideoUploaded}
            />

            {/* Video Status */}
            {uploadedVideos.has(currentQuestionIndex) && (
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 text-center">
                <svg className="w-5 h-5 text-green-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-400 text-sm">Video recorded for this question (Demo)</p>
              </div>
            )}

            {/* Recording Instructions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-primary-400 mb-2">How to Use:</h3>
              <ol className="text-sm text-gray-300 space-y-1">
                <li>1. Allow camera access when prompted</li>
                <li>2. Click the red record button to start recording</li>
                <li>3. Answer the question while recording</li>
                <li>4. Click the stop button when finished</li>
                <li>5. Click "Upload Video" to save your response</li>
                <li>6. Navigate to the next question</li>
              </ol>
            </div>
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
                {currentQuestion.text}
              </p>
            </div>

            {/* Notes Area */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-primary-400">
                Your Response Notes
              </h3>
              <textarea
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Take notes or outline your response here..."
              />
              <p className="text-sm text-gray-400 mt-2">
                These notes are for your reference. Your video response is the main submission.
              </p>
            </div>

            {/* Navigation Buttons */}
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
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-medium transition-colors"
              >
                {currentQuestionIndex === questions.length - 1 ? 'Demo Complete' : 'Next Question'}
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3 text-primary-400">Video Recording Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Per-question video recording</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Real-time recording duration display</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Video upload and storage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Camera permission handling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Error handling and user feedback</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Footer */}
        <div className="mt-8 text-center">
          <div className="bg-primary-900/50 border border-primary-700 rounded-lg p-4">
            <p className="text-primary-400 font-medium">Video Interview Recording System</p>
            <p className="text-primary-200 text-sm mt-1">
              Complete per-question video recording and upload functionality for interview platforms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoRecordingDemo;