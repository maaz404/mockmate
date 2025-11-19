const aiProviderManager = require("./aiProviders");
const Logger = require("../utils/logger");

class AIQuestionService {
  constructor() {
    // Fallback questions in case API fails
    this.fallbackQuestions = require("./fallbackQuestions");
    // Simple in-memory cache { key: { expires, questions } }
    this.cache = new Map();
    // Circuit breaker state
    this.failCount = 0;
    this.open = false;
    this.nextAttemptAt = 0;
  }

  /**
   * Generate interview questions using OpenAI
   * @param {Object} params - Question generation parameters
   * @returns {Promise<Array>} Generated questions
   */
  async generateQuestions(params) {
    const {
      jobRole,
      experienceLevel,
      interviewType,
      skills = [],
      focusAreas = [],
      difficulty = "medium",
      // eslint-disable-next-line no-magic-numbers
      questionCount = 5,
      userProfile,
    } = params;

    try {
      // Circuit breaker: short-circuit external calls if open
      const now = Date.now();
      if (this.open && now < this.nextAttemptAt) {
        Logger.warn(
          "AIQuestionService circuit open – using fallback questions"
        );
        return this.getFallbackQuestions(params);
      }
      if (this.open && now >= this.nextAttemptAt) {
        // Half-open trial
        Logger.info("AIQuestionService circuit half-open trial attempt");
        this.open = false; // allow one attempt
      }

      // Cache key (exclude volatile userProfile object fields to keep key small)
      const key = JSON.stringify({
        jobRole,
        experienceLevel,
        interviewType,
        skills,
        focusAreas,
        difficulty,
        questionCount,
      });
      const cached = this.cache.get(key);
      if (cached && cached.expires > now) {
        Logger.debug("Serving questions from AI cache");
        return cached.questions.slice(0, questionCount);
      } else if (cached) {
        this.cache.delete(key);
      }

      // Validate that AI providers are available
      const healthStatus = await aiProviderManager.getProvidersHealth();
      const anyProviderAvailable = Object.values(healthStatus).some(
        (h) => h.available
      );

      if (!anyProviderAvailable) {
        // No AI provider available, using fallback questions
        Logger.warn("No AI providers available, using fallback questions");
        return this.getFallbackQuestions(params);
      }

      const prompt = this.buildPrompt({
        jobRole,
        experienceLevel,
        interviewType,
        skills,
        focusAreas,
        difficulty,
        questionCount,
        userProfile,
      });

      Logger.debug("Generating questions with AI provider manager...");

      // Use AI provider manager for question generation
      const generatedQuestions = await aiProviderManager.generateQuestions({
        jobRole,
        experienceLevel,
        interviewType,
        skills,
        focusAreas,
        difficulty,
        questionCount,
        userProfile,
        prompt,
      });

      // If provider returns structured questions, use them
      if (Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
        Logger.success(
          `Generated ${generatedQuestions.length} questions successfully`
        );
        // Store in cache (5 min TTL)
        // eslint-disable-next-line no-magic-numbers
        const FIVE_MIN_MS = 5 * 60 * 1000; // 5 minutes cache TTL
        this.cache.set(key, {
          questions: generatedQuestions,
          expires: now + FIVE_MIN_MS,
        });
        // Reset failure state on success
        this.failCount = 0;
        this.open = false;
        return generatedQuestions;
      }

      // If provider returns raw text, parse it
      if (typeof generatedQuestions === "string") {
        const questions = this.parseGeneratedQuestions(
          generatedQuestions,
          params
        );
        Logger.success(`Generated ${questions.length} questions successfully`);
        // Store in cache (5 min TTL)
        // eslint-disable-next-line no-magic-numbers
        const FIVE_MIN_MS = 5 * 60 * 1000; // 5 minutes cache TTL
        this.cache.set(key, { questions, expires: now + FIVE_MIN_MS });
        // Reset failure state on success
        this.failCount = 0;
        this.open = false;
        return questions;
      }

      // Fallback if unexpected format
      throw new Error("Unexpected response format from AI provider");
    } catch (error) {
      Logger.error("AI provider error:", error.message);
      this.failCount += 1;
      // eslint-disable-next-line no-magic-numbers
      if (this.failCount >= 3 && !this.open) {
        this.open = true;
        // Exponential-ish backoff: 30s * failCount (capped 5m)
        // eslint-disable-next-line no-magic-numbers
        const base = 30000; // 30s
        // eslint-disable-next-line no-magic-numbers
        const delay = Math.min(base * this.failCount, 5 * 60 * 1000); // cap 5m
        this.nextAttemptAt = Date.now() + delay;
        // eslint-disable-next-line no-magic-numbers
        // eslint-disable-next-line no-magic-numbers
        const MS_PER_SEC = 1000;
        Logger.warn(
          `AIQuestionService circuit opened for ${(delay / MS_PER_SEC).toFixed(
            0
          )}s`
        );
      }
      Logger.debug("Falling back to curated questions");
      return this.getFallbackQuestions(params);
    }
  }

