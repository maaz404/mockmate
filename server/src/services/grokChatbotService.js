const axios = require("axios");
const Logger = require("../utils/logger");

/**
 * Grok Chatbot Service
 * Handles communication with xAI's Grok API for conversational AI
 */
class GrokChatbotService {
  constructor() {
    this.apiKey = process.env.GROK_API_KEY;
    this.apiUrl =
      process.env.GROK_API_URL || "https://api.x.ai/v1/chat/completions";
    this.model = process.env.GROK_MODEL || "grok-beta";
    this.appOnlyMode =
      (process.env.CHATBOT_APP_ONLY || "false").toLowerCase() === "true";
    // Defaults
    this.DEFAULT_TEMPERATURE = 0.7;
    this.DEFAULT_MAX_TOKENS = 800;
    this.REQUEST_TIMEOUT_MS = 30000;
    // HTTP status codes
    this.HTTP_UNAUTHORIZED = 401;
    this.HTTP_FORBIDDEN = 403;
    this.HTTP_TOO_MANY_REQUESTS = 429;
    // Misc constants
    this.VALIDATION_TIMEOUT_MS = 8000;
  }

  /**
   * Check if Grok API is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Send chat message to Grok API
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} context - User context for personalization
   * @returns {Promise<Object>} Response with message, usage, and model info
   */
  async chat(messages, context = {}) {
    if (!this.isConfigured()) {
      throw new Error(
        "Grok API is not configured. Please add GROK_API_KEY to your .env file."
      );
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: this.DEFAULT_TEMPERATURE,
          max_tokens: this.DEFAULT_MAX_TOKENS,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: this.REQUEST_TIMEOUT_MS,
        }
      );

