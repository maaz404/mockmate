const OpenAI = require("openai");

class AdvancedFeedbackService {
  constructor() {
    this.isConfigured = !!process.env.OPENAI_API_KEY;
    
    if (this.isConfigured) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn("OpenAI API key not configured. Advanced feedback features will be disabled.");
      this.openai = null;
    }

    // Feedback criteria weights
    this.criteria = {
      technical: 0.35, // Technical accuracy and depth
      communication: 0.25, // Clarity and articulation
      problemSolving: 0.2, // Approach and methodology
      behavioral: 0.2, // Soft skills and attitude
    };
  }

  /**
   * Generate comprehensive feedback for an interview answer
   */
  async generateAdvancedFeedback(
    question,
    answer,
    config,
    videoAnalysis = null
  ) {
    try {
      if (!this.isConfigured) {
        return this.generateFallbackFeedback(question, answer, config);
      }

      const prompt = this.buildAdvancedFeedbackPrompt(
        question,
        answer,
        config,
        videoAnalysis
      );

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert interview coach and technical assessor. Provide detailed, constructive feedback on interview responses. Your analysis should be professional, specific, and actionable.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const feedbackText = response.choices[0].message.content;
      return this.parseFeedbackResponse(feedbackText, question, answer);
    } catch (error) {
      console.error("Advanced feedback generation failed:", error);
      return this.generateFallbackFeedback(question, answer, config);
    }
  }

  /**
   * Build prompt for advanced feedback generation
   */
  buildAdvancedFeedbackPrompt(question, answer, config, videoAnalysis) {
    // Language mapping for better prompts
    const languageNames = {
      en: "English",
      es: "Spanish", 
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      hi: "Hindi",
      ar: "Arabic",
      ru: "Russian"
    };

    const feedbackLanguage = languageNames[config.language] || "English";

    let prompt = `
Please provide comprehensive feedback for this interview response in ${feedbackLanguage}:

**Interview Configuration:**
- Job Role: ${config.jobRole}
- Experience Level: ${config.experienceLevel}
- Interview Type: ${config.interviewType}
- Difficulty: ${config.difficulty}
- Language: ${feedbackLanguage}

**Question:** ${question.questionText || question}

**Candidate's Answer:** ${answer}

**Analysis Request:**
Please analyze this response across these dimensions and provide feedback in ${feedbackLanguage}:

1. **Technical Accuracy** (${this.criteria.technical * 100}% weight):
   - Correctness of concepts and solutions
   - Depth of technical knowledge
   - Use of appropriate terminology
   - Code quality (if applicable)

2. **Communication Skills** (${this.criteria.communication * 100}% weight):
   - Clarity of explanation
   - Logical structure and flow
   - Use of examples and analogies
   - Confidence in delivery

3. **Problem-Solving Approach** (${this.criteria.problemSolving * 100}% weight):
   - Systematic thinking process
   - Consideration of alternatives
   - Edge cases and constraints
   - Step-by-step methodology

4. **Behavioral Indicators** (${this.criteria.behavioral * 100}% weight):
   - Professional attitude
   - Adaptability and learning mindset
   - Collaboration and teamwork signals
   - Initiative and proactivity`;

    if (videoAnalysis) {
      prompt += `

**Video Analysis Data:**
- Speaking pace: ${videoAnalysis.speakingPace}
- Eye contact: ${videoAnalysis.eyeContact}
- Gestures: ${videoAnalysis.gestures}
- Overall confidence: ${videoAnalysis.confidence}`;
    }

    prompt += `

**Required Output Format (all text content in ${feedbackLanguage}):**
{
  "overallScore": [0-100],
  "breakdown": {
    "technical": [0-100],
    "communication": [0-100],
    "problemSolving": [0-100],
    "behavioral": [0-100]
  },
  "strengths": ["strength1 in ${feedbackLanguage}", "strength2 in ${feedbackLanguage}", "strength3 in ${feedbackLanguage}"],
  "improvements": ["area1 in ${feedbackLanguage}", "area2 in ${feedbackLanguage}", "area3 in ${feedbackLanguage}"],
  "detailedFeedback": "comprehensive paragraph analysis in ${feedbackLanguage}",
  "actionableAdvice": ["tip1 in ${feedbackLanguage}", "tip2 in ${feedbackLanguage}", "tip3 in ${feedbackLanguage}"],
  "industryBenchmark": "comparison to industry standards in ${feedbackLanguage}",
  "confidenceLevel": "low/medium/high"
}`;

    return prompt;
  }

  /**
   * Parse AI feedback response into structured format
   */
  parseFeedbackResponse(feedbackText, question, answer) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          feedback: {
            ...parsed,
            timestamp: new Date(),
            analysisType: "ai-advanced",
            questionCategory: question.category || "general",
            answerLength: answer.length,
            processingTime: Date.now(),
          },
        };
      }
    } catch (error) {
      console.error("Failed to parse AI feedback:", error);
    }

    // Fallback parsing if JSON extraction fails
    return this.extractFeedbackFromText(feedbackText, question, answer);
  }

  /**
   * Extract feedback from unstructured text
   */
  extractFeedbackFromText(text, question, answer) {
    const feedback = {
      overallScore: this.extractScore(text),
      breakdown: {
        technical: this.extractCategoryScore(text, "technical"),
        communication: this.extractCategoryScore(text, "communication"),
        problemSolving: this.extractCategoryScore(text, "problem"),
        behavioral: this.extractCategoryScore(text, "behavioral"),
      },
      strengths: this.extractList(text, [
        "strength",
        "positive",
        "good",
        "well",
      ]),
      improvements: this.extractList(text, [
        "improve",
        "enhance",
        "consider",
        "suggest",
      ]),
      detailedFeedback: this.extractMainFeedback(text),
      actionableAdvice: this.extractActionableAdvice(text),
      industryBenchmark: this.determineBenchmark(text),
      confidenceLevel: this.determineConfidence(text),
      timestamp: new Date(),
      analysisType: "ai-parsed",
      questionCategory: question.category || "general",
      answerLength: answer.length,
    };

    return { success: true, feedback };
  }

  /**
   * Generate comprehensive interview report
   */
  async generateInterviewReport(interview) {
    try {
      const reportData = {
        interviewId: interview._id,
        candidate: {
          userId: interview.userId,
          jobRole: interview.config.jobRole,
          experienceLevel: interview.config.experienceLevel,
          testDate: interview.createdAt,
        },
        summary: this.generateSummaryAnalysis(interview),
        performanceMetrics: this.calculatePerformanceMetrics(interview),
        questionAnalysis: this.analyzeQuestionPerformance(interview),
        skillsAssessment: this.generateSkillsAssessment(interview),
        behavioralInsights: this.generateBehavioralInsights(interview),
        recommendations: this.generateRecommendations(interview),
        industryComparison: this.generateIndustryComparison(interview),
        nextSteps: this.generateNextSteps(interview),
      };

      // Generate AI-powered insights if available
      if (this.isConfigured) {
        reportData.aiInsights = await this.generateAIInsights(interview);
      }

      return {
        success: true,
        report: reportData,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error("Report generation failed:", error);
      return {
        success: false,
        error: "Failed to generate comprehensive report",
        basicReport: this.generateBasicReport(interview),
      };
    }
  }

  /**
   * Generate AI-powered insights for the interview
   */
  async generateAIInsights(interview) {
    try {
      const prompt = `
Analyze this complete interview performance and provide strategic insights:

**Interview Overview:**
- Job Role: ${interview.config.jobRole}
- Experience Level: ${interview.config.experienceLevel}
- Total Questions: ${interview.questions.length}
- Overall Score: ${interview.results.overallScore}
- Duration: ${interview.timing.totalDuration} minutes

**Question Performance:**
${interview.questions
  .map(
    (q, index) => `
Q${index + 1}: ${q.questionText.substring(0, 100)}...
Answer Length: ${q.response?.text?.length || 0} characters
Score: ${q.score?.overall || 0}/100
`
  )
  .join("")}

Provide strategic insights about:
1. Overall readiness for the target role
2. Key strengths to leverage
3. Critical areas for improvement
4. Market positioning compared to similar candidates
5. Specific preparation recommendations
6. Timeline for improvement`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a senior technical recruiter and career strategist with 15+ years of experience.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 800,
      });

      return {
        strategicAnalysis: response.choices[0].message.content,
        readinessLevel: this.calculateReadinessLevel(interview),
        competitivePosition: this.assessCompetitivePosition(interview),
        improvementTimeline: this.estimateImprovementTimeline(interview),
      };
    } catch (error) {
      console.error("AI insights generation failed:", error);
      return null;
    }
  }

  /**
   * Fallback feedback for when AI is not available
   */
  generateFallbackFeedback(question, answer, config) {
    const answerLength = answer.length;
    const words = answer.split(" ").length;

    // Basic scoring algorithm
    const scores = {
      technical: this.calculateTechnicalScore(answer, question, config),
      communication: this.calculateCommunicationScore(answer, words),
      problemSolving: this.calculateProblemSolvingScore(answer, question),
      behavioral: this.calculateBehavioralScore(answer, config),
    };

    const overallScore = Math.round(
      scores.technical * this.criteria.technical +
        scores.communication * this.criteria.communication +
        scores.problemSolving * this.criteria.problemSolving +
        scores.behavioral * this.criteria.behavioral
    );

    return {
      success: true,
      feedback: {
        overallScore,
        breakdown: scores,
        strengths: this.identifyStrengths(scores, answer),
        improvements: this.identifyImprovements(scores, answer),
        detailedFeedback: this.generateDetailedFallbackFeedback(
          scores,
          answer,
          question
        ),
        actionableAdvice: this.generateActionableAdvice(scores, config),
        industryBenchmark: this.determineBenchmarkFallback(overallScore),
        confidenceLevel: answerLength > 100 ? "medium" : "low",
        timestamp: new Date(),
        analysisType: "rule-based",
        questionCategory: question.category || "general",
        answerLength: answerLength,
      },
    };
  }

  // Helper methods for scoring and analysis
  calculateTechnicalScore(answer, question, config) {
    const technicalTerms = [
      "function",
      "variable",
      "object",
      "array",
      "api",
      "database",
      "component",
      "state",
      "props",
      "async",
      "await",
      "promise",
      "algorithm",
      "complexity",
      "performance",
      "security",
    ];

    const answerLower = answer.toLowerCase();
    const termCount = technicalTerms.filter((term) =>
      answerLower.includes(term)
    ).length;

    let baseScore = Math.min(80, termCount * 8 + 20);

    // Adjust based on question type
    if (question.category === "technical") {
      baseScore = Math.min(100, baseScore + 10);
    }

    // Adjust based on experience level
    if (config.experienceLevel === "advanced" && termCount < 3) {
      baseScore = Math.max(0, baseScore - 20);
    }

    return baseScore;
  }

  calculateCommunicationScore(answer, wordCount) {
    let score = 40; // Base score

    // Word count scoring
    if (wordCount >= 50) score += 20;
    if (wordCount >= 100) score += 15;
    if (wordCount >= 200) score += 10;

    // Structure indicators
    if (/first|second|third|finally/i.test(answer)) score += 10;
    if (/for example|such as|like/i.test(answer)) score += 10;
    if (/because|therefore|however|although/i.test(answer)) score += 5;

    return Math.min(100, score);
  }

  calculateProblemSolvingScore(answer, question) {
    let score = 30; // Base score

    const problemSolvingIndicators = [
      "approach",
      "method",
      "step",
      "process",
      "solution",
      "analyze",
      "consider",
      "evaluate",
      "alternative",
      "option",
    ];

    const answerLower = answer.toLowerCase();
    const indicatorCount = problemSolvingIndicators.filter((indicator) =>
      answerLower.includes(indicator)
    ).length;

    score += indicatorCount * 10;

    // Bonus for systematic thinking
    if (/first.*then|step.*step/i.test(answer)) score += 15;
    if (/pros.*cons|advantages.*disadvantages/i.test(answer)) score += 15;

    return Math.min(100, score);
  }

  calculateBehavioralScore(answer, config) {
    let score = 50; // Base score

    const positiveIndicators = [
      "team",
      "collaborate",
      "learn",
      "improve",
      "challenge",
      "experience",
      "project",
      "responsibility",
      "leadership",
    ];

    const answerLower = answer.toLowerCase();
    const positiveCount = positiveIndicators.filter((indicator) =>
      answerLower.includes(indicator)
    ).length;

    score += positiveCount * 7;

    // Bonus for specific examples
    if (/in my previous|at my last|when I worked/i.test(answer)) score += 15;

    return Math.min(100, score);
  }

  // Additional helper methods
  extractScore(text) {
    const scoreMatch = text.match(/(\d+)\/100|(\d+)%|score[:\s]*(\d+)/i);
    if (scoreMatch) {
      return parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
    }
    return 60; // Default score
  }

  extractCategoryScore(text, category) {
    const pattern = new RegExp(`${category}[:\\s]*(\d+)`, "i");
    const match = text.match(pattern);
    return match ? parseInt(match[1]) : 60;
  }

  extractList(text, keywords) {
    const items = [];
    const lines = text.split("\n");

    lines.forEach((line) => {
      if (keywords.some((keyword) => line.toLowerCase().includes(keyword))) {
        const cleanLine = line.replace(/^[-*•]\s*/, "").trim();
        if (cleanLine.length > 5) items.push(cleanLine);
      }
    });

    return items.slice(0, 5); // Limit to 5 items
  }

  extractMainFeedback(text) {
    // Find the longest paragraph as main feedback
    const paragraphs = text.split("\n\n");
    return paragraphs
      .reduce(
        (longest, current) =>
          current.length > longest.length ? current : longest,
        ""
      )
      .trim();
  }

  generateSummaryAnalysis(interview) {
    const totalQuestions = interview.questions.length;
    const answeredQuestions = interview.questions.filter(
      (q) => q.response && q.response.text
    ).length;
    const averageScore = interview.results.overallScore;

    let performance = "needs improvement";
    if (averageScore >= 80) performance = "excellent";
    else if (averageScore >= 70) performance = "good";
    else if (averageScore >= 60) performance = "average";

    return {
      overallPerformance: performance,
      completionRate: Math.round((answeredQuestions / totalQuestions) * 100),
      averageScore: averageScore,
      totalDuration: interview.timing.totalDuration,
      readinessIndicator: this.calculateReadinessLevel(interview),
    };
  }

  calculateReadinessLevel(interview) {
    const score = interview.results.overallScore;
    const completion =
      interview.questions.filter((q) => q.response).length /
      interview.questions.length;

    if (score >= 80 && completion >= 0.9) return "ready";
    if (score >= 65 && completion >= 0.8) return "nearly-ready";
    if (score >= 50 && completion >= 0.7) return "needs-practice";
    return "significant-preparation-needed";
  }

  identifyStrengths(scores, answer) {
    const strengths = [];

    if (scores.technical >= 70) strengths.push("Strong technical knowledge");
    if (scores.communication >= 70)
      strengths.push("Clear communication skills");
    if (scores.problemSolving >= 70)
      strengths.push("Good problem-solving approach");
    if (scores.behavioral >= 70)
      strengths.push("Positive behavioral indicators");
    if (answer.length > 200) strengths.push("Comprehensive answers");

    return strengths.length > 0 ? strengths : ["Shows potential for growth"];
  }

  identifyImprovements(scores, answer) {
    const improvements = [];

    if (scores.technical < 60)
      improvements.push("Strengthen technical concepts");
    if (scores.communication < 60)
      improvements.push("Improve answer clarity and structure");
    if (scores.problemSolving < 60)
      improvements.push("Develop systematic problem-solving approach");
    if (scores.behavioral < 60)
      improvements.push("Include more specific examples");
    if (answer.length < 50)
      improvements.push("Provide more detailed responses");

    return improvements.length > 0
      ? improvements
      : ["Continue building on existing strengths"];
  }
}

module.exports = new AdvancedFeedbackService();
