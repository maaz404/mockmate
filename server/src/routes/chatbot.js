const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const auth = require("../middleware/auth");

/**
 * Chatbot Routes
 * Base: /api/chatbot
 */

// Public health check
router.get("/health", chatbotController.health);

// Protected chat endpoints (allow unauthenticated access in development to enable dev fallback)
const requireAuth =
  process.env.NODE_ENV === "production" ? auth : (req, res, next) => next();

router.post("/chat", requireAuth, chatbotController.chat);
router.get("/suggestions", requireAuth, chatbotController.getChatSuggestions);
router.post("/stream", requireAuth, chatbotController.stream);

module.exports = router;
