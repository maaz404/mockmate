const { Pinecone } = require("@pinecone-database/pinecone");
const embeddingService = require("./embeddingService");
const Logger = require("../utils/logger");

class RAGService {
  constructor() {
    this.pinecone = null;
    this.index = null;
    this.initialized = false;
  }

  /**
   * Initialize Pinecone connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });

      this.index = this.pinecone.index(
        process.env.PINECONE_INDEX_NAME || "mockmate-chatbot"
      );
      this.initialized = true;

      Logger.info("[RAGService] Initialized successfully");
    } catch (error) {
      Logger.error("[RAGService] Initialization error:", error);
      throw error;
    }
  }

  /**
   * Search knowledge base for relevant documents
   */
  async searchKnowledge(query, filters = {}, topK = 5) {
    try {
      await this.initialize();

      // Generate query embedding
      const queryEmbedding = await embeddingService.createEmbedding(query);

      // Search Pinecone
      const searchResults = await this.index.query({
        vector: queryEmbedding,
        topK,
        filter: filters,
        includeMetadata: true,
      });

      // Format results
      const results = searchResults.matches.map((match) => ({
        id: match.id,
        content: match.metadata.content,
        score: match.score,
        source: match.metadata.source || "Unknown",
        category: match.metadata.category,
        title: match.metadata.title,
        tags: match.metadata.tags || [],
      }));

      Logger.debug(
        `[RAGService] Found ${
          results.length
        } relevant documents for query: "${query.substring(0, 50)}..."`
      );

      return results;
    } catch (error) {
      Logger.error("[RAGService] Search error:", error);
      return [];
    }
  }

  /**
   * Index a single document
   */
  async indexDocument(doc) {
    try {
      await this.initialize();

      // Generate embedding
      const embedding = await embeddingService.createEmbedding(doc.content);

      // Upsert to Pinecone
      await this.index.upsert([
        {
          id: doc.id,
          values: embedding,
          metadata: {
            content: doc.content,
            source: doc.source,
            category: doc.category,
            title: doc.title,
            tags: doc.tags || [],
            timestamp: new Date().toISOString(),
          },
        },
      ]);

      Logger.info(`[RAGService] Indexed document: ${doc.title}`);
      return { success: true, id: doc.id };
    } catch (error) {
      Logger.error("[RAGService] Indexing error:", error);
      throw error;
    }
  }

  /**
   * Index multiple documents (batch)
   */
  async indexDocuments(docs) {
    try {
      await this.initialize();

      Logger.info(
        `[RAGService] Starting batch indexing of ${docs.length} documents...`
      );

      // Process in batches of 100 (Pinecone limit)
      const batchSize = 100;
      let indexed = 0;

      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);

        // Generate embeddings for batch
        const texts = batch.map((doc) => doc.content);
        const embeddings = await embeddingService.createEmbeddings(texts);

        // Prepare vectors
        const vectors = batch.map((doc, idx) => ({
          id: doc.id,
          values: embeddings[idx],
          metadata: {
            content: doc.content,
            source: doc.source,
            category: doc.category,
            title: doc.title,
            tags: doc.tags || [],
            timestamp: new Date().toISOString(),
          },
        }));

        // Upsert batch
        await this.index.upsert(vectors);
        indexed += batch.length;

        Logger.info(`[RAGService] Indexed ${indexed}/${docs.length} documents`);
      }

      Logger.info(
        `[RAGService] ✓ Batch indexing complete: ${docs.length} documents`
      );
      return { success: true, count: docs.length };
    } catch (error) {
      Logger.error("[RAGService] Batch indexing error:", error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id) {
    try {
      await this.initialize();
      await this.index.deleteOne(id);
      Logger.info(`[RAGService] Deleted document: ${id}`);
      return { success: true };
    } catch (error) {
      Logger.error("[RAGService] Delete error:", error);
      throw error;
    }
  }

  /**
   * Get index stats
   */
  async getStats() {
    try {
      await this.initialize();
      const stats = await this.index.describeIndexStats();
      return stats;
    } catch (error) {
      Logger.error("[RAGService] Stats error:", error);
      throw error;
    }
  }
}

module.exports = new RAGService();
