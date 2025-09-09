const express = require("express");
const router = express.Router();

// @desc    Generate questions
// @route   POST /api/questions/generate
// @access  Private
router.post("/generate", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Generate questions endpoint - Coming soon",
  });
});

module.exports = router;
