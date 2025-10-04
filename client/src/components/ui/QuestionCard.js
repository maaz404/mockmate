import React from "react";

const QuestionCard = ({
  question,
  index,
  total,
  onAnswer,
  currentAnswer = "",
  timeRemaining = null,
  showTags = true,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const getTagColor = (tag) => {
    const tagColors = {
      DSA: "bg-blue-100 text-blue-800",
      "System Design": "bg-purple-100 text-purple-800",
      DB: "bg-green-100 text-green-800",
      Behavioral: "bg-yellow-100 text-yellow-800",
      "Programming Fundamentals": "bg-indigo-100 text-indigo-800",
      Frontend: "bg-pink-100 text-pink-800",
      Backend: "bg-surface-100 text-surface-800",
      React: "bg-cyan-100 text-cyan-800",
      API: "bg-primary-100 text-primary-800",
      Performance: "bg-red-100 text-red-800",
      Security: "bg-surface-100 text-surface-800",
      Leadership: "bg-emerald-100 text-emerald-800",
      Teamwork: "bg-teal-100 text-teal-800",
      Learning: "bg-violet-100 text-violet-800",
      "Problem Solving": "bg-rose-100 text-rose-800",
    };
    return tagColors[tag] || "bg-surface-100 text-surface-600";
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case "template":
        return (
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case "ai_generated":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "ai_paraphrased":
        return (
          <svg
            className="w-4 h-4 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case "template":
        return "Template";
      case "ai_generated":
        return "AI Generated";
      case "ai_paraphrased":
        return "AI Paraphrased";
      default:
        return "Standard";
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="card p-6">
      {/* Question Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-surface-500">
            Question {index + 1} of {total}
          </span>
          {question.source && (
            <div className="flex items-center space-x-1 text-xs text-surface-500">
              {getSourceIcon(question.source)}
              <span>{getSourceLabel(question.source)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {question.difficulty && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                question.difficulty === "beginner"
                  ? "bg-green-100 text-green-800"
                  : question.difficulty === "intermediate"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {question.difficulty.charAt(0).toUpperCase() +
                question.difficulty.slice(1)}
            </span>
          )}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(question)}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              className={`transition p-1 rounded hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isFavorite ? "text-yellow-500" : "text-surface-400"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.048 2.927c.3-.921 1.604-.921 1.902 0l2.01 6.175a1 1 0 00.95.69h6.487c.969 0 1.371 1.24.588 1.81l-5.25 3.815a1 1 0 00-.364 1.118l2.01 6.174c.3.922-.755 1.688-1.54 1.118l-5.25-3.815a1 1 0 00-1.175 0l-5.25 3.815c-.784.57-1.838-.196-1.539-1.118l2.01-6.174a1 1 0 00-.364-1.118L2.015 11.6c-.783-.57-.38-1.81.588-1.81h6.487a1 1 0 00.95-.69l2.01-6.175z"
                />
              </svg>
            </button>
          )}
          {timeRemaining !== null && (
            <div className="text-sm font-mono text-surface-600">
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      </div>

      {/* Question Tags */}
      {showTags && question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(
                tag
              )}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-surface-900 leading-relaxed">
          {question.text}
        </h3>
        {question.category && (
          <p className="text-sm text-surface-500 mt-2">
            Category:{" "}
            {question.category.charAt(0).toUpperCase() +
              question.category.slice(1)}
          </p>
        )}
      </div>

      {/* Answer Section */}
      {onAnswer && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-surface-700">
            Your Answer
          </label>
          <textarea
            value={currentAnswer}
            onChange={(e) => onAnswer(e.target.value)}
            className="form-input h-32 resize-none"
            placeholder="Type your answer here..."
          />

          {/* Estimated Time */}
          {question.estimatedTime && (
            <div className="flex items-center justify-between text-xs text-surface-500">
              <span>
                Estimated time: {Math.ceil(question.estimatedTime / 60)} minutes
              </span>
              <span>Characters: {currentAnswer.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Question Metadata (for review mode) */}
      {!onAnswer && question.estimatedTime && (
        <div className="mt-4 pt-4 border-t border-surface-100">
          <div className="flex justify-between text-xs text-surface-500">
            <span>
              Estimated time: {Math.ceil(question.estimatedTime / 60)} minutes
            </span>
            {question.type && (
              <span>
                Type:{" "}
                {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
