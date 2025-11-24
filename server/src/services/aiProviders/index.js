/**
 * AI Provider Manager
 *
 * Central router that:
 * - Routes requests to appropriate AI provider based on feature
 * - Handles fallbacks if primary provider fails
 * - Provides unified interface for all AI operations
 * - Monitors provider health and performance
 */

const geminiService = require("./geminiService");
const groqService = require("./groqService");
const grokService = require("./grokService");
const AI_CONFIG = require("../../config/aiProviders");

class AIProviderManager {
  constructor() {
    this.providers = {
      gemini: geminiService,
      groq: groqService,
      grok: grokService,
    };
  }

  /**
   * Get provider for a specific feature
   */
  _getProviderForFeature(feature) {
    const providerName = AI_CONFIG[`${feature.toUpperCase()}_PROVIDER`];
    return this.providers[providerName];
  }

  /**
   * Get fallback providers for a feature
   */
  _getFallbackProviders(feature) {
    const fallbacks =
      AI_CONFIG.FALLBACK_MAPPING[feature] || AI_CONFIG.FALLBACK_ORDER;
    return fallbacks
      .map((name) => this.providers[name])
      .filter((provider) => provider && provider.isAvailable());
  }

  /**
   * Execute with fallback logic
   */
  async _executeWithFallback(feature, fn, context = {}) {
    const primary = this._getProviderForFeature(feature);
    const fallbacks = this._getFallbackProviders(feature);

    // Try primary provider first
    if (primary && primary.isAvailable()) {
      try {
        return await fn(primary);
      } catch (error) {
        console.warn(
          `[AIManager] Primary provider ${primary.providerName} failed for ${feature}:`,
          error.message
        );
        // Continue to fallbacks
      }
    }

    // Try fallback providers
    for (const provider of fallbacks) {
      if (provider.providerName === primary?.providerName) {
        continue; // Skip primary if already tried
      }

      try {
        console.log(
          `[AIManager] Trying fallback provider ${provider.providerName} for ${feature}`
        );
        return await fn(provider);
      } catch (error) {
        console.warn(
          `[AIManager] Fallback provider ${provider.providerName} failed:`,
          error.message
        );
        // Continue to next fallback
      }
    }

    // All providers failed
    throw new Error(`All AI providers failed for feature: ${feature}`);
  }

  // ========== EVALUATION FEATURES (Gemini) ==========

  /**
   * Evaluate interview answer
   */
  async evaluateAnswer(question, answer, config = {}) {
    console.log("[AIManager] evaluateAnswer called", {
      hasQuestion: !!question,
      hasAnswer: !!answer,
      configKeys: Object.keys(config),
    });

    return await this._executeWithFallback("evaluation", async (provider) => {
      console.log(
        `[AIManager] Trying provider: ${provider.providerName} for evaluation`
      );

      if (provider.evaluateAnswer) {
        console.log(
          `[AIManager] Provider ${provider.providerName} has evaluateAnswer method`
        );
        const result = await provider.evaluateAnswer(question, answer, config);
        console.log(
          `[AIManager] Evaluation result from ${provider.providerName}:`,
          {
            score: result.score,
            hasFeedback: !!result.feedback,
            feedbackLength: result.feedback?.length || 0,
          }
        );
        return result;
      }

      // Fallback to generic completion
      console.log(
        `[AIManager] Provider ${provider.providerName} doesn't have evaluateAnswer, using generic completion`
      );
      const prompt = this._buildEvaluationPrompt(question, answer, config);
      const response = await provider.generateStructuredOutput(
        prompt,
        this._getEvaluationSchema()
      );
      return response;
    });
  }

  _buildEvaluationPrompt(question, answer, config) {
    return `Evaluate this interview answer and provide structured feedback.

QUESTION: ${question.questionText || question}
ANSWER: ${answer.text || answer.answerText || answer}
CONTEXT: ${JSON.stringify(config)}

Provide: score (0-100), rubricScores (relevance, clarity, depth, structure 1-5), strengths (array), improvements (array), feedback (string)`;
  }

  _getEvaluationSchema() {
    return {
      score: "number",
      rubricScores: {
        relevance: "number",
        clarity: "number",
        depth: "number",
        structure: "number",
      },
      strengths: ["string"],
      improvements: ["string"],
      feedback: "string",
    };
  }

  // ========== QUESTION GENERATION (Gemini/Grok) ==========

  /**
   * Generate interview questions
   */
  async generateQuestions(config) {
    const feature =
      config.interviewType === "behavioral" ? "behavioral" : "questions";

    return await this._executeWithFallback(feature, async (provider) => {
      if (provider.generateQuestions) {
        return await provider.generateQuestions(config);
      }
      if (
        provider.generateBehavioralQuestions &&
        config.interviewType === "behavioral"
      ) {
        return await provider.generateBehavioralQuestions(config);
      }
      throw new Error("Provider does not support question generation");
    });
  }

  /**
   * Generate follow-up questions
   */
  async generateFollowUpQuestions(originalQuestion, answer, count = 3) {
    return await this._executeWithFallback(
      "followup_questions",
      async (provider) => {
        if (provider.generateFollowUpQuestions) {
          return await provider.generateFollowUpQuestions(
            originalQuestion,
            answer,
            count
          );
        }
        throw new Error("Provider does not support follow-up generation");
      }
    );
  }

  // ========== CHATBOT FEATURES (Groq) ==========

