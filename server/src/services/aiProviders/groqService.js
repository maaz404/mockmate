/**
 * Groq AI Provider Service
 *
 * Groq (Fast LLM inference) for:
 * - Chatbot assistant (real-time help)
 * - Interview coaching tips
 * - Real-time feedback during interviews
 * - Quick suggestions
 */

const Groq = require("groq-sdk");
const BaseAIProvider = require("./BaseAIProvider");
const AI_CONFIG = require("../../config/aiProviders");

class GroqService extends BaseAIProvider {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    super("Groq", apiKey, AI_CONFIG.MODELS.groq);

    if (this.isAvailable()) {
      this.client = new Groq({
        apiKey: apiKey,
      });
    }
  }

  /**
   * Generate completion
   */
  async generateCompletion(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Groq API key not configured");
    }

    this._incrementRequests();
    this._logRequest("generateCompletion", { promptLength: prompt.length });

    try {
      const result = await this._retryWithBackoff(async () => {
        const completion = await this.client.chat.completions.create({
          model: options.model || this.config.default,
          messages: [{ role: "user", content: prompt }],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          top_p: options.topP || 1,
          stream: false,
        });

        return completion.choices[0]?.message?.content || "";
      });

      return result;
    } catch (error) {
      this._logError("generateCompletion", error);
      throw this._handleError(error, "generateCompletion");
    }
  }

  /**
   * Generate chat completion (conversational)
   */
  async generateChatCompletion(messages, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Groq API key not configured");
    }

    this._incrementRequests();
    this._logRequest("generateChatCompletion", {
      messageCount: messages.length,
    });

    try {
      const result = await this._retryWithBackoff(async () => {
        const completion = await this.client.chat.completions.create({
          model: options.model || this.config.chatbot,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          top_p: options.topP || 1,
          stream: false,
        });

        return completion.choices[0]?.message?.content || "";
      });

      return result;
    } catch (error) {
      this._logError("generateChatCompletion", error);
      throw this._handleError(error, "generateChatCompletion");
    }
  }

  /**
   * Stream chat completion (for real-time responses)
   */
  async streamCompletion(messages, onChunk, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Groq API key not configured");
    }

    this._incrementRequests();
    this._logRequest("streamCompletion", { messageCount: messages.length });

    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || this.config.chatbot,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        top_p: options.topP || 1,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      this._logError("streamCompletion", error);
      throw this._handleError(error, "streamCompletion");
    }
  }

  /**
   * Generate structured JSON output
   */
  async generateStructuredOutput(prompt, schema, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Groq API key not configured");
    }

    this._incrementRequests();
    this._logRequest("generateStructuredOutput", { schema });

    try {
      const jsonPrompt = `${prompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(
        schema,
        null,
        2
      )}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;

      const result = await this._retryWithBackoff(async () => {
        const completion = await this.client.chat.completions.create({
          model: options.model || this.config.default,
          messages: [{ role: "user", content: jsonPrompt }],
          temperature: options.temperature || 0.3,
          max_tokens: options.maxTokens || 2048,
          top_p: options.topP || 1,
          stream: false,
        });

        const text = completion.choices[0]?.message?.content || "";

        // Clean up response (remove markdown code blocks if present)
        let cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.replace(/```json\n?/, "").replace(/\n?```$/, "");
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/```\n?/, "").replace(/\n?```$/, "");
        }

        // Parse JSON
        return JSON.parse(cleaned);
      });

      return result;
    } catch (error) {
      this._logError("generateStructuredOutput", error);
      throw this._handleError(error, "generateStructuredOutput");
    }
  }

  /**
   * Chat with assistant (for chatbot feature)
   */
  async chat(messages, systemPrompt = null) {
    const fullMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages;

    return await this.generateChatCompletion(fullMessages, {
      temperature: 0.8,
      maxTokens: 1500,
    });
  }

  /**
   * Stream chat (for real-time chatbot)
   */
  async streamChat(messages, onChunk, systemPrompt = null) {
    const fullMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages;

    return await this.streamCompletion(fullMessages, onChunk, {
      temperature: 0.8,
      maxTokens: 1500,
    });
  }

  /**
   * Generate quick coaching tip
   */
  async generateCoachingTip(context) {
    const prompt = `You are an expert interview coach. Based on the current situation, provide a quick, actionable tip.

CONTEXT:
- Question Type: ${context.questionType || "General"}
- User Struggle: ${context.struggle || "None mentioned"}
- Time Remaining: ${context.timeRemaining || "Unknown"}

Provide ONE concise tip (1-2 sentences) that will immediately help the candidate. Be specific and actionable.`;

    return await this.generateCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 150,
      model: this.config.fast, // Use fastest model for quick tips
    });
  }

  /**
   * Generate real-time feedback hint
   */
  async generateRealtimeFeedback(question, partialAnswer) {
    const prompt = `You are providing real-time interview coaching. The candidate is currently answering a question.

QUESTION: ${question.questionText}

PARTIAL ANSWER SO FAR: ${partialAnswer}

Provide a brief, encouraging hint or suggestion (1 sentence) to help them continue. Don't give away the answer, just guide them.`;

    return await this.generateCompletion(prompt, {
      temperature: 0.6,
      maxTokens: 100,
      model: this.config.fast,
    });
  }

  /**
   * Generate interview suggestions
   */
  async generateSuggestions(userContext) {
    const prompt = `You are an interview preparation assistant. Generate 3-5 helpful suggestions for the user.

USER CONTEXT:
- Recent interviews: ${userContext.recentInterviews || 0}
- Average score: ${userContext.averageScore || "N/A"}
- Focus areas: ${userContext.focusAreas?.join(", ") || "General"}

Generate 3-5 short, actionable suggestions to help them improve. Each suggestion should be 1-2 sentences.

Respond with JSON array of strings.`;

    const schema = ["string"];

    return await this.generateStructuredOutput(prompt, schema, {
      temperature: 0.7,
      model: this.config.balanced,
    });
  }

  /**
   * Check provider health
   */
  async checkHealth() {
    if (!this.isAvailable()) {
      return {
        available: false,
        message: "Groq API key not configured",
      };
    }

    try {
      // Simple test request
      await this.client.chat.completions.create({
        model: this.config.fast,
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 10,
      });

      return {
        available: true,
        provider: this.providerName,
        model: this.config.chatbot,
        ...this.getStatus(),
      };
    } catch (error) {
      return {
        available: false,
        provider: this.providerName,
        error: error.message,
        ...this.getStatus(),
      };
    }
  }
}

module.exports = new GroqService();
