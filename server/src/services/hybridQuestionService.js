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
    const { questionCount: requestedCount, category } = config; // optional category filter
    // eslint-disable-next-line no-magic-numbers
    const questionCount = requestedCount || 10;

    try {
      // Check cache first
      const cachedQuestions = await this.getCachedQuestions(config);
      if (cachedQuestions) {
        Logger.debug("Using cached questions for interview");
        await cachedQuestions.markUsed();
        // Ensure padding in case older cache stored fewer than requested
        const padded = this.ensureQuestionCount(
          [...cachedQuestions.questions],
          questionCount,
          config
        );
        if (padded.length !== cachedQuestions.questions.length) {
          Logger.warn(
            `Padded cached question set from ${cachedQuestions.questions.length} to ${padded.length}`
          );
        }
        return padded;
      }

      // Generate new hybrid question set
      let questions = await this.generateNewQuestionSet(config);
      // If explicit category requested, filter down before padding
      if (category) {
        const norm = String(category).toLowerCase();
        questions = questions.filter((q) => {
          const qc = (q.category || q.type || "").toLowerCase();
          if (norm === "behavioral")
            return qc === "behavioral" || qc.includes("behavior");
          if (norm === "technical")
            return qc === "technical" || qc.includes("tech");
          if (norm === "system-design")
            return qc.includes("system") || qc.includes("design");
          return true;
        });
      }
      questions = this.ensureQuestionCount(questions, questionCount, config);

      // Cache the generated questions
      await this.cacheQuestions(config, questions);

      Logger.success(
        // eslint-disable-next-line prefer-template
        `Generated ${questions.length} hybrid questions${
          category ? ` for category ${category}` : ""
        }`
      );
      return questions;
    } catch (error) {
      Logger.error("Error generating hybrid questions:", error);
      // Fallback to AI service
      const aiFallback = await aiQuestionService.generateQuestions(config);
      return this.ensureQuestionCount(aiFallback, questionCount, config);
    }
  }

  /**
   * Generate new question set with hybrid approach
   * @param {Object} config - Interview configuration
   * @returns {Promise<Array>} Array of questions
   */
  async generateNewQuestionSet(config) {
    const { questionCount, category } = config;

    await this.loadTemplates();

    // Calculate question distribution (70% templates, 30% AI)
    // Distribution constants
    const TEMPLATE_RATIO = 0.7; // 70% templates
    const templateCount = Math.ceil(questionCount * TEMPLATE_RATIO);
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
      const aiQuestions = await this.generateAIQuestions(
        config,
        aiCount,
        category
      );
      questions = questions.concat(aiQuestions);
    }

    // 3. Ensure balanced coverage of tags
    questions = this.balanceQuestionTags(questions, questionCount);

    // 4. Shuffle questions for variety
    questions = this.shuffleArray(questions);

    const sliced = questions.slice(0, questionCount);
    return this.ensureQuestionCount(sliced, questionCount, config);
  }

  /**
   * Guarantee the returned array has exactly target questions by generating synthetic variants.
   * This prevents UI mismatch when templates/AI/paraphrasing under-produce.
   */
  ensureQuestionCount(questions, targetCount, config) {
    const result = [...questions];
    // Timing constants
    // eslint-disable-next-line no-magic-numbers
    const SECONDS_PER_FIVE_MIN = 300;
    const ESTIMATED_TIME_SEC = SECONDS_PER_FIVE_MIN;
    const PARAPHRASE_ENABLED =
      (process.env.VARIANT_PARAPHRASE_ENABLED || "").toLowerCase() === "true";

    // Lightweight synonym pools (deterministic selection)
    const SYNONYMS = {
      describe: ["Explain", "Walk me through", "Outline", "Detail"],
      challenge: ["problem", "issue", "obstacle", "difficulty"],
      approach: ["method", "strategy", "solution path", "tactic"],
      improve: ["optimize", "enhance", "refine", "strengthen"],
      experience: ["background", "exposure", "history", "track record"],
    };

    function paraphrase(text, vIdx) {
      if (!PARAPHRASE_ENABLED) return text;
      let out = text;
      const lower = out.toLowerCase();
      const replaceKeys = [];
      Object.keys(SYNONYMS).forEach((k) => {
        if (lower.includes(k)) replaceKeys.push(k);
      });
      if (replaceKeys.length === 0) return out;
      replaceKeys.forEach((key) => {
        const pool = SYNONYMS[key];
        const hash = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
        const pick = pool[(hash + vIdx) % pool.length];
        const regex = new RegExp(key, "ig");
        out = out.replace(regex, (m) => {
          const cap = m[0] === m[0].toUpperCase();
          return cap
            ? pick.charAt(0).toUpperCase() + pick.slice(1)
            : pick.toLowerCase();
        });
      });
      // eslint-disable-next-line no-magic-numbers
      const EVEN_MODULUS = 2;
      if (vIdx % EVEN_MODULUS === 0) {
        const QUALIFIERS = [
          " Give specifics.",
          " Focus on trade-offs.",
          " Highlight key decisions.",
          " Include metrics if possible.",
        ];
        out = out.replace(/\.?$/, "") + QUALIFIERS[vIdx % QUALIFIERS.length];
      }
      return out;
    }
    if (result.length === 0) {
      // Seed at least one generic question to duplicate from
      result.push({
        text: `Describe a challenge related to ${config.jobRole}.`,
        category: config.jobRole || "general",
        tags: ["General"],
        difficulty: config.difficulty || "intermediate",
        estimatedTime: ESTIMATED_TIME_SEC,
        type: config.interviewType || "mixed",
        source: "synthetic-seed",
        // eslint-disable-next-line no-magic-numbers
        id: `synthetic_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      });
    }
    const baseLen = result.length;
    let variantIdx = 1;
    while (result.length < targetCount) {
      const base = result[result.length % baseLen];
      result.push({
        ...base,
        text: (() => {
          const core = base.text
            .replace(/\(variant.*\)$/i, "")
            .replace(
              /\s+Give specifics\.|\s+Focus on trade-offs\.|\s+Highlight key decisions\.|\s+Include metrics if possible\.$/,
              ""
            )
            .trim();
          const paraphrased = paraphrase(core, variantIdx);
          return `${paraphrased} (variant ${variantIdx})`;
        })(),
        source: `${base.source || "template"}-${
          PARAPHRASE_ENABLED ? "paravariant" : "dup"
        }`,
        // eslint-disable-next-line no-magic-numbers
        id: (() => {
          // eslint-disable-next-line no-magic-numbers
          const RADIX = 36;
          // eslint-disable-next-line no-magic-numbers
          const START = 2;
          // eslint-disable-next-line no-magic-numbers
          const END = 6;
          return `dup_${Date.now()}_${result.length}_${Math.random()
            .toString(RADIX)
            .slice(START, END)}`;
        })(),
        generatedAt: new Date(),
      });
      variantIdx += 1;
    }
    // If somehow over (shouldn't happen) trim.
    return result.slice(0, targetCount);
  }

  /**
   * Get template-based questions
      questionCount,
    const { jobRole, interviewType, difficulty } = config;

    let templateQuestions = [];
    const roleTemplates =
      this.templates[jobRole] || this.templates["software-engineer"];
    // Use difficulty tier for selecting templates; default to 'intermediate'
    // eslint-disable-next-line no-magic-numbers
    const TEMPLATE_RATIO = 0.7; // 70% templates
      roleTemplates[difficulty] || roleTemplates["intermediate"];

    // Get questions based on interview type
    if (interviewType === "mixed") {
      // Mix of technical and behavioral
  const TECH_RATIO = 0.7; // 70% technical in mixed mode
  const techCount = Math.ceil(count * TECH_RATIO);
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
  // eslint-disable-next-line no-magic-numbers
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
      const NEW_AI_RATIO = 0.5; // half new, half paraphrased
      const newAICount = Math.ceil(count * NEW_AI_RATIO);
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
            // eslint-disable-next-line no-magic-numbers
            estimatedTime: q.timeEstimate
              ? // eslint-disable-next-line no-magic-numbers
                q.timeEstimate * 60
              : SECONDS_PER_FIVE_MIN,
            type: q.type || config.interviewType,
            difficulty: q.difficulty || config.difficulty,
            source: "ai_generated",
            generatedAt: new Date(),
            // eslint-disable-next-line no-magic-numbers
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
      const templateQuestions = await this.getTemplateQuestions(
        config,
        // eslint-disable-next-line no-magic-numbers
        count * 2
      ); // Get more templates to paraphrase from
      const questionsToParaphrase = this.selectRandomQuestions(
        templateQuestions,
        count
      );

      const paraphrased = [];
      for (const question of questionsToParaphrase) {
        try {
          const paraphrasedText = await this.paraphraseQuestion(
            question.text,
            config
          );
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
              // eslint-disable-next-line no-magic-numbers
              id: (() => {
                // eslint-disable-next-line no-magic-numbers
                const RADIX = 36;
                // eslint-disable-next-line no-magic-numbers
                const START = 2;
                // eslint-disable-next-line no-magic-numbers
                const LEN = 9;
                return `paraphrased_${Date.now()}_${Math.random()
                  .toString(RADIX)
                  .substr(START, LEN)}`;
              })(),
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
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
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

      const response = await aiQuestionService
        .getOpenAIClient()
        .chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an expert interviewer who can rephrase questions while maintaining their intent and difficulty.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 200,
        });

      const paraphrased = response.choices[0]?.message?.content?.trim();
      // eslint-disable-next-line no-magic-numbers
      const MIN_PARAPHRASE_LENGTH = 10;
      return paraphrased && paraphrased.length > MIN_PARAPHRASE_LENGTH
        ? paraphrased
        : null;
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
      DSA: 0.2, // 20% DSA
      "System Design": 0.2, // 20% System Design
      DB: 0.15, // 15% Database
      Behavioral: 0.25, // 25% Behavioral
      "Programming Fundamentals": 0.2, // 20% Programming Fundamentals
    };

    const taggedQuestions = {};
    const untaggedQuestions = [];

    // Categorize questions by primary tag
    questions.forEach((question) => {
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
    Object.keys(requiredTags).forEach((tag) => {
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
        ...Object.values(taggedQuestions)
          .flat()
          .filter((q) => !balancedQuestions.includes(q)),
        ...untaggedQuestions,
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
    if (
      text.includes("algorithm") ||
      text.includes("data structure") ||
      text.includes("complexity")
    ) {
      tags.push("DSA");
    }
    if (
      text.includes("database") ||
      text.includes("sql") ||
      text.includes("nosql")
    ) {
      tags.push("DB");
    }
    if (
      text.includes("system") ||
      text.includes("design") ||
      text.includes("architecture") ||
      text.includes("scalability")
    ) {
      tags.push("System Design");
    }
    if (
      text.includes("variable") ||
      text.includes("function") ||
      text.includes("programming") ||
      category === "javascript"
    ) {
      tags.push("Programming Fundamentals");
    }
    if (
      text.includes("react") ||
      text.includes("frontend") ||
      text.includes("component")
    ) {
      tags.push("Frontend");
    }
    if (
      text.includes("api") ||
      text.includes("backend") ||
      text.includes("server")
    ) {
      tags.push("Backend");
    }

    // Behavioral tags
    if (
      text.includes("tell me about") ||
      text.includes("describe a time") ||
      text.includes("how do you")
    ) {
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
        expiresAt: { $gt: new Date() },
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
        // Cache TTL constants
        // eslint-disable-next-line no-magic-numbers
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
        expiresAt: { $lt: new Date() },
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
        expiresAt: { $gt: new Date() },
      });
      const totalUsage = await CachedQuestion.aggregate([
        { $group: { _id: null, totalUsage: { $sum: "$usageCount" } } },
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
