import React, { useState } from "react";
import HybridQuestionGenerator from "../components/ui/HybridQuestionGenerator";

const QuestionBankPage = () => {
  const [showGenerator, setShowGenerator] = useState(false);

  const handleQuestionsGenerated = (_questions) => {
    // Handle the generated questions
    // console.log('Generated questions:', questions); // eslint-disable-line no-console
    setShowGenerator(false);
  };

  const questionCategories = [
    {
      name: "Behavioral Questions",
      count: 45,
      description: "Common behavioral interview questions",
      color: "bg-primary-100 text-primary-600",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
          />
        </svg>
      ),
    },
    {
      name: "Technical Questions",
      count: 78,
      description: "Programming and technical questions",
      color: "bg-green-100 text-green-600",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      name: "System Design",
      count: 32,
      description: "System design and architecture questions",
      color: "bg-purple-100 text-purple-600",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 bg-surface-50 dark:bg-surface-900 min-h-screen transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
            Question Bank
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Browse and practice with our comprehensive collection of interview
            questions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionCategories.map((category) => (
            <div
              key={category.name}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4`}
              >
                {category.icon}
              </div>
              <h3 className="font-heading text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                {category.name}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {category.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500 dark:text-surface-400">
                  {category.count} questions
                </span>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Browse →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 rounded-xl p-8 border border-primary-100/60 dark:border-primary-900/30 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  Hybrid Question Generation
                </h3>
                <p className="text-surface-700 dark:text-surface-300">
                  Generate a mix of template-based and AI-created questions
                  tailored to your interview needs.
                </p>
              </div>
              <button
                onClick={() => setShowGenerator(!showGenerator)}
                className="btn-primary"
              >
                {showGenerator ? "Hide Generator" : "Generate Questions"}
              </button>
            </div>
          </div>
        </div>

        {/* Hybrid Question Generator */}
        {showGenerator && (
          <div className="mt-8">
            <HybridQuestionGenerator
              onQuestionsGenerated={handleQuestionsGenerated}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBankPage;
