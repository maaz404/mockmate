/* eslint-disable consistent-return, no-magic-numbers */
const aiProviderManager = require("../services/aiProviders");
const grokChatbotService = require("../services/grokChatbotService");
const UserProfile = require("../models/UserProfile");
const Logger = require("../utils/logger");
const { ok, fail } = require("../utils/responder");

/**
 * Health check for chatbot service
 * @route GET /api/chatbot/health
 * @access Public
 */
exports.health = async (req, res) => {
  try {
    const isConfigured = grokChatbotService.isConfigured();
    let validation = null;
    if (req.query.validate === "true") {
      try {
        validation = await grokChatbotService.validateKey();
      } catch (e) {
        validation = { valid: false, reason: "Validation failed" };
      }
    }
    return ok(res, {
      chatbot: {
        provider: "grok",
        available: isConfigured,
        model: process.env.GROK_MODEL || "grok-beta",
        validation,
        diagnostics: {
          hasApiKey: !!process.env.GROK_API_KEY,
          env: process.env.NODE_ENV,
          openAIFallbackEnabled:
            (
              process.env.GROK_ENABLE_OPENAI_FALLBACK || "true"
            ).toLowerCase() === "true",
          appOnlyMode:
            (process.env.CHATBOT_APP_ONLY || "false").toLowerCase() === "true",
        },
      },
      requestId: req.requestId,
    });
  } catch (error) {
    Logger.error("Chatbot health check error:", error);
    return fail(
      res,
      500,
      "CHATBOT_HEALTH_FAILED",
      "Failed to check chatbot status",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
  }
};

/**
 * Chat with AI assistant
 * @route POST /api/chatbot/chat
 * @access Private
 */
exports.chat = async (req, res) => {
  try {
    const { messages, context } = req.body;
    // CHANGED: const userId = req.auth?.userId || req.auth?.id; → const userId = req.user?.id;
    const userId = req.user?.id;

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return fail(
        res,
        400,
        "CHAT_MISSING_MESSAGES",
        "Messages array is required and cannot be empty"
      );
    }

    // If Grok is not configured, deliberately throw to engage dev fallback (non-prod)
    if (!grokChatbotService.isConfigured()) {
      throw new Error("Chatbot not configured");
    }

    // Get user profile for better context
    let userProfile = null;
    try {
      if (userId) {
        // CHANGED: clerkUserId → user
        userProfile = await UserProfile.findOne({ user: userId });
      }
    } catch (error) {
      Logger.warn(
        "Could not fetch user profile for chatbot context:",
        error.message
      );
    }

    // Build enhanced context
    const enhancedContext = grokChatbotService.buildUserContext(
      userProfile,
      context?.currentPage,
      context
    );

    // Get response using AI provider manager (Groq for chatbot)
    try {
      const response = await aiProviderManager.chat(messages, enhancedContext);
      return ok(res, {
        message: response,
        provider: "groq",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (primaryErr) {
      Logger.warn(
        "Primary AI provider chat failed, attempting fallback:",
        primaryErr.message
      );
      throw primaryErr; // triggers lower dev fallback section
    }
  } catch (error) {
    Logger.error("Chat controller error:", error);

    // In development, provide a graceful fallback response instead of erroring
    if (process.env.NODE_ENV !== "production") {
      return ok(res, {
        message:
          "I'm having trouble connecting to Grok right now. Here are some quick tips while I reconnect:\n\n" +
          "- Be concise and structure answers with a brief intro, 2-3 points, and a closing.\n" +
          "- For behavioral questions, use STAR (Situation, Task, Action, Result).\n" +
          "- For coding, clarify constraints, outline approach, then code and test.\n\n" +
          "You can also ask me: 'Explain this page', 'Common mistakes to avoid', or 'How to improve for my next interview'.",
        provider: "dev-fallback",
        model: "mock",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }

    // Send user-friendly error messages
    if (error.message.includes("not configured")) {
      return fail(
        res,
        503,
        "CHATBOT_UNAVAILABLE",
        "Chatbot service is currently unavailable. Please try again later."
      );
    }

    if (error.message.includes("Rate limit")) {
      return fail(
        res,
        429,
        "CHATBOT_RATE_LIMIT",
        "Too many requests. Please wait a moment and try again."
      );
    }

    if (
      error.message.includes("Invalid") &&
      error.message.includes("API key")
    ) {
      return fail(
        res,
        500,
        "GROK_INVALID_API_KEY",
        "Chatbot service configuration error. Please contact support."
      );
    }

    if (
      error.message.includes("Insufficient credits") ||
      error.message.includes("access denied")
    ) {
      return fail(
        res,
        402,
        "GROK_NO_CREDITS",
        "Grok API is unavailable due to insufficient credits or access. Please add credits on xAI console."
      );
    }
    return fail(
      res,
      500,
      "GROK_CHAT_ERROR",
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
exports.getSuggestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { interviewId } = req.params;
    let userProfile = null;

    try {
      userProfile = await UserProfile.findOne({ user: userId });
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
 * Get chat history for an interview
 * @route GET /api/chatbot/history/:interviewId
 * @access Private
 */
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { interviewId } = req.params;

    if (!interviewId) {
      return fail(res, 400, "MISSING_INTERVIEW_ID", "Interview ID is required");
    }

    // TODO: Implement chat history storage/retrieval
    // For now, return empty array as placeholder
    const history = [];

    return ok(res, {
      history,
      interviewId,
      requestId: req.requestId,
    });
  } catch (error) {
    Logger.error("Get chat history error:", error);
    return fail(
      res,
      500,
      "CHAT_HISTORY_FAILED",
      "Failed to fetch chat history",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
  }
};

/**
 * Clear chat history for an interview
 * @route DELETE /api/chatbot/history/:interviewId
 * @access Private
 */
exports.clearChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { interviewId } = req.params;

    if (!interviewId) {
      return fail(res, 400, "MISSING_INTERVIEW_ID", "Interview ID is required");
    }

    // TODO: Implement chat history clearing
    // For now, return success
    Logger.info(
      `Clearing chat history for interview ${interviewId}, user ${userId}`
    );

    return ok(
      res,
      {
        cleared: true,
        interviewId,
        requestId: req.requestId,
      },
      "Chat history cleared successfully"
    );
  } catch (error) {
    Logger.error("Clear chat history error:", error);
    return fail(
      res,
      500,
      "CLEAR_HISTORY_FAILED",
      "Failed to clear chat history",
      process.env.NODE_ENV === "development"
        ? { detail: error.message }
        : undefined
    );
  }
};

/**
 * Update chatbot context
 * @route POST /api/chatbot/context
 * @access Private
 */
exports.updateContext = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { context } = req.body;

    if (!context) {
      return fail(res, 400, "MISSING_CONTEXT", "Context data is required");
    }

    // TODO: Implement context persistence if needed
    // For now, acknowledge the context update
    Logger.info(`Context updated for user ${userId}`);

    return ok(
      res,
      {
        updated: true,
        context,
        requestId: req.requestId,
      },
      "Context updated successfully"
    );
  } catch (error) {
    Logger.error("Update context error:", error);
    return fail(
      res,
      500,
      "UPDATE_CONTEXT_FAILED",
      "Failed to update context",
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

  let heartbeatInterval;
  const startHeartbeat = () => {
    heartbeatInterval = setInterval(() => {
      try {
        send("ping", { ts: Date.now() });
      } catch (e) {
        clearInterval(heartbeatInterval);
      }
    }, 15000);
  };

  try {
    const { messages, context } = req.body || {};
    // CHANGED: const userId = req.auth?.userId || req.auth?.id;
    const userId = req.user?.id;

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
      // CHANGED: clerkUserId → user
      userProfile = await UserProfile.findOne({ user: userId });
    } catch (e) {
      // ignore
    }
    const enhancedContext = grokChatbotService.buildUserContext(
      userProfile,
      context?.currentPage,
      context
    );

    // Try streaming with AI provider manager (Groq for chatbot)
    try {
      startHeartbeat();

      await aiProviderManager.streamChat(
        messages,
        (chunk) => {
          send("chunk", { text: chunk, source: "groq", provider: "groq" });
        },
        enhancedContext
      );

      send("done", {
        timestamp: new Date().toISOString(),
        provider: "groq",
      });
      clearInterval(heartbeatInterval);
      res.end();
      return;
    } catch (err) {
      Logger.warn(
        "Streaming failed, using non-streaming response:",
        err.message
      );
      try {
        const result = await aiProviderManager.chat(messages, enhancedContext);
        send("chunk", {
          text: result,
          source: "fallback",
          provider: "groq",
          fallback: true,
        });
        send("done", {
          timestamp: new Date().toISOString(),
          provider: "groq",
          fallback: true,
        });
        return res.end();
      } catch (inner) {
        send("notice", { note: "Using development fallback response" });
      }
    }

    // Development static streamer fallback
    const fallback = grokChatbotService.getDevFallbackStreamer(
      "Here is a helpful response while the live AI reconnects. Use STAR for behavioral answers; for coding, clarify constraints, outline, implement, and test."
    );
    let step = fallback.next();
    startHeartbeat();
    const interval = setInterval(() => {
      if (step.done) {
        clearInterval(interval);
        clearInterval(heartbeatInterval);
        send("done", {
          timestamp: new Date().toISOString(),
          source: "dev-fallback",
          provider: "dev-fallback",
        });
        return res.end();
      }
      send("chunk", {
        text: step.value,
        source: "dev-fallback",
        provider: "dev-fallback",
      });
      step = fallback.next();
    }, 30);
  } catch (error) {
    send("error", {
      error: "Failed to start stream",
      code: "CHAT_STREAM_START_FAILED",
    });
    clearInterval(heartbeatInterval);
    res.end();
  }
};

module.exports = exports;
