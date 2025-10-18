const express = require("express");
const router = express.Router();

// Public health check for chatbot
router.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

module.exports = router;
