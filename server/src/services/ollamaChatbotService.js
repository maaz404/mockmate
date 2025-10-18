const axios = require("axios");

const OLLAMA_URL =
  process.env.OLLAMA_API_URL || "http://localhost:11434/api/chat";
const MODEL = process.env.OLLAMA_MODEL || "phi3:mini";

function buildSystemPrompt(context) {
  return `
You are MockMate AI Assistant. You must ONLY answer questions about interview preparation, MockMate features, or related topics. 
If a user asks about anything else, politely reply: "Sorry, I can only help with interview preparation and MockMate-related questions."
${context?.currentPage ? `Current page: ${context.currentPage}` : ""}
${context?.userName ? `User: ${context.userName}` : ""}
`;
}

module.exports = {
  async chat(messages, context = {}) {
    const systemPrompt = buildSystemPrompt(context);
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    try {
      const response = await axios.post(OLLAMA_URL, {
        model: MODEL,
        messages: ollamaMessages,
        stream: false, // <--- This tells Ollama to return a single JSON object
      });
      // Now response.data.message.content should exist
      const message =
        response.data?.message?.content ||
        response.data?.message ||
        response.data?.response ||
        "Sorry, I couldn't understand the response from Ollama.";

      return {
        message,
        provider: "ollama",
        model: MODEL,
      };
    } catch (error) {
      console.error("Ollama API error:", error.message);
      return {
        message:
          "Sorry, the AI assistant is currently unavailable. Please try again later.",
        provider: "ollama",
        model: MODEL,
        error: true,
      };
    }
  },
};
