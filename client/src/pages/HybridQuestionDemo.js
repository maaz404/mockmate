import React, { useState } from "react";
import QuestionCard from "../components/ui/QuestionCard";

// Mock data for demonstration
const mockQuestions = [
  {
    id: "template_1",
    text: "Explain how JavaScript closures work and provide a practical example.",
    category: "javascript",
    tags: ["DSA", "Programming Fundamentals"],
    difficulty: "intermediate",
    estimatedTime: 300,
    type: "technical",
    source: "template"
  },
  {
    id: "ai_generated_1", 
    text: "How would you design a scalable notification system that can handle millions of users?",
    category: "system-design",
    tags: ["System Design", "Architecture", "Scalability"],
    difficulty: "advanced",
    estimatedTime: 900,
    type: "technical",
    source: "ai_generated"
  },
  {
    id: "ai_paraphrased_1",
    text: "Can you walk me through a situation where you had to collaborate with a challenging colleague and how you managed the relationship?",
    category: "teamwork",
    tags: ["Behavioral", "Teamwork", "Communication"],
    difficulty: "intermediate", 
    estimatedTime: 280,
    type: "behavioral",
    source: "ai_paraphrased",
    paraphrasedFrom: "Tell me about a time when you had to work with a difficult team member."
  },
  {
    id: "template_2",
    text: "What are the differences between SQL and NoSQL databases? When would you use each?",
    category: "database",
    tags: ["DB", "System Design"],
    difficulty: "beginner",
    estimatedTime: 200,
    type: "technical", 
    source: "template"
  },
  {
    id: "ai_generated_2",
    text: "Describe your approach to handling a technical crisis when you're under tight deadlines.",
    category: "problem-solving",
    tags: ["Behavioral", "Leadership", "Problem Solving"],
    difficulty: "intermediate",
    estimatedTime: 320,
    type: "behavioral",
    source: "ai_generated"
  }
];

const mockMetadata = {
  totalQuestions: 10,
  sourceBreakdown: {
    template: 7,
    ai_generated: 2, 
    ai_paraphrased: 1
  },
  tagCoverage: ["DSA", "System Design", "DB", "Behavioral", "Programming Fundamentals", "Architecture", "Teamwork"]
};

const HybridQuestionDemo = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleAnswer = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hybrid Question Generation Demo
          </h1>
          <p className="text-gray-600">
            Showcasing template-based + AI-generated interview questions with comprehensive tagging
          </p>
        </div>

        {/* Configuration Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Role:</span>
              <div className="text-blue-600">Software Engineer</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Level:</span>
              <div className="text-green-600">Intermediate</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <div className="text-purple-600">Mixed</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Questions:</span>
              <div className="text-orange-600">10 total</div>
            </div>
          </div>
        </div>

        {/* Generation Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{mockMetadata.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-700 mb-2">Source Distribution:</div>
              <div className="space-y-1">
                <div className="text-xs">
                  <span className="font-medium">Template:</span> {mockMetadata.sourceBreakdown.template} (70%)
                </div>
                <div className="text-xs">
                  <span className="font-medium">AI Generated:</span> {mockMetadata.sourceBreakdown.ai_generated} (20%)
                </div>
                <div className="text-xs">
                  <span className="font-medium">AI Paraphrased:</span> {mockMetadata.sourceBreakdown.ai_paraphrased} (10%)
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-700 mb-2">Tag Coverage:</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {mockMetadata.tagCoverage.map((tag, index) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current Question */}
        <div className="mb-6">
          <QuestionCard
            question={mockQuestions[currentQuestionIndex]}
            index={currentQuestionIndex}
            total={mockQuestions.length}
            onAnswer={handleAnswer}
            currentAnswer={answers[currentQuestionIndex] || ""}
            showTags={true}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-800 rounded-md font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {mockQuestions.length}
          </div>

          <button
            onClick={nextQuestion}
            disabled={currentQuestionIndex === mockQuestions.length - 1}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-md font-medium transition-colors duration-200"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Features Showcase */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features Implemented</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Hybrid Generation</div>
                  <div className="text-sm text-gray-600">70% template-based, 30% AI-generated questions</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Comprehensive Tagging</div>
                  <div className="text-sm text-gray-600">DSA, System Design, DB, Behavioral categorization</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Smart Caching</div>
                  <div className="text-sm text-gray-600">Redis-based caching to minimize API calls</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Balanced Coverage</div>
                  <div className="text-sm text-gray-600">Ensures proper distribution across question types</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">AI Paraphrasing</div>
                  <div className="text-sm text-gray-600">Templates enhanced with AI for variety</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Role-Based Templates</div>
                  <div className="text-sm text-gray-600">Organized by job role and difficulty level</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HybridQuestionDemo;