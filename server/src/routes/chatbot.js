const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const chatbotController = require("../controllers/chatbotController");

/**
 * Chatbot Routes
 * Base: /api/chatbot
 */

// Public health check
router.get("/health", chatbotController.health);

// Protected routes
router.post("/chat", requireAuth, chatbotController.chat);
router.post("/stream", requireAuth, chatbotController.stream);
router.get("/suggestions", requireAuth, chatbotController.getSuggestions);
router.get(
  "/history/:interviewId",
  requireAuth,
  chatbotController.getChatHistory
);
router.delete(
  "/history/:interviewId",
  requireAuth,
  chatbotController.clearChatHistory
);
router.post("/context", requireAuth, chatbotController.updateContext);
router.get(
  "/suggestions/:interviewId",
  requireAuth,
  chatbotController.getSuggestions
);

module.exports = router;
