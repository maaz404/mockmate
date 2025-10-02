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

// Protected chat endpoints
router.post("/chat", auth, chatbotController.chat);
router.get("/suggestions", auth, chatbotController.getChatSuggestions);
router.post("/stream", auth, chatbotController.stream);

module.exports = router;
