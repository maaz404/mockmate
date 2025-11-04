/**
 * AI Provider Configuration
 *
 * Maps each feature to its recommended AI provider:
 * - Gemini: Structured analysis, evaluation, question generation
 * - Groq: Real-time chat, fast responses
 * - Grok: Behavioral content, creative tasks, adaptive difficulty
 */

module.exports = {
  // ===== PROVIDER ASSIGNMENTS =====

  // Gemini for structured analysis & evaluation
  EVALUATION_PROVIDER: "gemini",
  QUESTION_GENERATION_PROVIDER: "gemini",
  TECHNICAL_QUESTIONS_PROVIDER: "gemini",
  ANALYTICS_PROVIDER: "gemini",
  FOLLOWUP_QUESTIONS_PROVIDER: "gemini",

  // Groq for real-time chat & fast responses
  CHATBOT_PROVIDER: "groq",
  REALTIME_FEEDBACK_PROVIDER: "groq",
  INTERVIEW_COACHING_PROVIDER: "groq",
  QUICK_TIPS_PROVIDER: "groq",

  // Grok for behavioral & creative tasks
  BEHAVIORAL_QUESTIONS_PROVIDER: "grok",
  CAREER_GUIDANCE_PROVIDER: "grok",
  RESUME_ANALYSIS_PROVIDER: "grok",
  ADAPTIVE_DIFFICULTY_PROVIDER: "grok",
  SOFT_SKILLS_ANALYSIS_PROVIDER: "grok",

  // ===== FALLBACK CONFIGURATION =====

  // Order of fallback if primary provider fails
  FALLBACK_ORDER: ["gemini", "groq", "grok"],

  // Feature-specific fallbacks
  FALLBACK_MAPPING: {
    evaluation: ["gemini", "groq"],
    questions: ["gemini", "grok"],
    chatbot: ["groq", "gemini"],
    behavioral: ["grok", "gemini"],
    analytics: ["gemini"],
  },

  // ===== MODEL CONFIGURATION =====

  MODELS: {
    gemini: {
      default: "gemini-pro",
      evaluation: "gemini-pro",
      questions: "gemini-pro",
      analytics: "gemini-pro",
    },
    groq: {
      default: "mixtral-8x7b-32768",
      chatbot: "mixtral-8x7b-32768",
      fast: "llama3-8b-8192",
      balanced: "llama3-70b-8192",
    },
    grok: {
      default: "grok-beta",
      behavioral: "grok-beta",
      creative: "grok-beta",
    },
  },

  // ===== RATE LIMITS =====

  RATE_LIMITS: {
    gemini: {
      requestsPerMinute: 60,
      requestsPerDay: 1500,
    },
    groq: {
      requestsPerMinute: 30,
      requestsPerDay: 14400,
    },
    grok: {
      requestsPerMinute: 10,
      requestsPerDay: 1000,
    },
  },

  // ===== TIMEOUT CONFIGURATION =====

  TIMEOUTS: {
    gemini: 30000, // 30 seconds
    groq: 10000, // 10 seconds (fast responses)
    grok: 30000, // 30 seconds
  },

  // ===== RETRY CONFIGURATION =====

  RETRY: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};
