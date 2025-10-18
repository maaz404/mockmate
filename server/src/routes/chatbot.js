const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const auth = require("../middleware/auth");

/**
 * Chatbot Routes
 * Base: /api/chatbot
 */

// Public health check
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Protected chat endpoints (allow unauthenticated access in development to enable dev fallback)
const ensureAuthenticated =
  process.env.NODE_ENV === "production" ? auth : (req, res, next) => next();

router.post("/chat", ensureAuthenticated, chatbotController.chat);
router.get("/suggestions", ensureAuthenticated, chatbotController.getChatSuggestions);
router.post("/stream", ensureAuthenticated, chatbotController.stream);

module.exports = router;