  /**
   * Chat with assistant
   * @param {Array} messages - Array of message objects
   * @param {Object|string} contextOrSystemPrompt - Context object or system prompt string
   * @returns {Promise<string>} AI response
   */
  async chat(messages, contextOrSystemPrompt = null) {
    return await this._executeWithFallback("chatbot", async (provider) => {
      // Handle both old string format and new context object
      let systemPrompt = null;
      if (typeof contextOrSystemPrompt === "string") {
        systemPrompt = contextOrSystemPrompt;
      } else if (contextOrSystemPrompt && contextOrSystemPrompt.ragContext) {
        // Build system prompt with RAG context
        systemPrompt = contextOrSystemPrompt.ragContext;
      }

      if (provider.chat) {
        return await provider.chat(messages, systemPrompt);
      }
      // Fallback to generic chat completion
      const fullMessages = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...messages]
        : messages;
      return await provider.generateChatCompletion(fullMessages);
    });
  }

  /**
   * Stream chat (for real-time responses)
   * @param {Array} messages - Array of message objects
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object|string} contextOrSystemPrompt - Context object or system prompt string
   */
  async streamChat(messages, onChunk, contextOrSystemPrompt = null) {
    return await this._executeWithFallback("chatbot", async (provider) => {
      // Handle both old string format and new context object
      let systemPrompt = null;
      if (typeof contextOrSystemPrompt === "string") {
        systemPrompt = contextOrSystemPrompt;
      } else if (contextOrSystemPrompt && contextOrSystemPrompt.ragContext) {
        systemPrompt = contextOrSystemPrompt.ragContext;
      }

      if (provider.streamChat) {
        return await provider.streamChat(messages, onChunk, systemPrompt);
      }
      if (provider.streamCompletion) {
        const fullMessages = systemPrompt
          ? [{ role: "system", content: systemPrompt }, ...messages]
          : messages;
        return await provider.streamCompletion(fullMessages, onChunk);
      }
      throw new Error("Provider does not support streaming");
    });
  }

  /**
   * Generate coaching tip
   */
  async generateCoachingTip(context) {
    return await this._executeWithFallback(
      "interview_coaching",
      async (provider) => {
        if (provider.generateCoachingTip) {
          return await provider.generateCoachingTip(context);
        }
        const prompt = `Provide a quick interview coaching tip for: ${JSON.stringify(
          context
        )}`;
        return await provider.generateCompletion(prompt);
      }
    );
  }

  // ========== ANALYTICS (Gemini) ==========

  /**
   * Analyze interview performance
   */
  async analyzePerformance(interviews) {
    return await this._executeWithFallback("analytics", async (provider) => {
      if (provider.analyzePerformance) {
        return await provider.analyzePerformance(interviews);
      }
      throw new Error("Provider does not support performance analysis");
    });
  }

  // ========== BEHAVIORAL & CAREER (Grok) ==========

  /**
   * Analyze resume
   */
  async analyzeResume(resumeData) {
    return await this._executeWithFallback(
      "resume_analysis",
      async (provider) => {
        if (provider.analyzeResume) {
          return await provider.analyzeResume(resumeData);
        }
        throw new Error("Provider does not support resume analysis");
      }
    );
  }

  /**
   * Adjust interview difficulty
   */
  async adjustDifficulty(performanceData) {
    return await this._executeWithFallback(
      "adaptive_difficulty",
      async (provider) => {
        if (provider.adjustDifficulty) {
          return await provider.adjustDifficulty(performanceData);
        }
        throw new Error("Provider does not support adaptive difficulty");
      }
    );
  }

  /**
   * Analyze soft skills
   */
  async analyzeSoftSkills(responses) {
    return await this._executeWithFallback(
      "soft_skills_analysis",
      async (provider) => {
        if (provider.analyzeSoftSkills) {
          return await provider.analyzeSoftSkills(responses);
        }
        throw new Error("Provider does not support soft skills analysis");
      }
    );
  }

  /**
   * Generate career guidance
   */
  async generateCareerGuidance(userProfile) {
    return await this._executeWithFallback(
      "career_guidance",
      async (provider) => {
        if (provider.generateCareerGuidance) {
          return await provider.generateCareerGuidance(userProfile);
        }
        throw new Error("Provider does not support career guidance");
      }
    );
  }

  // ========== HEALTH & MONITORING ==========

  /**
   * Get health status of all providers
   */
  async getProvidersHealth() {
    const health = {};

    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        health[name] = await provider.checkHealth();
      } catch (error) {
        health[name] = {
          available: false,
          provider: name,
          error: error.message,
        };
      }
    }

    return health;
  }

  /**
   * Get provider statistics
   */
  getProvidersStats() {
    const stats = {};

    for (const [name, provider] of Object.entries(this.providers)) {
      stats[name] = provider.getStatus();
    }

    return stats;
  }

  /**
   * Get configuration summary
   */
  getConfiguration() {
    return {
      evaluation: AI_CONFIG.EVALUATION_PROVIDER,
      questions: AI_CONFIG.QUESTION_GENERATION_PROVIDER,
      chatbot: AI_CONFIG.CHATBOT_PROVIDER,
      behavioral: AI_CONFIG.BEHAVIORAL_QUESTIONS_PROVIDER,
      analytics: AI_CONFIG.ANALYTICS_PROVIDER,
      adaptiveDifficulty: AI_CONFIG.ADAPTIVE_DIFFICULTY_PROVIDER,
      fallbackOrder: AI_CONFIG.FALLBACK_ORDER,
    };
  }
}

module.exports = new AIProviderManager();
