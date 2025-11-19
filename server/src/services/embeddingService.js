const OpenAI = require("openai");
const Logger = require("../utils/logger");

class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = "text-embedding-3-small";
    this.dimensions = 1536;
  }

  /**
   * Generate embedding for text
   */
  async createEmbedding(text) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error("Text is required for embedding");
      }

      // Truncate if too long (OpenAI limit: ~8000 tokens)
      const truncatedText = text.substring(0, 30000);

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: truncatedText,
      });

      return response.data[0].embedding;
    } catch (error) {
      Logger.error("[EmbeddingService] Error creating embedding:", error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async createEmbeddings(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error("Texts array is required");
      }

      // Truncate each text
      const truncatedTexts = texts.map((text) => text.substring(0, 30000));

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: truncatedTexts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      Logger.error(
        "[EmbeddingService] Error creating batch embeddings:",
        error
      );
      throw error;
    }
  }
}

module.exports = new EmbeddingService();
