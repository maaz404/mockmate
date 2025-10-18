/* eslint-disable consistent-return, no-magic-numbers */
const ollamaChatbotService = require("../services/ollamaChatbotService");
const UserProfile = require("../models/UserProfile");
const { ok, fail } = require("../utils/responder");
const Logger = require("../utils/logger");

// Health check for chatbot service (Ollama always available if running)
exports.health = async (req, res) => {
  return ok(res, {
    chatbot: {
      provider: "ollama",
      available: true,
      model: process.env.OLLAMA_MODEL || "phi3:mini",
      diagnostics: {
        env: process.env.NODE_ENV,
      },
    },
    requestId: req.requestId,
  });
};

/**
 * Chat with AI assistant
 * @route POST /api/chatbot/chat
 * @access Private
 */
exports.chat = async (req, res) => {
  try {
    const { messages, context } = req.body;
    const userId = req.auth?.userId || req.auth?.id;

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return fail(
        res,
        400,
        "CHAT_MISSING_MESSAGES",
        "Messages array is required and cannot be empty"
      );
    }

    // Get user profile for better context
    let userProfile = null;
    try {
      if (userId) {
        userProfile = await UserProfile.findOne({ userId });
      }
    } catch (error) {
      Logger.warn(
        "Could not fetch user profile for chatbot context:",
        error.message
      );
    }

    // Build context for Ollama
    const enhancedContext = {
      userName: userProfile?.firstName || userProfile?.username,
      currentPage: context?.currentPage,
      ...context,
    };

    // Get response from Ollama
    const response = await ollamaChatbotService.chat(messages, enhancedContext);
    return ok(res, {
      message: response.message,
      provider: "ollama",
      model: response.model,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  } catch (error) {
    Logger.error("Chat controller error:", error);

    // In development, provide a graceful fallback response instead of erroring
    if (process.env.NODE_ENV !== "production") {
      return ok(res, {
        message:
          "I'm having trouble connecting to the AI right now. Please ensure Ollama is running.",
        provider: "dev-fallback",
        model: "mock",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
    return fail(
      res,
      500,
      "OLLAMA_CHAT_ERROR",
      "Failed to process your message. Please try again.",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
  }
};

/**
 * Get chat suggestions
 * @route GET /api/chatbot/suggestions
 * @access Private
 */
exports.getChatSuggestions = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.auth?.id;
    let userProfile = null;

    try {
      userProfile = await UserProfile.findOne({ userId });
    } catch (error) {
      Logger.warn(
        "Could not fetch user profile for suggestions:",
        error.message
      );
    }

    // Context-aware suggestions
    const suggestions = [
      "How can I improve my interview performance?",
      "What are common mistakes in technical interviews?",
      "Tips for answering behavioral questions",
      "How do I prepare for system design interviews?",
    ];

    // Add personalized suggestions based on user profile
    if (userProfile?.professionalInfo?.currentRole) {
      suggestions.unshift(
        `How should I prepare for a ${userProfile.professionalInfo.currentRole} interview?`
      );
    }

    // Limit to 5 suggestions
    return ok(res, {
      suggestions: suggestions.slice(0, 5),
      requestId: req.requestId,
    });
  } catch (error) {
    Logger.error("Get chat suggestions error:", error);
    return fail(
      res,
      500,
      "CHATBOT_SUGGESTIONS_FAILED",
      "Failed to fetch suggestions",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
  }
};

/**
 * Stream chat responses (Server-Sent Events)
 * @route POST /api/chatbot/stream
 * @access Private
 */
exports.stream = async (req, res) => {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    const enriched = { ...data, requestId: req.requestId };
    res.write(`data: ${JSON.stringify(enriched)}\n\n`);
  };

  try {
    const { messages, context } = req.body || {};
    const userId = req.auth?.userId || req.auth?.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      send("error", {
        error: "Messages array is required and cannot be empty",
        code: "CHAT_MISSING_MESSAGES",
      });
      return res.end();
    }

    // Enrich context with user profile (best-effort)
    let userProfile = null;
    try {
      userProfile = await UserProfile.findOne({ userId });
    } catch (e) {
      // ignore
    }
    // Build context for Ollama
    const enhancedContext = {
      userName: userProfile?.firstName || userProfile?.username,
      currentPage: context?.currentPage,
      ...context,
    };

    try {
      const response = await ollamaChatbotService.chat(
        messages,
        enhancedContext
      );
      send("chunk", {
        text: response.message,
        source: "ollama",
        provider: "ollama",
      });
      send("done", {
        timestamp: new Date().toISOString(),
        provider: "ollama",
      });
      res.end();
    } catch (error) {
      send("error", {
        error: "Failed to get response from Ollama",
        code: "OLLAMA_CHAT_ERROR",
      });
      res.end();
    }
  } catch (error) {
    send("error", {
      error: "Failed to start stream",
      code: "CHAT_STREAM_START_FAILED",
    });
    res.end();
  }
};
