/**
 * Gemini AI Provider Service
 *
 * Google's Gemini AI for:
 * - Answer evaluation with structured feedback
 * - Technical & behavioral question generation
 * - Performance analytics
 * - Follow-up question generation
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const BaseAIProvider = require("./BaseAIProvider");
const AI_CONFIG = require("../../config/aiProviders");

class GeminiService extends BaseAIProvider {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    super("Gemini", apiKey, AI_CONFIG.MODELS.gemini);

    if (this.isAvailable()) {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({
        model: this.config.default,
      });
    }
  }

  /**
   * Generate completion
   */
  async generateCompletion(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    this._incrementRequests();
    this._logRequest("generateCompletion", { promptLength: prompt.length });

    try {
      const result = await this._retryWithBackoff(async () => {
        const response = await this.model.generateContent(prompt);
        return response.response.text();
      });

      return result;
    } catch (error) {
      this._logError("generateCompletion", error);
      throw this._handleError(error, "generateCompletion");
    }
  }

  /**
   * Generate chat completion
   */
  async generateChatCompletion(messages, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    this._incrementRequests();
    this._logRequest("generateChatCompletion", {
      messageCount: messages.length,
    });

    try {
      // Convert messages to Gemini format
      const chat = this.model.startChat({
        history: messages.slice(0, -1).map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
      });

      const lastMessage = messages[messages.length - 1];
      const result = await this._retryWithBackoff(async () => {
        const response = await chat.sendMessage(lastMessage.content);
        return response.response.text();
      });

      return result;
    } catch (error) {
      this._logError("generateChatCompletion", error);
      throw this._handleError(error, "generateChatCompletion");
    }
  }

  /**
   * Generate structured JSON output
   */
  async generateStructuredOutput(prompt, schema, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    this._incrementRequests();
    this._logRequest("generateStructuredOutput", { schema });

    try {
      // Add JSON instruction to prompt
      const jsonPrompt = `${prompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(
        schema,
        null,
        2
      )}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;

      const result = await this._retryWithBackoff(async () => {
        const response = await this.model.generateContent(jsonPrompt);
        const text = response.response.text();

        // Clean up response (remove markdown code blocks if present)
        let cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.replace(/```json\n?/, "").replace(/\n?```$/, "");
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/```\n?/, "").replace(/\n?```$/, "");
        }

        // Parse JSON
        return JSON.parse(cleaned);
      });

      return result;
    } catch (error) {
      this._logError("generateStructuredOutput", error);
      throw this._handleError(error, "generateStructuredOutput");
    }
  }

  /**
   * Evaluate interview answer with structured feedback
   */
  async evaluateAnswer(question, answer, config = {}) {
    const prompt = `You are an expert interview evaluator. Evaluate this interview answer.

QUESTION: ${question.questionText}

ANSWER: ${answer.text || answer.answerText || answer}

CONTEXT:
- Job Role: ${config.jobRole || "General"}
- Experience Level: ${config.experienceLevel || "Intermediate"}
- Interview Type: ${config.interviewType || "Technical"}

Provide a detailed evaluation with:
1. Overall score (0-100)
2. Rubric scores (1-5 scale for each):
   - Relevance: How well the answer addresses the question
   - Clarity: How clear and well-structured the answer is
   - Depth: Level of technical depth and detail
   - Structure: Organization and flow of the answer
3. Strengths: What the candidate did well (array of strings)
4. Improvements: What could be improved (array of strings)
5. Detailed feedback: Comprehensive assessment

Respond with JSON only.`;

    const schema = {
      score: "number (0-100)",
      rubricScores: {
        relevance: "number (1-5)",
        clarity: "number (1-5)",
        depth: "number (1-5)",
        structure: "number (1-5)",
      },
      strengths: ["string"],
      improvements: ["string"],
      feedback: "string",
    };

    return await this.generateStructuredOutput(prompt, schema);
  }

  /**
   * Generate interview questions
   */
  async generateQuestions(config) {
    const {
      jobRole = "Software Engineer",
      experienceLevel = "Intermediate",
      interviewType = "Technical",
      questionCount = 5,
      difficulty = "intermediate",
      categories = [],
    } = config;

    const categoriesStr =
      categories.length > 0
        ? `Focus on these categories: ${categories.join(", ")}`
        : "";

    const prompt = `Generate ${questionCount} high-quality ${interviewType} interview questions for a ${experienceLevel} ${jobRole} position.

REQUIREMENTS:
- Difficulty level: ${difficulty}
- Each question should be challenging and relevant
- Include a mix of conceptual, practical, and scenario-based questions
${categoriesStr}

For each question provide:
1. questionText: The actual question
2. category: Main topic/skill being tested
3. difficulty: easy, intermediate, or hard
4. tags: Array of relevant keywords (for evaluation)
5. expectedDuration: Estimated time in seconds (60-300)
6. hints: Array of 2-3 helpful hints
7. evaluationCriteria: What makes a good answer

Respond with JSON array of questions only.`;

    const schema = [
      {
        questionText: "string",
        category: "string",
        difficulty: "string",
        tags: ["string"],
        expectedDuration: "number",
        hints: ["string"],
        evaluationCriteria: "string",
      },
    ];

    return await this.generateStructuredOutput(prompt, schema);
  }

  /**
   * Generate follow-up questions based on answer
   */
  async generateFollowUpQuestions(originalQuestion, answer, count = 3) {
    const prompt = `Based on this interview exchange, generate ${count} relevant follow-up questions.

ORIGINAL QUESTION: ${originalQuestion.questionText}

CANDIDATE'S ANSWER: ${answer.text || answer}

Generate follow-up questions that:
1. Dig deeper into concepts mentioned
2. Test practical application
3. Explore edge cases or related topics
4. Are progressively more challenging

For each follow-up question provide:
1. questionText: The follow-up question
2. reason: Why this follow-up is relevant
3. difficulty: easy, intermediate, or hard

Respond with JSON array only.`;

    const schema = [
      {
        questionText: "string",
        reason: "string",
        difficulty: "string",
      },
    ];

    return await this.generateStructuredOutput(prompt, schema);
  }

  /**
   * Analyze interview performance (analytics)
   */
  async analyzePerformance(interviews) {
    const interviewsData = interviews.map((int) => ({
      type: int.config?.interviewType || "Unknown",
      score: int.overallScore || 0,
      questionsAnswered: int.questions?.filter((q) => q.response).length || 0,
      totalQuestions: int.questions?.length || 0,
      date: int.createdAt,
    }));

    const prompt = `Analyze this candidate's interview performance history and provide insights.

INTERVIEWS DATA:
${JSON.stringify(interviewsData, null, 2)}

Provide comprehensive analysis including:
1. overallTrend: improving, declining, or stable
2. averageScore: Overall average performance
3. strengths: Top 3 strong areas (array of strings)
4. weaknesses: Top 3 areas needing improvement (array of strings)
5. recommendations: 3-5 actionable recommendations
6. categoryPerformance: Performance by interview type/category
7. progressSummary: Brief narrative of progress

Respond with JSON only.`;

    const schema = {
      overallTrend: "string",
      averageScore: "number",
      strengths: ["string"],
      weaknesses: ["string"],
      recommendations: ["string"],
      categoryPerformance: {},
      progressSummary: "string",
    };

    return await this.generateStructuredOutput(prompt, schema);
  }

  /**
   * Check provider health
   */
  async checkHealth() {
    if (!this.isAvailable()) {
      return {
        available: false,
        message: "Gemini API key not configured",
      };
    }

    try {
      // Simple test request
      await this.model.generateContent("Test");
      return {
        available: true,
        provider: this.providerName,
        model: this.config.default,
        ...this.getStatus(),
      };
    } catch (error) {
      return {
        available: false,
        provider: this.providerName,
        error: error.message,
        ...this.getStatus(),
      };
    }
  }
}

module.exports = new GeminiService();
