const express = require("express");
const router = express.Router();
const translationService = require("../services/translationService");
const { ok, fail } = require("../utils/responder");

router.post("/translate", async (req, res) => {
  try {
    const { texts = [], targetLanguage = "en" } = req.body || {};
    if (!Array.isArray(texts) || !texts.length) {
      return fail(res, 400, "NO_TEXTS", "texts array is required");
    }
    const translated = await translationService.translateArray(
      texts,
      targetLanguage
    );
    return ok(res, { translated, language: targetLanguage });
  } catch (err) {
    return fail(res, 500, "TRANSLATION_FAILED", err.message);
  }
});

module.exports = router;