  /**
   * Build the prompt for OpenAI
   */
  buildPrompt(params) {
    const {
      jobRole,
      experienceLevel,
      interviewType,
      skills,
      focusAreas,
      difficulty,
      questionCount,
      userProfile,
    } = params;

    let prompt = `Generate ${questionCount} interview questions for a ${jobRole} position with ${experienceLevel} experience level.\n\n`;

    prompt += `Interview Type: ${interviewType}\n`;
    prompt += `Difficulty Level: ${difficulty}\n\n`;

    if (skills.length > 0) {
      prompt += `Relevant Skills/Technologies: ${skills.join(", ")}\n`;
    }

    if (focusAreas.length > 0) {
      prompt += `Focus Areas: ${focusAreas.join(", ")}\n`;
    }

    // Add context about user's background if available
    if (userProfile?.professionalInfo?.yearsOfExperience) {
      prompt += `\nCandidate has ${userProfile.professionalInfo.yearsOfExperience} years of experience.\n`;
    }

    prompt += `\nPlease provide questions in the following JSON format:
[
  {
    "text": "Question text here",
    "type": "technical|behavioral|coding|system-design",
    "category": "specific technology or skill area",
    "difficulty": "easy|medium|hard",
    "followUp": "Optional follow-up question",
    "evaluationCriteria": {
      "technical": ["criterion 1", "criterion 2"],
      "communication": ["criterion 1", "criterion 2"],
      "problemSolving": ["criterion 1", "criterion 2"]
    },
    "expectedAnswer": "Brief outline of what a good answer should cover",
    "timeEstimate": "estimated time to answer in minutes"
  }
]

Requirements:
- Mix question types appropriately based on interview type
- Ensure questions are relevant to the job role and experience level
- Include both broad conceptual questions and specific technical questions
- Make questions challenging but fair for the experience level
- Include practical scenarios when appropriate
- Ensure questions test both knowledge and problem-solving ability`;

    return prompt;
  }

