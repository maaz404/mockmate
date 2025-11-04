/**
 * Feature Flags Configuration
 *
 * Controls which features are enabled/disabled in the application.
 * Set to false to disable complex features and simplify the application.
 *
 * Phase 1 (Current): Core features only
 * Phase 2+: Gradually enable advanced features as needed
 */

module.exports = {
  // ===== CORE FEATURES (Always Enabled) =====
  USER_AUTHENTICATION: true,
  INTERVIEW_PRACTICE: true,
  QUESTION_BANK: true,
  BASIC_EVALUATION: true,
  DASHBOARD: true,

  // ===== ADVANCED FEATURES (Now Enabled) =====

  // Python Service Integration
  // Requires: Python service running on port 8000
  // Cost: High (500MB+ dependencies, separate deployment)
  // Benefit: Advanced NLP and semantic analysis
  // NOTE: Keep disabled - removed in simplification
  USE_PYTHON_SERVICE: false,

  // Video Recording
  // Requires: Cloudinary, large storage, complex file handling
  // Cost: Medium-High (storage costs, complex code)
  // Benefit: Video replay and analysis
  VIDEO_RECORDING: true,

  // Facial Expression Analysis
  // Requires: TensorFlow.js, MediaPipe, complex ML models
  // Cost: High (performance impact, complex code)
  // Benefit: Emotion detection during interview
  FACIAL_ANALYSIS: true,

  // AI-Generated Questions
  // Requires: OpenAI API calls ($$)
  // Cost: Medium (API costs per generation)
  // Benefit: Personalized questions based on performance
  AI_QUESTIONS: true,

  // Adaptive Difficulty
  // Requires: Complex algorithm, performance tracking
  // Cost: Medium (complex logic)
  // Benefit: Dynamic difficulty adjustment
  ADAPTIVE_DIFFICULTY: true,

  // Coding Challenges
  // Requires: Judge0 API ($$), code execution environment
  // Cost: Medium (API costs, security concerns)
  // Benefit: Code execution and testing
  CODING_CHALLENGES: true,

  // Chatbot Assistant
  // Requires: OpenAI API calls ($$)
  // Cost: Medium-High (API costs per message)
  // Benefit: AI assistant during practice
  CHATBOT: true,

  // Advanced Analytics
  // Requires: Complex reporting, data aggregation
  // Cost: Medium (complex queries, processing)
  // Benefit: Detailed performance insights
  ADVANCED_ANALYTICS: true,

  // PDF Export
  // Requires: PDF generation library, templates
  // Cost: Low-Medium (library dependencies)
  // Benefit: Export interview results as PDF
  PDF_EXPORT: true,

  // CSV Export
  // Requires: CSV generation logic
  // Cost: Low (simple implementation)
  // Benefit: Export data for external analysis
  CSV_EXPORT: true,

  // Transcript Polling
  // Requires: Background jobs, polling mechanism
  // Cost: Low-Medium (background processing)
  // Benefit: Real-time transcription updates
  TRANSCRIPT_POLLING: true,

  // Audio Recording (Simpler alternative to video)
  // Requires: Audio capture, storage
  // Cost: Low-Medium (simpler than video)
  // Benefit: Voice recording without video overhead
  AUDIO_RECORDING: true,

  // In-Memory Fallback
  // Requires: In-memory data structures
  // Cost: Low (memory usage)
  // Benefit: Works without database (testing)
  IN_MEMORY_FALLBACK: false,
};

/**
 * Helper function to check if a feature is enabled
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} - Whether the feature is enabled
 */
function isFeatureEnabled(featureName) {
  return module.exports[featureName] === true;
}

/**
 * Get all enabled features
 * @returns {string[]} - Array of enabled feature names
 */
function getEnabledFeatures() {
  return Object.keys(module.exports).filter(
    (key) => typeof module.exports[key] === "boolean" && module.exports[key]
  );
}

/**
 * Get all disabled features
 * @returns {string[]} - Array of disabled feature names
 */
function getDisabledFeatures() {
  return Object.keys(module.exports).filter(
    (key) => typeof module.exports[key] === "boolean" && !module.exports[key]
  );
}

module.exports.isFeatureEnabled = isFeatureEnabled;
module.exports.getEnabledFeatures = getEnabledFeatures;
module.exports.getDisabledFeatures = getDisabledFeatures;
