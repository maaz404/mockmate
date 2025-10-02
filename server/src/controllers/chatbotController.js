/* eslint-disable consistent-return, no-magic-numbers */
const grokChatbotService = require("../services/grokChatbotService");
const UserProfile = require("../models/UserProfile");
const Logger = require("../utils/logger");

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

    res.json({
      status: "ok",
      chatbot: {
        provider: "Grok (xAI)",
        available: isConfigured,
        model: process.env.GROK_MODEL || "grok-beta",
        validation,
      },
    });
  } catch (error) {
    Logger.error("Chatbot health check error:", error);
    res.status(500).json({
      error: "Failed to check chatbot status",
    });
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
    const userId = req.auth.userId || req.auth.id;

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages array is required and cannot be empty",
      });
    }

    // Check if Grok is configured
    if (!grokChatbotService.isConfigured()) {
      return res.status(503).json({
        error: "Chatbot is not configured. Please contact support.",
      });
    }

    // Get user profile for better context
    let userProfile = null;
    try {
      userProfile = await UserProfile.findOne({ clerkUserId: userId });
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

    // Get response from Grok
    const response = await grokChatbotService.chat(messages, enhancedContext);

    res.json({
      message: response.message,
      timestamp: new Date().toISOString(),
      provider: "grok",
      model: response.model,
    });
  } catch (error) {
    Logger.error("Chat controller error:", error);

    // In development, provide a graceful fallback response instead of erroring
    if (process.env.NODE_ENV !== "production") {
      return res.json({
        message:
          "I'm having trouble connecting to Grok right now. Here are some quick tips while I reconnect:\n\n" +
          "- Be concise and structure answers with a brief intro, 2-3 points, and a closing.\n" +
          "- For behavioral questions, use STAR (Situation, Task, Action, Result).\n" +
          "- For coding, clarify constraints, outline approach, then code and test.\n\n" +
          "You can also ask me: ‘Explain this page’, ‘Common mistakes to avoid’, or ‘How to improve for my next interview’.",
        timestamp: new Date().toISOString(),
        provider: "fallback",
        model: "mock",
      });
    }

    // Send user-friendly error messages
    if (error.message.includes("not configured")) {
      return res.status(503).json({
        error:
          "Chatbot service is currently unavailable. Please try again later.",
      });
    }

    if (error.message.includes("Rate limit")) {
      return res.status(429).json({
        error: "Too many requests. Please wait a moment and try again.",
      });
    }

    if (
      error.message.includes("Invalid") &&
      error.message.includes("API key")
    ) {
      return res.status(500).json({
        error: "Chatbot service configuration error. Please contact support.",
        code: "GROK_INVALID_API_KEY",
      });
    }

    if (
      error.message.includes("Insufficient credits") ||
      error.message.includes("access denied")
    ) {
      // 402 - Payment Required-like signal
      return res.status(402).json({
        error:
          "Grok API is unavailable due to insufficient credits or access. Please add credits on xAI console.",
        code: "GROK_NO_CREDITS",
      });
    }

    res.status(500).json({
      error: "Failed to process your message. Please try again.",
      code: "GROK_CHAT_ERROR",
    });
  }
};

/**
 * Get chat suggestions
 * @route GET /api/chatbot/suggestions
 * @access Private
 */
exports.getChatSuggestions = async (req, res) => {
  try {
    const userId = req.auth.userId || req.auth.id;
    let userProfile = null;

    try {
      userProfile = await UserProfile.findOne({ clerkUserId: userId });
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
    res.json({ suggestions: suggestions.slice(0, 5) });
  } catch (error) {
    Logger.error("Get chat suggestions error:", error);
    res.status(500).json({
      error: "Failed to fetch suggestions",
    });
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
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { messages, context } = req.body || {};
    const userId = req.auth.userId || req.auth.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      send("error", {
        error: "Messages array is required and cannot be empty",
      });
      return res.end();
    }

    // Enrich context with user profile (best-effort)
    let userProfile = null;
    try {
      userProfile = await UserProfile.findOne({ clerkUserId: userId });
    } catch (e) {
      // ignore
    }
    const enhancedContext = grokChatbotService.buildUserContext(
      userProfile,
      context?.currentPage,
      context
    );

    // Try Grok streaming
    if (grokChatbotService.isConfigured()) {
      try {
        const stream = await grokChatbotService.streamChat(
          messages,
          enhancedContext
        );
        // Pipe Grok's byte stream; translate to SSE lines
        stream.on("data", (chunk) => {
          const text = chunk.toString();
          // xAI streams JSON lines/partial; send raw and let client assemble
          send("chunk", { text });
        });
        stream.on("end", () => {
          send("done", { timestamp: new Date().toISOString() });
          res.end();
        });
        stream.on("error", (err) => {
          send("error", { error: err.message });
          res.end();
        });
        return;
      } catch (err) {
        // fall through to dev fallback streamer
        send("notice", { note: "Falling back to dev streamer" });
      }
    }

    // Dev fallback streaming
    const fallback = grokChatbotService.getDevFallbackStreamer(
      "Here is a helpful response while the live AI reconnects. Use STAR for behavioral answers; for coding, clarify constraints, outline, implement, and test."
    );
    let step = fallback.next();
    const interval = setInterval(() => {
      if (step.done) {
        clearInterval(interval);
        send("done", { timestamp: new Date().toISOString() });
        return res.end();
      }
      send("chunk", { text: step.value });
      step = fallback.next();
    }, 30);
  } catch (error) {
    send("error", { error: "Failed to start stream" });
    res.end();
  }
};