  /**
   * Parse OpenAI generated content into structured questions
   */
  parseGeneratedQuestions(content, params) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);

        // Validate and enhance each question
        return questions.map((q, index) => {
          let qType = (q.type || "technical").toLowerCase();
          if (qType === "mixed") {
            qType = (q.category || "").toLowerCase().includes("behavior")
              ? "behavioral"
              : "technical";
          }
          const allowedTypes = [
            "technical",
            "behavioral",
            "system-design",
            "case-study",
            "situational",
          ];
          if (!allowedTypes.includes(qType)) qType = "technical";
          // Map unsupported 'general' to safe defaults
          let category = q.category || params.skills[0] || "general";
          if (category === "general") {
            category =
              qType === "behavioral" ? "communication" : "web-development";
          }
          return {
            _id: `ai_${Date.now()}_${index}`,
            text: q.text,
            type: qType,
            category,
            difficulty: q.difficulty || params.difficulty,
            followUp: q.followUp,
            evaluationCriteria: q.evaluationCriteria || {
              technical: ["Accuracy", "Depth of knowledge"],
              communication: ["Clarity", "Structure"],
              problemSolving: ["Approach", "Logic"],
            },
            expectedAnswer: q.expectedAnswer,
            // eslint-disable-next-line no-magic-numbers
            timeEstimate: parseInt(q.timeEstimate) || 3,
            source: "ai_generated",
            generatedAt: new Date(),
            usageCount: 0,
          };
        });
      }
    } catch (parseError) {
      // eslint-disable-next-line no-console
      console.error("Error parsing generated questions:", parseError);
    }

    // Fallback to simple text parsing if JSON parsing fails
    return this.parseTextQuestions(content, params);
  }

  /**
   * Parse text-based questions if JSON parsing fails
   */
  parseTextQuestions(content, params) {
    const lines = content.split("\n").filter((line) => line.trim());
    const questions = [];

    // Minimum length threshold to consider a parsed line a valid question (avoid single-word lines)
    // eslint-disable-next-line no-magic-numbers
    const MIN_QUESTION_LEN = 10;
    lines.forEach((line, index) => {
      if (line.includes("?") || line.match(/^\d+\./)) {
        const questionText = line.replace(/^\d+\.\s*/, "").trim();
        if (questionText.length > MIN_QUESTION_LEN) {
          let inferredType =
            params.interviewType === "behavioral" ? "behavioral" : "technical";
          if (inferredType === "mixed") inferredType = "technical";
          let category = params.skills[0] || "general";
          if (category === "general") {
            category =
              inferredType === "behavioral"
                ? "communication"
                : "web-development";
          }
          questions.push({
            _id: `ai_text_${Date.now()}_${index}`,
            text: questionText,
            type: inferredType,
            category,
            difficulty: params.difficulty,
            evaluationCriteria: {
              technical: ["Understanding", "Completeness"],
              communication: ["Clarity", "Organization"],
              problemSolving: ["Logic", "Creativity"],
            },
            timeEstimate: 3,
            source: "ai_generated",
            generatedAt: new Date(),
            usageCount: 0,
          });
        }
      }
    });

    return questions.slice(0, params.questionCount);
  }

  /**
   * Get fallback questions when AI service is unavailable
   */
  getFallbackQuestions(params) {
    // eslint-disable-next-line no-magic-numbers
    const { questionCount = 5, interviewType, difficulty, skills } = params;
    const safeSkills = Array.isArray(skills) ? skills : [];

    // Filter fallback questions based on parameters
    let availableQuestions = this.fallbackQuestions.filter((q) => {
      const typeMatch = interviewType === "mixed" || q.type === interviewType;
      const difficultyMatch =
        difficulty === "mixed" || q.difficulty === difficulty;
      const skillMatch =
        safeSkills.length === 0 ||
        safeSkills.some(
          (skill) =>
            q.category.toLowerCase().includes(skill.toLowerCase()) ||
            q.text.toLowerCase().includes(skill.toLowerCase())
        );

      return typeMatch && difficultyMatch && skillMatch;
    });

    // If no matches, use general questions
    if (availableQuestions.length === 0) {
      availableQuestions = this.fallbackQuestions.filter(
        (q) => q.category === "general"
      );
    }

    // Shuffle and return requested count
    // eslint-disable-next-line no-magic-numbers
    const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, questionCount).map((q) => ({
      ...q,
      _id: `fallback_${Date.now()}_${Math.random()}`,
      source: "fallback",
    }));
  }

  /**
   * Generate follow-up questions based on user's answer
   */
  async generateFollowUp(originalQuestion, userAnswer, params) {
    try {
      // Use AI provider manager for follow-up generation
      const followUps = await aiProviderManager.generateFollowUpQuestions(
        originalQuestion,
        userAnswer,
        2 // Generate 2 follow-up questions
      );
      if (Array.isArray(followUps) && followUps.length > 0) {
        return followUps;
      }
    } catch (error) {
      Logger.error("Follow-up generation error:", error);
    }
    // Fallback: always return at least one generic follow-up
    Logger.warn(
      "All AI providers failed for followup_questions. Using fallback follow-up."
    );
    return [
      {
        questionText: "Can you elaborate further on your answer?",
        reason: "Default fallback - AI unavailable",
        difficulty: "intermediate",
      },
    ];
  }

  /**
   * Evaluate answer using AI with enhanced rubric scoring and model answer
   */
  async evaluateAnswer(question, answer, params) {
    try {
      // Use AI provider manager for evaluation
      const evaluation = await aiProviderManager.evaluateAnswer(
        question,
        answer,
        params
      );

      // Ensure rubric scores are within 1-5 range
      if (evaluation.rubricScores) {
        Object.keys(evaluation.rubricScores).forEach((key) => {
          const score = evaluation.rubricScores[key];
          evaluation.rubricScores[key] = Math.max(
            1,
            // eslint-disable-next-line no-magic-numbers
            Math.min(5, Math.round(score))
          );
        });
      }

      return evaluation;
    } catch (error) {
      Logger.error("Answer evaluation error:", error);
      return this.getBasicEvaluation(question, answer);
    }
  }

  /**
   * Basic evaluation fallback with enhanced rubric scoring
   */
  getBasicEvaluation(question, answer) {
    const SCORE_SCALE_DIVISOR = 30; // previously magic number for clarity scale fallback
    const wordCount = answer.split(" ").length;
    const hasKeywords =
      question.category &&
      answer.toLowerCase().includes(question.category.toLowerCase());

    // eslint-disable-next-line no-magic-numbers
    const baseScore = Math.min(90, 40 + wordCount * 2 + (hasKeywords ? 20 : 0));

    // Generate basic rubric scores based on answer analysis
    const rubricScores = {
      relevance: hasKeywords
        ? // eslint-disable-next-line no-magic-numbers
          Math.min(5, Math.floor(baseScore / 20) + 1)
        : // eslint-disable-next-line no-magic-numbers
          Math.max(1, Math.floor(baseScore / 25)),
      clarity:
        // eslint-disable-next-line no-magic-numbers
        wordCount > 20
          ? // eslint-disable-next-line no-magic-numbers
            Math.min(5, Math.floor(baseScore / 20))
          : // eslint-disable-next-line no-magic-numbers
            // eslint-disable-next-line no-magic-numbers
            // eslint-disable-next-line no-magic-numbers
            Math.max(1, Math.floor(baseScore / SCORE_SCALE_DIVISOR)),
      depth:
        // eslint-disable-next-line no-magic-numbers
        wordCount > 50
          ? // eslint-disable-next-line no-magic-numbers
            Math.min(5, Math.floor(baseScore / 18))
          : Math.max(1, Math.floor(baseScore / SCORE_SCALE_DIVISOR)),
      structure: /[.!?]/.test(answer)
        ? // eslint-disable-next-line no-magic-numbers
          Math.min(5, Math.floor(baseScore / 20))
        : // eslint-disable-next-line no-magic-numbers
          Math.max(1, Math.floor(baseScore / 35)),
    };

    // Generate basic model answer based on question type
    const modelAnswer = this.generateBasicModelAnswer(question);

    return {
      score: baseScore,
      rubricScores,
      breakdown: {
        technical: baseScore,
        // eslint-disable-next-line no-magic-numbers
        communication: Math.min(100, baseScore + 5),
        // eslint-disable-next-line no-magic-numbers
        problemSolving: Math.max(30, baseScore - 10),
      },
      strengths:
        // eslint-disable-next-line no-magic-numbers
        wordCount > 50
          ? ["Detailed response", "Good elaboration"]
          : ["Direct answer"],
      improvements:
        // eslint-disable-next-line no-magic-numbers
        wordCount < 30
          ? [
              "Provide more specific details and examples",
              "Structure your response with clear points",
            ]
          : [
              "Consider addressing potential edge cases",
              "Add concrete examples to strengthen your answer",
            ],
      feedback: `Your answer ${
        // eslint-disable-next-line no-magic-numbers
        wordCount > 50
          ? "shows good detail and understanding"
          : "could benefit from more elaboration and examples"
      }.`,
      modelAnswer,
    };
  }

  /**
   * Generate a basic model answer for fallback scenarios
   */
  generateBasicModelAnswer(question) {
    const questionType = question.type || "general";
    const category = question.category || "general";

    switch (questionType) {
      case "technical":
        return `A strong technical answer would include: 1) Clear explanation of the concept, 2) Practical implementation details, 3) Relevant examples or use cases, 4) Consideration of alternatives or trade-offs.`;
      case "behavioral":
        return `A strong behavioral answer would follow the STAR method: 1) Situation - context and background, 2) Task - what needed to be accomplished, 3) Action - specific steps taken, 4) Result - outcomes and lessons learned.`;
      case "system-design":
        return `A strong system design answer would cover: 1) Requirements clarification, 2) High-level architecture, 3) Component design and data flow, 4) Scalability and performance considerations.`;
      default:
        return `A strong answer would be well-structured, directly address the question, provide specific examples, and demonstrate clear understanding of ${category} concepts.`;
    }
  }
}

module.exports = new AIQuestionService();
