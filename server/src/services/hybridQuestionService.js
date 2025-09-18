const fs = require("fs").promises;
const path = require("path");
const aiQuestionService = require("./aiQuestionService");
const CachedQuestion = require("../models/CachedQuestion");
const Logger = require("../utils/logger");

class HybridQuestionService {
  constructor() {
    this.templates = null;
    this.templatesPath = path.join(__dirname, "../data/questionTemplates.json");
  }

  // Load question templates
  async loadTemplates() {
    if (!this.templates) {
      try {
        const data = await fs.readFile(this.templatesPath, "utf8");
        this.templates = JSON.parse(data);
        Logger.debug("Question templates loaded successfully");
      } catch (error) {
        Logger.error("Failed to load question templates:", error);
        this.templates = {};
      }
    }
    return this.templates;
  }

  /**
   * Generate hybrid questions for interview session
   * @param {Object} config - Interview configuration
   * @returns {Promise<Array>} Array of questions
   */
  async generateHybridQuestions(config) {
    const {
      jobRole,
      experienceLevel,
      interviewType,
      difficulty,
      questionCount = 10,
    } = config;

    try {
      // Check cache first
      const cachedQuestions = await this.getCachedQuestions(config);
      if (cachedQuestions) {
        Logger.debug("Using cached questions for interview");
        await cachedQuestions.markUsed();
        return cachedQuestions.questions;
      }

      // Generate new hybrid question set
      const questions = await this.generateNewQuestionSet(config);

      // Cache the generated questions
      await this.cacheQuestions(config, questions);

      Logger.success(
        `Generated ${questions.length} hybrid questions for ${jobRole} - ${experienceLevel}`
      );
      return questions;
    } catch (error) {
      Logger.error("Error generating hybrid questions:", error);
      // Fallback to AI service
      return await aiQuestionService.generateQuestions(config);
    }
  }

  /**
   * Generate new question set with hybrid approach
   * @param {Object} config - Interview configuration
   * @returns {Promise<Array>} Array of questions
   */
  async generateNewQuestionSet(config) {
    const {
      jobRole,
      experienceLevel,
      interviewType,
      difficulty,
      questionCount = 10,
    } = config;

    await this.loadTemplates();

    // Calculate question distribution (70% templates, 30% AI)
    const templateCount = Math.ceil(questionCount * 0.7);
    const aiCount = questionCount - templateCount;

    let questions = [];

    // 1. Get template-based questions (70%)
    const templateQuestions = await this.getTemplateQuestions(
      config,
      templateCount
    );
    questions = questions.concat(templateQuestions);

    // 2. Generate AI questions for remaining slots (30%)
    if (aiCount > 0) {
      const aiQuestions = await this.generateAIQuestions(config, aiCount);
      questions = questions.concat(aiQuestions);
    }

    // 3. Ensure balanced coverage of tags
    questions = this.balanceQuestionTags(questions, questionCount);

    // 4. Shuffle questions for variety
    questions = this.shuffleArray(questions);

    return questions.slice(0, questionCount);
  }

