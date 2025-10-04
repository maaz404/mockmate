/* eslint-disable consistent-return, no-magic-numbers */
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
    const userId = req.auth.userId || req.auth.id;

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return fail(
        res,
        400,
        "CHAT_MISSING_MESSAGES",
        "Messages array is required and cannot be empty"
      );
    }

    // Check if Grok is configured
    if (!grokChatbotService.isConfigured()) {
      return fail(
        res,
        503,
        "CHATBOT_UNCONFIGURED",
        "Chatbot is not configured. Please contact support."
      );
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
    try {
      const response = await grokChatbotService.chat(messages, enhancedContext);
      return ok(res, {
        message: response.message,
        provider: "grok",
        model: response.model,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (primaryErr) {
      Logger.warn(
        "Primary Grok chat failed, attempting OpenAI fallback:",
        primaryErr.message
      );
      try {
        const fb = await grokChatbotService.openAIFallback(
          messages,
          enhancedContext
        );
        return ok(res, {
          message: fb.message,
          provider: fb.provider,
          model: fb.model,
          timestamp: new Date().toISOString(),
          fallback: true,
          requestId: req.requestId,
        });
      } catch (fbErr) {
        Logger.warn(
          "OpenAI fallback also failed, reverting to dev fallback response:",
          fbErr.message
        );
        throw primaryErr; // triggers lower dev fallback section
      }
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
          "You can also ask me: ‘Explain this page’, ‘Common mistakes to avoid’, or ‘How to improve for my next interview’.",
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
      // 402 - Payment Required-like signal
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
    const userId = req.auth.userId || req.auth.id;

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
      userProfile = await UserProfile.findOne({ clerkUserId: userId });
    } catch (e) {
      // ignore
    }
    const enhancedContext = grokChatbotService.buildUserContext(
      userProfile,
      context?.currentPage,
      context
    );

    // Try Grok streaming first
    if (grokChatbotService.isConfigured()) {
      try {
        const stream = await grokChatbotService.streamChat(
          messages,
          enhancedContext
        );
        let buffer = "";
        stream.on("data", (chunk) => {
          const piece = chunk.toString();
          buffer += piece;
          // Grok may emit JSON lines delimited by newlines
          const parts = buffer.split(/\n/);
          buffer = parts.pop();
          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            // Attempt to parse JSON structure {choices:[{delta:{content:..}}]}
            try {
              const maybe = JSON.parse(trimmed);
              const text =
                maybe.choices?.[0]?.delta?.content || maybe.text || "";
              if (text) send("chunk", { text, source: "grok" });
            } catch {
              // fallback: treat raw text
              send("chunk", { text: trimmed, source: "grok-raw" });
            }
          }
        });
        stream.on("end", () => {
          if (buffer.trim())
            send("chunk", { text: buffer.trim(), source: "grok-tail" });
          send("done", {
            timestamp: new Date().toISOString(),
            provider: "grok",
          });
          res.end();
        });
        stream.on("error", (err) => {
          send("error", { error: err.message, code: "CHAT_STREAM_ERROR" });
          res.end();
        });
        return; // streaming path succeeded
      } catch (err) {
        // Attempt non-streaming fallback before dev static
        try {
          const result = await grokChatbotService.chat(
            messages,
            enhancedContext
          );
          send("chunk", { text: result.message, source: "grok-fallback" });
          send("done", {
            timestamp: new Date().toISOString(),
            provider: "grok",
            fallback: true,
          });
          return res.end();
        } catch (inner) {
          // Attempt OpenAI fallback before dev static
          try {
            const alt = await grokChatbotService.openAIFallback(
              messages,
              enhancedContext
            );
            send("chunk", { text: alt.message, source: "openai-fallback" });
            send("done", {
              timestamp: new Date().toISOString(),
              provider: alt.provider,
              fallback: true,
            });
            return res.end();
          } catch (altErr) {
            send("notice", { note: "Using development fallback response" });
          }
        }
      }
    }

    // Development static streamer fallback
    const fallback = grokChatbotService.getDevFallbackStreamer(
      "Here is a helpful response while the live AI reconnects. Use STAR for behavioral answers; for coding, clarify constraints, outline, implement, and test."
    );
    let step = fallback.next();
    const interval = setInterval(() => {
      if (step.done) {
        clearInterval(interval);
        send("done", {
          timestamp: new Date().toISOString(),
          source: "dev-fallback",
          provider: "dev-fallback",
        });
        return res.end();
      }
      send("chunk", { text: step.value, source: "dev-fallback" });
      step = fallback.next();
    }, 30);
  } catch (error) {
    send("error", {
      error: "Failed to start stream",
      code: "CHAT_STREAM_START_FAILED",
    });
    res.end();
  }
};
