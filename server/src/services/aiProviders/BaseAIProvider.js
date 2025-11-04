/**
 * Base AI Provider Interface
 *
 * Abstract base class that all AI providers must implement.
 * Provides common functionality for error handling, retries, and logging.
 */

class BaseAIProvider {
  constructor(providerName, apiKey, config = {}) {
    this.providerName = providerName;
    this.apiKey = apiKey;
    this.config = config;
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Check if provider is available (has API key)
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Get provider status
   */
  getStatus() {
    return {
      provider: this.providerName,
      available: this.isAvailable(),
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate:
        this.requestCount > 0
          ? ((this.errorCount / this.requestCount) * 100).toFixed(2) + "%"
          : "0%",
    };
  }

  /**
   * Increment request counter
   */
  _incrementRequests() {
    this.requestCount++;
  }

  /**
   * Increment error counter
   */
  _incrementErrors() {
    this.errorCount++;
  }

  /**
   * Log request
   */
  _logRequest(method, params) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[${this.providerName}] ${method}:`, params);
    }
  }

  /**
   * Log error
   */
  _logError(method, error) {
    console.error(`[${this.providerName}] ${method} Error:`, error.message);
  }

  /**
   * Handle API error and convert to standard format
   */
  _handleError(error, context) {
    this._incrementErrors();

    // Standard error format
    const standardError = {
      provider: this.providerName,
      context,
      message: error.message || "Unknown error",
      code: error.code || "PROVIDER_ERROR",
      status: error.status || 500,
      originalError: error,
    };

    // Check for common error types
    if (error.message?.includes("API key")) {
      standardError.code = "INVALID_API_KEY";
      standardError.status = 401;
    } else if (error.message?.includes("rate limit")) {
      standardError.code = "RATE_LIMIT_EXCEEDED";
      standardError.status = 429;
    } else if (error.message?.includes("timeout")) {
      standardError.code = "REQUEST_TIMEOUT";
      standardError.status = 408;
    } else if (error.message?.includes("quota")) {
      standardError.code = "QUOTA_EXCEEDED";
      standardError.status = 429;
    }

    return standardError;
  }

  /**
   * Retry logic with exponential backoff
   */
  async _retryWithBackoff(fn, maxAttempts = 3, initialDelayMs = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts) {
          const delay = initialDelayMs * Math.pow(2, attempt - 1);
          console.log(
            `[${this.providerName}] Retry ${attempt}/${maxAttempts} after ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // ===== METHODS TO BE IMPLEMENTED BY SUBCLASSES =====

  /**
   * Generate completion (text generation)
   * @param {string} prompt - The prompt to generate from
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated text
   */
  async generateCompletion(prompt, options = {}) {
    throw new Error("generateCompletion() must be implemented by subclass");
  }

  /**
   * Generate chat completion (conversational)
   * @param {Array} messages - Array of {role, content} messages
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Response message
   */
  async generateChatCompletion(messages, options = {}) {
    throw new Error("generateChatCompletion() must be implemented by subclass");
  }

  /**
   * Generate structured JSON response
   * @param {string} prompt - The prompt
   * @param {Object} schema - Expected JSON schema
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Parsed JSON object
   */
  async generateStructuredOutput(prompt, schema, options = {}) {
    throw new Error(
      "generateStructuredOutput() must be implemented by subclass"
    );
  }

  /**
   * Stream completion (for real-time responses)
   * @param {string} prompt - The prompt
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Generation options
   * @returns {Promise<void>}
   */
  async streamCompletion(prompt, onChunk, options = {}) {
    throw new Error("streamCompletion() must be implemented by subclass");
  }

  /**
   * Check provider health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    throw new Error("checkHealth() must be implemented by subclass");
  }
}

module.exports = BaseAIProvider;
