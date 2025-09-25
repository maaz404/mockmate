const OpenAI = require("openai");
const Logger = require("../utils/logger");

class AIQuestionService {
  constructor() {
    this.openai = null;
    // Fallback questions in case API fails
    this.fallbackQuestions = require("./fallbackQuestions");
  }

  // Lazy initialization of OpenAI client
  getOpenAIClient() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
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
      questionCount = 5,
      userProfile,
    } = params;

    try {
      // Validate API key
      if (
        !process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === "your_openai_api_key_here"
      ) {
        // OpenAI API key not configured, using fallback questions
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

      Logger.debug("Generating questions with OpenAI...");

      const response = await this.getOpenAIClient().chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert technical interviewer and hiring manager with years of experience conducting interviews across various technology roles. Generate realistic, challenging, and relevant interview questions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const generatedContent = response.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error("No content generated from OpenAI");
      }

      // Parse the response and structure the questions
      const questions = this.parseGeneratedQuestions(generatedContent, params);

      Logger.success(`Generated ${questions.length} questions successfully`);
      return questions;
    } catch (error) {
      Logger.error("OpenAI API error:", error.message);

      // Use fallback questions if API fails
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
        return questions.map((q, index) => ({
          _id: `ai_${Date.now()}_${index}`,
          text: q.text,
          type: q.type || "technical",
          category: q.category || params.skills[0] || "general",
          difficulty: q.difficulty || params.difficulty,
          followUp: q.followUp,
          evaluationCriteria: q.evaluationCriteria || {
            technical: ["Accuracy", "Depth of knowledge"],
            communication: ["Clarity", "Structure"],
            problemSolving: ["Approach", "Logic"],
          },
          expectedAnswer: q.expectedAnswer,
          timeEstimate: parseInt(q.timeEstimate) || 3,
          source: "ai_generated",
          generatedAt: new Date(),
          usageCount: 0,
        }));
      }
    } catch (parseError) {
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

    lines.forEach((line, index) => {
      if (line.includes("?") || line.match(/^\d+\./)) {
        const questionText = line.replace(/^\d+\.\s*/, "").trim();
        if (questionText.length > 10) {
          questions.push({
            _id: `ai_text_${Date.now()}_${index}`,
            text: questionText,
            type:
              params.interviewType === "behavioral"
                ? "behavioral"
                : "technical",
            category: params.skills[0] || "general",
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
    const { questionCount = 5, interviewType, difficulty, skills } = params;

    // Filter fallback questions based on parameters
    let availableQuestions = this.fallbackQuestions.filter((q) => {
      const typeMatch = interviewType === "mixed" || q.type === interviewType;
      const difficultyMatch =
        difficulty === "mixed" || q.difficulty === difficulty;
      const skillMatch =
        skills.length === 0 ||
        skills.some(
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
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }

    try {
      const prompt = `Based on this interview question and the candidate's answer, generate 1-2 short follow-up questions.

Original Question: "${originalQuestion}"
Candidate's Answer: "${userAnswer}"
Job Role: ${params.jobRole}
Experience Level: ${params.experienceLevel}

Generate follow-up questions that:
1. Probe deeper into their understanding (why/how questions)
2. Ask for practical examples or applications
3. Explore edge cases or challenges
4. Are appropriate for their experience level
5. Are concise and focused

Return in JSON format:
{
  "followUps": [
    {
      "text": "Follow-up question 1",
      "type": "clarification|example|technical|challenge"
    },
    {
      "text": "Follow-up question 2 (optional)",
      "type": "clarification|example|technical|challenge"
    }
  ]
}`;

      const response = await this.getOpenAIClient().chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert interviewer generating insightful follow-up questions. Always return valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content?.trim();

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(content);
        return parsed.followUps || [];
      } catch (parseError) {
        // Fallback: try to extract questions from text
        const questions = content
          .split("\n")
          .filter(
            (line) =>
              line.trim() && (line.includes("?") || line.match(/^\d+\./))
          )
          .slice(0, 2)
          .map((line) => ({
            text: line.replace(/^\d+\.\s*/, "").trim(),
            type: "clarification",
          }));

        return questions; // return array (possibly empty) for graceful handling
      }
    } catch (error) {
      Logger.error("Follow-up generation error:", error);
      return null;
    }
  }

  /**
   * Evaluate answer using AI with enhanced rubric scoring and model answer
   */
  async evaluateAnswer(question, answer, params) {
    if (!process.env.OPENAI_API_KEY) {
      return this.getBasicEvaluation(question, answer);
    }

    try {
      const prompt = `Evaluate this interview answer and provide comprehensive feedback with rubric scoring and model answer.

Question: "${question.text}"
Answer: "${answer}"
Job Role: ${params.jobRole}
Experience Level: ${params.experienceLevel}
Question Category: ${question.category || "general"}
Question Type: ${question.type || "general"}

Please provide evaluation in JSON format:
{
  "score": 0-100,
  "rubricScores": {
    "relevance": 1-5,
    "clarity": 1-5,
    "depth": 1-5,
    "structure": 1-5
  },
  "breakdown": {
    "technical": 0-100,
    "communication": 0-100,
    "problemSolving": 0-100
  },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement suggestion 1", "improvement suggestion 2"],
  "feedback": "Detailed feedback paragraph",
  "modelAnswer": "A concise model answer demonstrating what a strong response would include"
}

Scoring Guidelines:
- Relevance (1-5): How well the answer addresses the question
- Clarity (1-5): How clear and well-articulated the response is
- Depth (1-5): How thorough and insightful the answer is
- Structure (1-5): How well-organized and logical the response is

Provide exactly 2 specific, actionable improvement suggestions.`;

      const response = await this.getOpenAIClient().chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert interviewer providing constructive feedback. Always provide rubric scores on a 1-5 scale and include a concise model answer.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);

        // Ensure rubric scores are within 1-5 range
        if (parsedResult.rubricScores) {
          Object.keys(parsedResult.rubricScores).forEach((key) => {
            const score = parsedResult.rubricScores[key];
            parsedResult.rubricScores[key] = Math.max(
              1,
              Math.min(5, Math.round(score))
            );
          });
        }

        return parsedResult;
      }
    } catch (error) {
      Logger.error("Answer evaluation error:", error);
    }

    return this.getBasicEvaluation(question, answer);
  }

  /**
   * Basic evaluation fallback with enhanced rubric scoring
   */
  getBasicEvaluation(question, answer) {
    const wordCount = answer.split(" ").length;
    const hasKeywords =
      question.category &&
      answer.toLowerCase().includes(question.category.toLowerCase());

    const baseScore = Math.min(90, 40 + wordCount * 2 + (hasKeywords ? 20 : 0));

    // Generate basic rubric scores based on answer analysis
    const rubricScores = {
      relevance: hasKeywords
        ? Math.min(5, Math.floor(baseScore / 20) + 1)
        : Math.max(1, Math.floor(baseScore / 25)),
      clarity:
        wordCount > 20
          ? Math.min(5, Math.floor(baseScore / 20))
          : Math.max(1, Math.floor(baseScore / 30)),
      depth:
        wordCount > 50
          ? Math.min(5, Math.floor(baseScore / 18))
          : Math.max(1, Math.floor(baseScore / 30)),
      structure: /[.!?]/.test(answer)
        ? Math.min(5, Math.floor(baseScore / 20))
        : Math.max(1, Math.floor(baseScore / 35)),
    };

    // Generate basic model answer based on question type
    const modelAnswer = this.generateBasicModelAnswer(question);

    return {
      score: baseScore,
      rubricScores,
      breakdown: {
        technical: baseScore,
        communication: Math.min(100, baseScore + 5),
        problemSolving: Math.max(30, baseScore - 10),
      },
      strengths:
        wordCount > 50
          ? ["Detailed response", "Good elaboration"]
          : ["Direct answer"],
      improvements:
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
