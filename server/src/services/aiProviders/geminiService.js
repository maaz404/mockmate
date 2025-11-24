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
      // Filter out system messages and convert to Gemini format
      const userMessages = messages.filter((msg) => msg.role !== "system");

      // Build history (all but last message)
      const history = userMessages.slice(0, -1).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Ensure first message is from user role
      if (history.length > 0 && history[0].role !== "user") {
        // If first message is model, prepend a dummy user message
        history.unshift({
          role: "user",
          parts: [{ text: "Hello" }],
        });
      }

      const chat = this.model.startChat({ history });

      const lastMessage = userMessages[userMessages.length - 1];
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
    if (!this.isAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    const questionText = question.questionText || question.text || question;
    const answerText = answer.text || answer.answerText || answer;
    const questionCategory = question.category || "General";
    const questionDifficulty =
      question.difficulty || config.experienceLevel || "Intermediate";

    this._logRequest("evaluateAnswer", {
      questionLength: questionText.length,
      answerLength: answerText.length,
      category: questionCategory,
      difficulty: questionDifficulty,
    });

    const prompt = `You are an expert technical interviewer evaluating a candidate's response. Provide a thorough, specific analysis.

## QUESTION DETAILS
Question: ${questionText}
Category: ${questionCategory}
Difficulty: ${questionDifficulty}
Role: ${config.jobRole || "General"}
Experience Level: ${config.experienceLevel || "Intermediate"}
Interview Type: ${config.interviewType || "Technical"}

## CANDIDATE'S ANSWER
${answerText}

## EVALUATION REQUIREMENTS

Analyze this specific answer in detail. Your evaluation must be:
1. **Specific to this exact answer** - reference actual points the candidate made
2. **Actionable** - provide concrete examples of what to improve
3. **Balanced** - highlight both strengths and areas for growth
4. **Technical** - use proper terminology relevant to the question

Provide:

1. **Overall Score (0-100)**: Based on completeness, accuracy, depth, and clarity

2. **Rubric Scores (1-5 scale)**:
   - Relevance: Does the answer directly address the question?
   - Clarity: Is the explanation clear, well-organized, and easy to follow?
   - Depth: Does it show deep understanding with examples/details?
   - Structure: Is the answer logically organized with good flow?

3. **Strengths (3-5 specific points)**: What did the candidate do well? Be specific:
   - Quote or reference actual parts of their answer
   - Mention specific concepts they explained correctly
   - Highlight good examples or insights they provided
   
4. **Improvements (3-5 specific points)**: What could be better? Be actionable:
   - Point out missing concepts or incomplete explanations
   - Suggest specific topics to elaborate on
   - Identify technical inaccuracies if any
   - Recommend better structure or examples

5. **Detailed Feedback (2-3 paragraphs)**: 
   - First paragraph: Overall assessment of their answer
   - Second paragraph: Key areas they covered well
   - Third paragraph: Critical gaps and how to improve

6. **Model Answer (optional)**: If the answer was incomplete, provide a brief ideal response

IMPORTANT: 
- Make your feedback unique to this answer. Avoid generic statements like "Attempted" or "Good effort". 
- Reference specific technical concepts from their response.
- The "feedback" field must contain 2-3 full paragraphs of detailed analysis, NOT just "Excellent!" or one word.
- Be thorough and specific in your evaluation.

Return ONLY a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "rubricScores": {
    "relevance": <number 1-5>,
    "clarity": <number 1-5>,
    "depth": <number 1-5>,
    "structure": <number 1-5>
  },
  "strengths": [<array of 3-5 specific strength strings>],
  "improvements": [<array of 3-5 specific improvement strings>],
  "feedback": "<2-3 paragraph detailed analysis>",
  "modelAnswer": "<optional ideal answer if needed>"
}`;

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
      feedback: "string (2-3 paragraphs)",
      modelAnswer: "string (optional)",
    };

    try {
      const result = await this.generateStructuredOutput(prompt, schema);

      this._logRequest("evaluateAnswer-success", {
        score: result.score,
        hasDetailedFeedback: !!result.feedback,
        feedbackLength: result.feedback?.length || 0,
        strengthsCount: result.strengths?.length || 0,
        improvementsCount: result.improvements?.length || 0,
      });

      return result;
    } catch (error) {
      this._logError("evaluateAnswer", error);
      throw this._handleError(error, "evaluateAnswer");
    }
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