  /**
   * Get template-based questions
   * @param {Object} config - Interview configuration
   * @param {Number} count - Number of questions needed
   * @returns {Array} Template questions
   */
  async getTemplateQuestions(config, count) {
    const { jobRole, experienceLevel, interviewType, difficulty } = config;

    let templateQuestions = [];
    const roleTemplates = this.templates[jobRole] || this.templates["software-engineer"];
    const levelTemplates = roleTemplates[experienceLevel] || roleTemplates["intermediate"];

    // Get questions based on interview type
    if (interviewType === "mixed") {
      // Mix of technical and behavioral
      const techCount = Math.ceil(count * 0.7);
      const behavioralCount = count - techCount;

      if (levelTemplates.technical) {
        templateQuestions = templateQuestions.concat(
          this.selectRandomQuestions(levelTemplates.technical, techCount)
        );
      }
      if (levelTemplates.behavioral) {
        templateQuestions = templateQuestions.concat(
          this.selectRandomQuestions(levelTemplates.behavioral, behavioralCount)
        );
      }
    } else {
      // Single type
      const typeQuestions = levelTemplates[interviewType] || [];
      templateQuestions = this.selectRandomQuestions(typeQuestions, count);
    }

    // Add metadata to template questions
    return templateQuestions.map((q) => ({
      ...q,
      source: "template",
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));
  }

  /**
   * Generate AI questions (either new or paraphrased from templates)
   * @param {Object} config - Interview configuration
   * @param {Number} count - Number of questions needed
   * @returns {Promise<Array>} AI generated questions
   */
  async generateAIQuestions(config, count) {
    try {
      // 50% completely new AI questions, 50% paraphrased templates
      const newAICount = Math.ceil(count * 0.5);
      const paraphrasedCount = count - newAICount;

      let aiQuestions = [];

      // Generate completely new AI questions
      if (newAICount > 0) {
        const newQuestions = await aiQuestionService.generateQuestions({
          ...config,
          questionCount: newAICount,
        });

        aiQuestions = aiQuestions.concat(
          newQuestions.map((q) => ({
            text: q.text || q.question,
            category: q.category || config.jobRole,
            tags: this.inferTags(q.text || q.question, q.category),
            difficulty: q.difficulty || config.difficulty,
            estimatedTime: q.timeEstimate ? q.timeEstimate * 60 : 300,
            type: q.type || config.interviewType,
            source: "ai_generated",
            generatedAt: new Date(),
            id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          }))
        );
      }

      // Generate paraphrased template questions
      if (paraphrasedCount > 0) {
        const paraphrasedQuestions = await this.generateParaphrasedQuestions(
          config,
          paraphrasedCount
        );
        aiQuestions = aiQuestions.concat(paraphrasedQuestions);
      }

      return aiQuestions;
    } catch (error) {
      Logger.error("Error generating AI questions:", error);
      // Fallback to more template questions
      return await this.getTemplateQuestions(config, count);
    }
  }

  /**
   * Generate paraphrased versions of template questions using AI
   * @param {Object} config - Interview configuration
   * @param {Number} count - Number of questions needed
   * @returns {Promise<Array>} Paraphrased questions
   */
  async generateParaphrasedQuestions(config, count) {
    try {
      const templateQuestions = await this.getTemplateQuestions(config, count * 2); // Get more templates to paraphrase from
      const questionsToParaphrase = this.selectRandomQuestions(templateQuestions, count);

      const paraphrased = [];
      for (const question of questionsToParaphrase) {
        try {
          const paraphrasedText = await this.paraphraseQuestion(question.text, config);
          if (paraphrasedText) {
            paraphrased.push({
              text: paraphrasedText,
              category: question.category,
              tags: question.tags,
              difficulty: question.difficulty,
              estimatedTime: question.estimatedTime,
              type: question.type,
              source: "ai_paraphrased",
              originalTemplateId: question.id,
              paraphrasedFrom: question.text,
              generatedAt: new Date(),
              id: `paraphrased_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            });
          }
        } catch (error) {
          Logger.error("Error paraphrasing question:", error);
          // Use original template if paraphrasing fails
          paraphrased.push({
            ...question,
            source: "template_fallback",
          });
        }
      }

      return paraphrased;
    } catch (error) {
      Logger.error("Error generating paraphrased questions:", error);
      return [];
    }
  }

  /**
   * Paraphrase a single question using AI
   * @param {String} questionText - Original question text
   * @param {Object} config - Interview configuration
   * @returns {Promise<String>} Paraphrased question
   */
  async paraphraseQuestion(questionText, config) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
      return null;
    }

    try {
      const prompt = `Paraphrase this interview question while maintaining its intent and difficulty level:

Original Question: "${questionText}"

Job Role: ${config.jobRole}
Experience Level: ${config.experienceLevel}
Difficulty: ${config.difficulty}

Requirements:
1. Keep the same core concept and difficulty
2. Make it sound natural and interview-appropriate
3. Maintain technical accuracy
4. Use slightly different wording and structure
5. Return only the paraphrased question, no additional text

Paraphrased Question:`;

      const response = await aiQuestionService.getOpenAIClient().chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert interviewer who can rephrase questions while maintaining their intent and difficulty.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const paraphrased = response.choices[0]?.message?.content?.trim();
      return paraphrased && paraphrased.length > 10 ? paraphrased : null;
    } catch (error) {
      Logger.error("Error paraphrasing question:", error);
      return null;
    }
  }

  /**
   * Balance question tags for comprehensive coverage
   * @param {Array} questions - Array of questions
   * @param {Number} targetCount - Target number of questions
   * @returns {Array} Balanced questions
   */
  balanceQuestionTags(questions, targetCount) {
    // Define required tag categories and minimum coverage
    const requiredTags = {
      "DSA": 0.2,           // 20% DSA
      "System Design": 0.2,  // 20% System Design
      "DB": 0.15,           // 15% Database
      "Behavioral": 0.25,   // 25% Behavioral
      "Programming Fundamentals": 0.2, // 20% Programming Fundamentals
    };

    const taggedQuestions = {};
    const untaggedQuestions = [];

    // Categorize questions by primary tag
    questions.forEach(question => {
      const primaryTag = this.getPrimaryTag(question.tags, requiredTags);
      if (primaryTag) {
        if (!taggedQuestions[primaryTag]) {
          taggedQuestions[primaryTag] = [];
        }
        taggedQuestions[primaryTag].push(question);
      } else {
        untaggedQuestions.push(question);
      }
    });

    // Build balanced question set
    const balancedQuestions = [];
    const remainingSlots = { ...requiredTags };

    // Fill required minimums
    Object.keys(requiredTags).forEach(tag => {
      const required = Math.floor(targetCount * requiredTags[tag]);
      const available = taggedQuestions[tag] || [];
      const selected = available.slice(0, required);
      balancedQuestions.push(...selected);
      remainingSlots[tag] = Math.max(0, required - selected.length);
    });

    // Fill remaining slots with available questions
    const remaining = targetCount - balancedQuestions.length;
    if (remaining > 0) {
      const allRemaining = [
        ...Object.values(taggedQuestions).flat().filter(q => !balancedQuestions.includes(q)),
        ...untaggedQuestions
      ];
      balancedQuestions.push(...allRemaining.slice(0, remaining));
    }

    return balancedQuestions;
  }

  /**
   * Get primary tag from question tags
   * @param {Array} tags - Question tags
   * @param {Object} requiredTags - Required tag categories
   * @returns {String|null} Primary tag
   */
  getPrimaryTag(tags, requiredTags) {
    if (!tags || !Array.isArray(tags)) return null;
    
    for (const tag of tags) {
      if (requiredTags.hasOwnProperty(tag)) {
        return tag;
      }
    }
    return null;
  }

  /**
   * Infer tags from question text and category
   * @param {String} questionText - Question text
   * @param {String} category - Question category
   * @returns {Array} Inferred tags
   */
  inferTags(questionText, category) {
    const tags = [];
    const text = questionText.toLowerCase();

    // Technical tags
    if (text.includes("algorithm") || text.includes("data structure") || text.includes("complexity")) {
      tags.push("DSA");
    }
    if (text.includes("database") || text.includes("sql") || text.includes("nosql")) {
      tags.push("DB");
    }
    if (text.includes("system") || text.includes("design") || text.includes("architecture") || text.includes("scalability")) {
      tags.push("System Design");
    }
    if (text.includes("variable") || text.includes("function") || text.includes("programming") || category === "javascript") {
      tags.push("Programming Fundamentals");
    }
    if (text.includes("react") || text.includes("frontend") || text.includes("component")) {
      tags.push("Frontend");
    }
    if (text.includes("api") || text.includes("backend") || text.includes("server")) {
      tags.push("Backend");
    }

    // Behavioral tags
    if (text.includes("tell me about") || text.includes("describe a time") || text.includes("how do you")) {
      tags.push("Behavioral");
    }

    return tags.length > 0 ? tags : ["General"];
  }

  /**
   * Select random questions from array
   * @param {Array} questions - Source questions
   * @param {Number} count - Number to select
   * @returns {Array} Selected questions
   */
  selectRandomQuestions(questions, count) {
    if (!questions || questions.length === 0) return [];
    if (questions.length <= count) return [...questions];
    
    const shuffled = this.shuffleArray([...questions]);
    return shuffled.slice(0, count);
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get cached questions for configuration
   * @param {Object} config - Interview configuration
   * @returns {Promise<Object|null>} Cached questions or null
   */
  async getCachedQuestions(config) {
    try {
      const cacheKey = CachedQuestion.generateCacheKey(config);
      const cached = await CachedQuestion.findOne({ 
        cacheKey,
        expiresAt: { $gt: new Date() }
      });
      return cached;
    } catch (error) {
      Logger.error("Error retrieving cached questions:", error);
      return null;
    }
  }

  /**
   * Cache generated questions
   * @param {Object} config - Interview configuration
   * @param {Array} questions - Generated questions
   * @returns {Promise<void>}
   */
  async cacheQuestions(config, questions) {
    try {
      const cacheKey = CachedQuestion.generateCacheKey(config);
      
      // Remove existing cache for this configuration
      await CachedQuestion.deleteOne({ cacheKey });

      // Create new cache entry
      const cachedQuestion = new CachedQuestion({
        cacheKey,
        config,
        questions,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      await cachedQuestion.save();
      Logger.debug(`Cached ${questions.length} questions for ${cacheKey}`);
    } catch (error) {
      Logger.error("Error caching questions:", error);
    }
  }

  /**
   * Clear expired cache entries
   * @returns {Promise<void>}
   */
  async clearExpiredCache() {
    try {
      const result = await CachedQuestion.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      if (result.deletedCount > 0) {
        Logger.debug(`Cleared ${result.deletedCount} expired cache entries`);
      }
    } catch (error) {
      Logger.error("Error clearing expired cache:", error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    try {
      const totalEntries = await CachedQuestion.countDocuments();
      const validEntries = await CachedQuestion.countDocuments({
        expiresAt: { $gt: new Date() }
      });
      const totalUsage = await CachedQuestion.aggregate([
        { $group: { _id: null, totalUsage: { $sum: "$usageCount" } } }
      ]);

      return {
        totalEntries,
        validEntries,
        expiredEntries: totalEntries - validEntries,
        totalUsage: totalUsage[0]?.totalUsage || 0,
      };
    } catch (error) {
      Logger.error("Error getting cache stats:", error);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalUsage: 0,
      };
    }
  }
}

module.exports = new HybridQuestionService();