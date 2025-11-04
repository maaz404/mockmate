/**
 * Frontend Feature Flags Configuration
 *
 * Controls which UI features are enabled/disabled.
 * Must match backend feature flags for consistency.
 *
 * Usage:
 * import { FEATURES } from '../config/features';
 * {FEATURES.videoRecording && <VideoRecorder />}
 */

export const FEATURES = {
  // ===== CORE FEATURES (Always Enabled) =====
  interviews: true,
  questions: true,
  dashboard: true,
  authentication: true,
  profile: true,

  // ===== ADVANCED FEATURES (Now Enabled) =====

  // Video Recording - Complex file handling, large storage costs
  videoRecording: true,

  // Facial Expression Analysis - TensorFlow.js, performance impact
  facialAnalysis: true,

  // AI-Generated Questions - OpenAI API costs
  aiQuestions: true,

  // Adaptive Difficulty - Complex algorithm
  adaptiveDifficulty: true,

  // Coding Challenges - Judge0 API costs
  codingChallenges: true,

  // Chatbot Assistant - OpenAI API costs
  chatbot: true,

  // Advanced Analytics - Complex reporting
  advancedAnalytics: true,

  // PDF Export - PDF generation
  pdfExport: true,

  // CSV Export - CSV generation
  csvExport: true,

  // Transcript - Real-time transcription
  transcript: true,

  // Audio Recording (simpler alternative to video)
  audioRecording: true,
};

/**
 * Helper function to check if a feature is enabled
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} - Whether the feature is enabled
 */
export function isFeatureEnabled(featureName) {
  return FEATURES[featureName] === true;
}

/**
 * Get all enabled features
 * @returns {string[]} - Array of enabled feature names
 */
export function getEnabledFeatures() {
  return Object.keys(FEATURES).filter((key) => FEATURES[key] === true);
}

/**
 * Get all disabled features
 * @returns {string[]} - Array of disabled feature names
 */
export function getDisabledFeatures() {
  return Object.keys(FEATURES).filter((key) => FEATURES[key] === false);
}

/**
 * Feature descriptions for UI (optional)
 */
export const FEATURE_DESCRIPTIONS = {
  videoRecording: "Record video during interviews",
  facialAnalysis: "Analyze facial expressions and emotions",
  aiQuestions: "AI-generated personalized questions",
  adaptiveDifficulty: "Dynamic difficulty adjustment",
  codingChallenges: "Live coding challenges with execution",
  chatbot: "AI assistant for help during practice",
  advancedAnalytics: "Detailed performance analytics",
  pdfExport: "Export results as PDF",
  csvExport: "Export data as CSV",
  transcript: "Real-time speech transcription",
  audioRecording: "Record audio during interviews",
};

export default FEATURES;