      return {
        message: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
      };
    } catch (error) {
      Logger.error(
        "Grok chatbot error:",
        error.response?.data || error.message
      );

      if (error.response?.status === this.HTTP_UNAUTHORIZED) {
        throw new Error("Invalid Grok API key");
      } else if (error.response?.status === this.HTTP_FORBIDDEN) {
        throw new Error(
          "Insufficient credits or access denied for Grok API. Please check your xAI plan."
        );
      } else if (error.response?.status === this.HTTP_TOO_MANY_REQUESTS) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Request timeout. Please try again.");
      }

      throw new Error("Failed to get response from Grok. Please try again.");
    }
  }

  /**
   * Stream chat response from Grok API
   * Returns an Axios stream (Node.js Readable) to be piped to the client
   */
  async streamChat(messages, context = {}) {
    if (!this.isConfigured()) {
      throw new Error(
        "Grok API is not configured. Please add GROK_API_KEY to your .env file."
      );
    }

    const systemPrompt = this.buildSystemPrompt(context);

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: this.DEFAULT_TEMPERATURE,
          max_tokens: this.DEFAULT_MAX_TOKENS,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: this.REQUEST_TIMEOUT_MS,
          responseType: "stream",
        }
      );

      return response.data; // Node Readable stream
    } catch (error) {
      Logger.error(
        "Grok chatbot stream error:",
        error.response?.data || error.message
      );

      if (error.response?.status === this.HTTP_UNAUTHORIZED) {
        throw new Error("Invalid Grok API key");
      } else if (error.response?.status === this.HTTP_FORBIDDEN) {
        throw new Error(
          "Insufficient credits or access denied for Grok API. Please check your xAI plan."
        );
      } else if (error.response?.status === this.HTTP_TOO_MANY_REQUESTS) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Request timeout. Please try again.");
      }

      throw new Error("Failed to start streaming from Grok.");
    }
  }

  /**
   * Development fallback streamer: yields tokens for a static message
   */
  getDevFallbackStreamer(message) {
    const chunks = message.split(/(\s+)/);
    let i = 0;
    return {
      next() {
        if (i >= chunks.length) return { done: true };
        const value = chunks[i++];
        return { value, done: false };
      },
    };
  }

  /**
   * Validate Grok API key by making a minimal request
   * Only call this when explicitly requested to avoid extra cost/latency
   * @returns {Promise<{ valid: boolean, reason?: string }>}
   */
  async validateKey() {
    if (!this.isConfigured()) {
      return { valid: false, reason: "Missing GROK_API_KEY" };
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          // Minimal payload: short prompt & tiny token budget
          messages: [
            { role: "system", content: "You are a health check bot." },
            { role: "user", content: "ping" },
          ],
          max_tokens: 1,
          temperature: 0,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: Math.min(
            this.REQUEST_TIMEOUT_MS,
            this.VALIDATION_TIMEOUT_MS
          ),
        }
      );

      const ok = Array.isArray(response.data?.choices);
      return { valid: !!ok };
    } catch (error) {
      if (error.response?.status === this.HTTP_UNAUTHORIZED) {
        return { valid: false, reason: "Invalid Grok API key" };
      }
      if (error.response?.status === this.HTTP_FORBIDDEN) {
        return { valid: false, reason: "Team has no credits or access denied" };
      }
      if (error.response?.status === this.HTTP_TOO_MANY_REQUESTS) {
        return { valid: true, reason: "Rate limited during validation" };
      }
      return { valid: false, reason: "Validation request failed" };
    }
  }

  /**
   * Build system prompt with user context
   * @param {Object} context - User context information
   * @returns {string} System prompt
   */
  buildSystemPrompt(context) {
    const { role, experienceLevel, currentPage, userName, recentPerformance } =
      context;

    let prompt = `You are MockMate AI Assistant, a specialized interview coaching chatbot EXCLUSIVELY for the MockMate interview preparation platform.

🎯 STRICT SCOPE - YOU MUST ONLY ANSWER QUESTIONS ABOUT:
- Interview preparation strategies (behavioral, technical, system design)
- MockMate platform features (dashboard, analytics, practice sessions, scheduling)
- Interview question types and how to answer them (STAR method, technical problem-solving)
- User progress tracking and performance analysis
- Interview tips, common mistakes, and best practices
- Platform navigation and settings

🚫 REFUSE ALL QUESTIONS ABOUT:
- General knowledge unrelated to interviews
- Current events, politics, or news
- Entertainment, sports, or celebrity topics
- Personal advice outside interview context
- Coding help not related to interview preparation
- Any topic outside MockMate or interview preparation

IF USER ASKS OFF-TOPIC: Politely say "I'm specialized in interview preparation and MockMate features. Please ask me about interview strategies, practice sessions, or how to use MockMate effectively!"

Your communication style:
- Friendly, motivational, and professional
- Specific and actionable advice
- Well-structured responses with examples
- Honest about challenges while staying positive

Current user context:`;

    if (userName) {
      prompt += `\n- Name: ${userName}`;
    }
    if (role) {
      prompt += `\n- Target Role: ${role}`;
    }
    if (experienceLevel) {
      prompt += `\n- Experience Level: ${experienceLevel}`;
    }
    if (currentPage) {
      prompt += `\n- Current Page: ${currentPage}`;
    }
    if (recentPerformance) {
      prompt += `\n- Recent Performance: ${JSON.stringify(recentPerformance)}`;
    }

    prompt += `\n\nKey interview strategies to teach:
- STAR method for behavioral questions (Situation, Task, Action, Result)
- Technical problem-solving approach (clarify, outline, code, test)
- System design frameworks (requirements, architecture, trade-offs)
- Common interview mistakes and how to avoid them
- Time management during interviews
- How to handle difficult questions

MockMate features you can explain:
- AI-powered mock interviews with real-time feedback
- Performance analytics and progress tracking
- Question bank with various difficulty levels
- Scheduling practice sessions
- Video recording and playback
- Emotion and facial analysis
- Results dashboard with actionable insights

REMEMBER: Stay strictly within interview prep and MockMate scope. Redirect ANY off-topic questions politely but firmly.`;

    return prompt;
  }

  /**
   * Build user context from profile and current state
   * @param {Object} user - User profile object
   * @param {string} currentPage - Current page path
   * @param {Object} additionalContext - Additional context data
   * @returns {Object} Formatted context
   */
  buildUserContext(user, currentPage, additionalContext = {}) {
    return {
      userName: user?.firstName || user?.username,
      role: user?.professionalInfo?.currentRole || user?.targetRole,
      experienceLevel:
        user?.professionalInfo?.experience || user?.experienceLevel,
      currentPage: this.getPageName(currentPage),
      ...additionalContext,
    };
  }

  /**
   * Map route path to friendly page name
   * @param {string} path - URL path
   * @returns {string} Friendly page name
   */
  getPageName(path) {
    const pageMap = {
      "/dashboard": "Dashboard",
      "/interview/new": "Create Interview",
      "/interview/create": "Create Interview",
      "/interviews": "Interview History",
      "/interview": "Interview Session",
      "/questions": "Question Bank",
      "/practice": "Practice Sessions",
      "/resources": "Resources",
      "/scheduled": "Scheduled Sessions",
      "/settings": "Settings",
      "/reports": "Reports",
      "/results": "Interview Results",
      "/onboarding": "Onboarding",
    };

    // Try exact match first
    if (pageMap[path]) {
      return pageMap[path];
    }

    // Try partial match for dynamic routes
    for (const [route, name] of Object.entries(pageMap)) {
      if (path?.startsWith(route)) {
        return name;
      }
    }

    return path || "MockMate";
  }
}

module.exports = new GrokChatbotService();
