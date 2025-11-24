const OpenAI = require("openai");
const Logger = require("../utils/logger");

class EmbeddingService {
  constructor() {
    this.provider = process.env.EMBEDDING_PROVIDER || "openai";
    this.model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    this.dimensions = 1536; // default for text-embedding-3-small

    if (this.provider === "openai") {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY is missing. Add it to server/.env (or set EMBEDDING_PROVIDER to a supported alternative)."
        );
      }
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      throw new Error(
        `Unsupported EMBEDDING_PROVIDER '${this.provider}'. Only 'openai' is currently implemented.`
      );
    }

    // Tuning parameters for batching & retry
    this.maxChunkSize = parseInt(process.env.EMBEDDING_CHUNK_SIZE || "64", 10); // inputs per API call
    this.maxRetries = parseInt(process.env.EMBEDDING_MAX_RETRIES || "5", 10);
    this.baseDelayMs = parseInt(
      process.env.EMBEDDING_RETRY_BASE_DELAY_MS || "1000",
      10
    );
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

      const allEmbeddings = [];
      for (let i = 0; i < texts.length; i += this.maxChunkSize) {
        const chunk = texts.slice(i, i + this.maxChunkSize);
        const truncatedChunk = chunk.map((text) => text.substring(0, 30000));
        const attemptResult = await this._retryEmbeddingRequest(truncatedChunk);
        allEmbeddings.push(...attemptResult);
        Logger.debug(
          `[EmbeddingService] Embedded ${Math.min(
            i + this.maxChunkSize,
            texts.length
          )}/${texts.length} items`
        );
      }
      return allEmbeddings;
    } catch (error) {
      Logger.error(
        "[EmbeddingService] Error creating batch embeddings:",
        error
      );
      throw error;
    }
  }

  async _retryEmbeddingRequest(inputArray) {
    let attempt = 0;
    while (true) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: inputArray,
        });
        return response.data.map((item) => item.embedding);
      } catch (error) {
        const isQuota =
          error?.code === "insufficient_quota" ||
          error?.error?.code === "insufficient_quota";
        const isRateLimit = error?.status === 429 && !isQuota;
        if (isQuota) {
          Logger.error(
            "[EmbeddingService] Insufficient quota. Cannot continue indexing. Consider switching EMBEDDING_PROVIDER or adding credits."
          );
          throw error;
        }
        if (isRateLimit && attempt < this.maxRetries) {
          attempt += 1;
          const delay = this._computeBackoffDelay(attempt);
          Logger.warn(
            `[EmbeddingService] 429 rate limit. Retry attempt ${attempt}/${this.maxRetries} after ${delay}ms...`
          );
          await this._sleep(delay);
          continue;
        }
        // Non-retryable error or max attempts exceeded
        throw error;
      }
    }
  }

  _computeBackoffDelay(attempt) {
    const jitter = Math.floor(Math.random() * 250);
    return this.baseDelayMs * Math.pow(2, attempt - 1) + jitter;
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new EmbeddingService();
