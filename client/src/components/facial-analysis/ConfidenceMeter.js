import React from "react";
import { motion } from "framer-motion";

const ConfidenceMeter = ({
  metrics = {
    eyeContact: 0,
    blinkRate: 0,
    headSteadiness: 0,
    smilePercentage: 0,
    offScreenPercentage: 0,
    confidenceScore: 0,
    environmentQuality: 0,
  },
  isAnalyzing = false,
  className = "",
}) => {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Removed unused getProgressColor to satisfy lint rules

  const formatMetric = (value, suffix = "%") => {
    return `${Math.round(value)}${suffix}`;
  };

  if (!isAnalyzing) {
    return (
      <div className={`bg-surface-100 rounded-lg p-4 ${className}`}>
        <div className="text-center text-surface-500">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm">Confidence analysis not active</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-4 ${className}`}>
      {/* Main Confidence Score */}
      <div className="text-center mb-4">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreColor(
            metrics.confidenceScore
          )} mb-2`}
        >
          <span className="text-2xl font-bold">
            {Math.round(metrics.confidenceScore)}
          </span>
        </div>
        <div className="text-sm text-surface-600">Confidence Score</div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-3">
        {/* Eye Contact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="text-sm text-surface-700">Eye Contact</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-surface-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, metrics.eyeContact)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-medium text-surface-900 w-8">
              {formatMetric(metrics.eyeContact)}
            </span>
          </div>
        </div>

        {/* Head Steadiness */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-surface-700">Stability</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-surface-200 rounded-full h-2">
              <motion.div
                className="bg-purple-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, metrics.headSteadiness)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-medium text-surface-900 w-8">
              {formatMetric(metrics.headSteadiness)}
            </span>
          </div>
        </div>

        {/* Blink Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm text-surface-700">Blink Rate</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-surface-900 w-8">
              {formatMetric(metrics.blinkRate, "/min")}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                metrics.blinkRate >= 15 && metrics.blinkRate <= 25
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            ></div>
          </div>
        </div>

        {/* Smile Percentage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-surface-700">Expressions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-surface-200 rounded-full h-2">
              <motion.div
                className="bg-yellow-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, metrics.smilePercentage)}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-medium text-surface-900 w-8">
              {formatMetric(metrics.smilePercentage)}
            </span>
          </div>
        </div>

        {/* Presence (On-screen) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3"
              />
            </svg>
            <span className="text-sm text-surface-700">Presence</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-surface-200 rounded-full h-2">
              <motion.div
                className="bg-indigo-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, 100 - metrics.offScreenPercentage)}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-medium text-surface-900 w-8">
              {formatMetric(100 - metrics.offScreenPercentage)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-3 border-t border-surface-200">
        <div className="flex items-center justify-center space-x-2 text-sm text-surface-600">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 bg-green-500 rounded-full"
          />
          <span>Analyzing your delivery...</span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceMeter;
