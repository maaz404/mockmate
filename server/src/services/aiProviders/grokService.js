/**
 * Grok AI Provider Service
 *
 * xAI's Grok for:
 * - Behavioral questions (soft skills, situational)
 * - Career guidance and interview preparation
 * - Resume analysis
 * - Adaptive difficulty adjustments (context-aware)
 * - Soft skills analysis
 */

const axios = require("axios");
const BaseAIProvider = require("./BaseAIProvider");
const AI_CONFIG = require("../../config/aiProviders");

class GrokService extends BaseAIProvider {
  constructor() {
    const apiKey = process.env.GROK_API_KEY;
    super("Grok", apiKey, AI_CONFIG.MODELS.grok);

    if (this.isAvailable()) {
      this.baseURL = process.env.GROK_API_URL || "https://api.x.ai/v1";
      this.client = axios.create({
        baseURL: this.baseURL,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: AI_CONFIG.TIMEOUTS.grok,
      });
    }
  }

  /**
   * Generate completion
   */
  async generateCompletion(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Grok API key not configured");
    }

    this._incrementRequests();
    this._logRequest("generateCompletion", { promptLength: prompt.length });

    try {
      const result = await this._retryWithBackoff(async () => {
        const response = await this.client.post("/chat/completions", {
          model: options.model || this.config.default,
          messages: [{ role: "user", content: prompt }],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          stream: false,
        });

        return response.data.choices[0]?.message?.content || "";
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
      throw new Error("Grok API key not configured");
    }

    this._incrementRequests();
    this._logRequest("generateChatCompletion", {
      messageCount: messages.length,
    });

    try {
      const result = await this._retryWithBackoff(async () => {
        const response = await this.client.post("/chat/completions", {
          model: options.model || this.config.default,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          stream: false,
        });

        return response.data.choices[0]?.message?.content || "";
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
      throw new Error("Grok API key not configured");
    }

    this._incrementRequests();
    this._logRequest("generateStructuredOutput", { schema });

    try {
      const jsonPrompt = `${prompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(
        schema,
        null,
        2
      )}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;

      const result = await this._retryWithBackoff(async () => {
        const response = await this.client.post("/chat/completions", {
          model: options.model || this.config.default,
          messages: [{ role: "user", content: jsonPrompt }],
          temperature: options.temperature || 0.5,
          max_tokens: options.maxTokens || 2048,
          stream: false,
        });

        const text = response.data.choices[0]?.message?.content || "";

        // Clean up response
        let cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.replace(/```json\n?/, "").replace(/\n?```$/, "");
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/```\n?/, "").replace(/\n?```$/, "");
        }

        return JSON.parse(cleaned);
      });

      return result;
    } catch (error) {
      this._logError("generateStructuredOutput", error);
      throw this._handleError(error, "generateStructuredOutput");
    }
  }

  /**
   * Generate behavioral interview questions
   */
  async generateBehavioralQuestions(config) {
    const {
      jobRole = "Professional",
      experienceLevel = "Intermediate",
      questionCount = 5,
      focusAreas = [
        "teamwork",
        "leadership",
        "problem-solving",
        "communication",
      ],
    } = config;

    const prompt = `Generate ${questionCount} behavioral interview questions for a ${experienceLevel} ${jobRole} position.

FOCUS AREAS: ${focusAreas.join(", ")}

Requirements:
- Use STAR method framework (Situation, Task, Action, Result)
- Questions should reveal soft skills and cultural fit
- Include diverse scenarios (conflict, success, failure, growth)
- Questions should be open-ended and thought-provoking
- Appropriate for ${experienceLevel} level

For each question provide:
1. questionText: The behavioral question
2. focusArea: Primary soft skill being assessed
3. starComponent: Which STAR component this emphasizes
4. difficulty: easy, intermediate, or hard
5. expectedElements: What a good answer should include (array)
6. redFlags: What to watch out for in answers (array)

Respond with JSON array only.`;

    const schema = [
      {
        questionText: "string",
        focusArea: "string",
        starComponent: "string",
        difficulty: "string",
        expectedElements: ["string"],
        redFlags: ["string"],
      },
    ];

    return await this.generateStructuredOutput(prompt, schema);
  }

  /**
   * Analyze resume and provide career guidance
   */
  async analyzeResume(resumeData) {
    const prompt = `You are an expert career coach and resume analyst. Analyze this resume/profile and provide comprehensive feedback.

PROFILE:
- Name: ${resumeData.name || "Not provided"}
- Current Role: ${resumeData.currentRole || "Not specified"}
- Experience: ${resumeData.yearsOfExperience || "Not specified"} years
- Skills: ${resumeData.skills?.join(", ") || "Not listed"}
- Education: ${resumeData.education || "Not specified"}
- Target Role: ${resumeData.targetRole || "Not specified"}

${resumeData.summary ? `SUMMARY:\n${resumeData.summary}` : ""}

Provide analysis including:
1. overallStrength: Rating from 1-10
2. strengths: Top 3-5 strong points
3. weaknesses: Top 3-5 areas to improve
4. skillsGaps: Missing skills for target role
5. recommendations: 5-7 specific actionable recommendations
6. interviewPrep: Specific areas to prepare for interviews
7. careerGuidance: Strategic career advice

Respond with JSON only.`;

    const schema = {
      overallStrength: "number",
      strengths: ["string"],
      weaknesses: ["string"],
      skillsGaps: ["string"],
      recommendations: ["string"],
      interviewPrep: ["string"],
      careerGuidance: "string",
    };

    return await this.generateStructuredOutput(prompt, schema);
  }

  /**
   * Adjust interview difficulty based on performance
   */
  async adjustDifficulty(performanceData) {
    const {
      currentDifficulty = "intermediate",
      recentScores = [],
      questionsAnswered = 0,
      strengths = [],
      weaknesses = [],
    } = performanceData;

    const avgScore =
      recentScores.length > 0
        ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
        : 50;

    const prompt = `You are an adaptive interview system. Analyze the candidate's performance and recommend difficulty adjustment.

CURRENT STATE:
- Current Difficulty: ${currentDifficulty}
- Questions Answered: ${questionsAnswered}
- Average Score: ${avgScore.toFixed(1)}
- Recent Scores: ${recentScores.join(", ")}
- Strengths: ${strengths.join(", ") || "None identified yet"}
- Weaknesses: ${weaknesses.join(", ") || "None identified yet"}

RULES:
- If avg score > 80: Consider increasing difficulty
- If avg score < 50: Consider decreasing difficulty
- If score 50-80: Maintain current difficulty
- Need at least 3 questions to adjust
- Consider consistency of performance

Provide recommendation:
1. newDifficulty: easy, intermediate, or hard
2. shouldChange: boolean - whether to change difficulty
3. reason: Why this recommendation
4. confidenceScore: 0-100 how confident in this recommendation
5. nextQuestionFocus: What to focus on in next questions

Respond with JSON only.`;

    const schema = {
      newDifficulty: "string",
      shouldChange: "boolean",
      reason: "string",
      confidenceScore: "number",
      nextQuestionFocus: "string",
    };

    return await this.generateStructuredOutput(prompt, schema);
  }

  /**
   * Analyze soft skills from interview responses
   */
  async analyzeSoftSkills(responses) {
    const responsesText = responses
      .map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer}`)
      .join("\n\n");

    const prompt = `You are an expert at assessing soft skills from interview responses. Analyze these responses for soft skills indicators.

RESPONSES:
${responsesText}

Evaluate the following soft skills (rate each 1-10):
1. Communication: Clarity, articulation, structure
2. Problem Solving: Analytical thinking, creativity
3. Leadership: Initiative, decision-making
4. Teamwork: Collaboration, interpersonal skills
5. Adaptability: Flexibility, learning agility
6. Emotional Intelligence: Self-awareness, empathy

For each skill provide:
- score: 1-10 rating
- evidence: Specific examples from responses
- improvement: How to improve this skill

Also provide:
- overallSoftSkillsScore: Average of all skills
- topStrengths: Top 2 soft skills (array)
- areasToImprove: Top 2 skills needing work (array)
- recommendation: Overall soft skills guidance

Respond with JSON only.`;

    const schema = {
      communication: {
        score: "number",
        evidence: "string",
        improvement: "string",
      },
      problemSolving: {
        score: "number",
        evidence: "string",
        improvement: "string",
      },
      leadership: {
        score: "number",
        evidence: "string",
        improvement: "string",
      },
      teamwork: { score: "number", evidence: "string", improvement: "string" },
      adaptability: {
        score: "number",
        evidence: "string",
        improvement: "string",
      },
      emotionalIntelligence: {
        score: "number",
        evidence: "string",
        improvement: "string",
      },
      overallSoftSkillsScore: "number",
      topStrengths: ["string"],
      areasToImprove: ["string"],
      recommendation: "string",
    };

    return await this.generateStructuredOutput(prompt, schema);
  }

  /**
   * Generate career guidance
   */
  async generateCareerGuidance(userProfile) {
    const prompt = `You are an experienced career counselor. Provide personalized career guidance.

USER PROFILE:
- Current Role: ${userProfile.currentRole || "Not specified"}
- Experience: ${userProfile.experience || 0} years
- Skills: ${userProfile.skills?.join(", ") || "Not listed"}
- Goals: ${userProfile.goals || "Not specified"}
- Interests: ${userProfile.interests?.join(", ") || "Not listed"}
- Industry: ${userProfile.industry || "Not specified"}

Provide comprehensive guidance:
1. careerPath: Suggested career progression (array of steps)
2. skillsToLearn: Priority skills to develop (array)
3. certifications: Relevant certifications to pursue (array)
4. networking: Networking strategies (array)
5. jobSearchTips: Job search advice (array)
6. interviewTips: Interview preparation tips (array)
7. timeline: Realistic timeline for goals (string)
8. resources: Helpful resources and platforms (array)

Respond with JSON only.`;

    const schema = {
      careerPath: ["string"],
      skillsToLearn: ["string"],
      certifications: ["string"],
      networking: ["string"],
      jobSearchTips: ["string"],
      interviewTips: ["string"],
      timeline: "string",
      resources: ["string"],
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
        message: "Grok API key not configured",
      };
    }

    try {
      // Simple test request
      await this.client.post("/chat/completions", {
        model: this.config.default,
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 10,
      });

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

module.exports = new GrokService();
