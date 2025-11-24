// Multilingual configuration
module.exports = {
  SUPPORTED_LANGUAGES: ["en", "fr", "es", "de", "ur"],
  DEFAULT_LANGUAGE: "en",
  isSupported(code) {
    return this.SUPPORTED_LANGUAGES.includes((code || "").toLowerCase());
  },
};
