const fs = require("fs").promises;
const path = require("path");
const aiQuestionService = require("./aiQuestionService");
const CachedQuestion = require("../models/CachedQuestion");
const Logger = require("../utils/logger");
const { mapDifficulty } = require("../utils/questionNormalization");

class HybridQuestionService {
  constructor() {
    this.templates = null;
    this.templatesPath = path.join(__dirname, "../data/questionTemplates.json");
  }

  // Sanitize incoming config to conform to enums expected by CachedQuestion / Question schemas
  sanitizeConfig(config) {
    const allowedExperience = [
      "entry",
      "junior",
      "mid",
      "senior",
      "lead",
      "executive",
    ];
    const difficultyToExperienceMap = {
      beginner: "entry",
      intermediate: "mid",
      advanced: "senior",
    };
    const sanitized = { ...config };
    if (!allowedExperience.includes(sanitized.experienceLevel)) {
      // Map common difficulty synonyms accidentally passed as experience level
      const lower = String(sanitized.experienceLevel || "").toLowerCase();
      sanitized.experienceLevel = difficultyToExperienceMap[lower] || "entry"; // default lowest tier
    }
    // Ensure difficulty is valid (beginner|intermediate|advanced)
    sanitized.difficulty = mapDifficulty(
      sanitized.difficulty || "intermediate"
    );
    // Normalize question count for caching schema
    const countRaw = sanitized.questionCount ?? sanitized.count;
    const parsed = Number(countRaw);
    // eslint-disable-next-line no-magic-numbers
    sanitized.questionCount =
      Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
    return sanitized;
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
    const safeConfig = this.sanitizeConfig(config);
    const { questionCount: requestedCount, category } = safeConfig; // optional category filter
    // eslint-disable-next-line no-magic-numbers
    const questionCount = requestedCount || 10;

    try {
      // Check cache first
      const cachedQuestions = await this.getCachedQuestions(safeConfig);
      if (cachedQuestions) {
        Logger.debug("Using cached questions for interview");
        await cachedQuestions.markUsed();
        // Sanitize any legacy '(variant X)' suffixes from cache
        const sanitizedFromCache = [...cachedQuestions.questions].map((q) => ({
          ...q,
          text: this.stripVariantSuffix(q.text),
        }));
        // Ensure padding in case older cache stored fewer than requested
        const padded = await this.ensureQuestionCountAsync(
          sanitizedFromCache,
          questionCount,
          safeConfig
        );
        if (padded.length !== cachedQuestions.questions.length) {
          Logger.warn(
            `Padded cached question set from ${cachedQuestions.questions.length} to ${padded.length}`
          );
        }
        return padded;
      }

      // Generate new hybrid question set
      let questions = await this.generateNewQuestionSet(safeConfig);
      // Defensive sanitize against legacy suffixes
      questions = questions.map((q) => ({
        ...q,
        text: this.stripVariantSuffix(q.text),
      }));
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
      questions = await this.ensureQuestionCountAsync(
        questions,
        questionCount,
        safeConfig
      );

      // Cache the generated questions
      await this.cacheQuestions(safeConfig, questions);

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
      const aiFallback = await aiQuestionService.generateQuestions(safeConfig);
      return await this.ensureQuestionCountAsync(
        aiFallback.map((q) => ({
          ...q,
          text: this.stripVariantSuffix(q.text || q.question),
        })),
        questionCount,
        safeConfig
      );
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
    return this.ensureQuestionCountAsync(sliced, questionCount, config);
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
    // (paraphrase disabled in sync method; async method handles uniqueness)

    if (result.length === 0) {
      // Seed at least one generic question to duplicate from
      result.push({
        text: `Describe a challenge related to ${config.jobRole}.`,
        category: config.jobRole || "general",
        tags: ["General"],
        difficulty: config.difficulty || "intermediate",
        estimatedTime: ESTIMATED_TIME_SEC,
        type:
          config.interviewType === "behavioral"
            ? "behavioral"
            : config.interviewType === "system-design"
            ? "system-design"
            : "technical",
        source: "template", // treat synthetic seed as template for schema compliance
        // eslint-disable-next-line no-magic-numbers
        id: `synthetic_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      });
    }
    // NOTE: legacy variant suffix logic removed. This synchronous method now only returns existing questions or a single seed.
    // Async topping-up with genuine AI/template questions happens in ensureQuestionCountAsync.
    if (result.length < targetCount) {
      Logger.warn(
        `ensureQuestionCount (sync) called with insufficient questions (${result.length}/${targetCount}); async top-up will handle.`
      );
    }
    // If somehow over (shouldn't happen) trim.
    return result.slice(0, targetCount);
  }

  /**
   * Async padding logic: attempts real generation (AI + templates) before falling back to light paraphrasing.
   * Eliminates '(variant X)' duplicates that confused users.
   * @param {Array} questions
   * @param {Number} targetCount
   * @param {Object} config
   * @returns {Promise<Array>} exactly targetCount questions (best-effort unique)
   */
  async ensureQuestionCountAsync(questions, targetCount, config) {
    const out = [...questions];
    const SECONDS_PER_FIVE_MIN = 300; // 5 minutes
    const RADIX_36 = 36;
    const SLICE_START = 2;
    const SLICE_LEN = 9;
    const SAFETY_MULTIPLIER = 3;
    const TEMPLATE_OVERSAMPLE = 2;
    const seen = new Set(out.map((q) => q.text.trim().toLowerCase()));
    let aiAdded = 0;
    let templateAdded = 0;
    let paraphraseAdded = 0;

    // If zero, seed once (same as sync version)
    if (out.length === 0) {
      const seedText = `Describe a challenge related to ${config.jobRole}.`;
      out.push({
        text: seedText,
        category: config.jobRole || "general",
        tags: ["General"],
        difficulty: config.difficulty || "intermediate",
        estimatedTime: SECONDS_PER_FIVE_MIN,
        type:
          config.interviewType === "behavioral"
            ? "behavioral"
            : config.interviewType === "system-design"
            ? "system-design"
            : "technical",
        source: "template",
        id: `seed_${Date.now()}_${Math.random()
          .toString(RADIX_36)
          .slice(SLICE_START, SLICE_LEN)}`,
        generatedAt: new Date(),
      });
      seen.add(seedText.trim().toLowerCase());
    }

    let safety = 0; // guard against infinite loops
    while (
      out.length < targetCount &&
      safety < targetCount * SAFETY_MULTIPLIER
    ) {
      const remaining = targetCount - out.length;
      try {
        // Try AI first for remaining
        const aiBatch = await this.generateAIQuestions(config, remaining);
        for (const q of aiBatch) {
          const normalizedText = this.stripVariantSuffix(q.text);
          const key = normalizedText.trim().toLowerCase();
          if (!seen.has(key) && out.length < targetCount) {
            out.push({ ...q, text: normalizedText });
            seen.add(key);
            aiAdded += 1;
          }
        }
      } catch (e) {
        Logger.error("ensureQuestionCountAsync AI batch error:", e);
      }

      // If still short, pull more templates
      if (out.length < targetCount) {
        try {
          const templateNeeded = targetCount - out.length;
          const templates = await this.getTemplateQuestions(
            config,
            templateNeeded * TEMPLATE_OVERSAMPLE // oversample to find uniques
          );
          for (const t of templates) {
            const normalizedText = this.stripVariantSuffix(t.text);
            const key = normalizedText.trim().toLowerCase();
            if (!seen.has(key) && out.length < targetCount) {
              out.push({ ...t, text: normalizedText });
              seen.add(key);
              templateAdded += 1;
            }
          }
        } catch (e) {
          Logger.error("ensureQuestionCountAsync template top-up error:", e);
        }
      }

      // Final fallback: lightweight paraphrase (without '(variant X)') if still short
      if (out.length < targetCount) {
        const base = out[out.length % out.length];
        const idx = out.length; // variant index proxy
        const core = base.text.replace(/\(variant.*\)$/i, "").trim();
        // Force paraphrase attempt regardless of env flag by temporarily setting VARIANT_PARAPHRASE_ENABLED
        const prevFlag = process.env.VARIANT_PARAPHRASE_ENABLED;
        process.env.VARIANT_PARAPHRASE_ENABLED = "true";
        const paraphrased = (() => {
          try {
            // reuse sync paraphrase logic via internal function style duplication
            const SYNONYMS = {
              describe: ["Explain", "Walk me through", "Outline", "Detail"],
              challenge: ["problem", "issue", "obstacle", "difficulty"],
              approach: ["method", "strategy", "solution path", "tactic"],
              improve: ["optimize", "enhance", "refine", "strengthen"],
              experience: ["background", "exposure", "history", "track record"],
            };
            let text = core;
            Object.keys(SYNONYMS).forEach((k) => {
              if (text.toLowerCase().includes(k)) {
                const pool = SYNONYMS[k];
                const hash = [...k].reduce((a, c) => a + c.charCodeAt(0), 0);
                const pick = pool[(hash + idx) % pool.length];
                const regex = new RegExp(k, "ig");
                text = text.replace(regex, (m) => {
                  const cap = m[0] === m[0].toUpperCase();
                  return cap
                    ? pick.charAt(0).toUpperCase() + pick.slice(1)
                    : pick.toLowerCase();
                });
              }
            });
            return text;
          } catch (e) {
            return core;
          } finally {
            process.env.VARIANT_PARAPHRASE_ENABLED = prevFlag;
          }
        })();
        const key = paraphrased.trim().toLowerCase();
        if (!seen.has(key)) {
          out.push({
            ...base,
            text: paraphrased,
            source: "ai_paraphrased",
            id: `paraphrase_${Date.now()}_${Math.random()
              .toString(RADIX_36)
              .slice(SLICE_START, SLICE_LEN)}`,
            generatedAt: new Date(),
          });
          seen.add(key);
          paraphraseAdded += 1;
        } else {
          // break to avoid infinite loop of identical paraphrases
          break;
        }
      }
      safety += 1;
    }

    if (out.length < targetCount) {
      Logger.warn(
        `ensureQuestionCountAsync could not reach target (${out.length}/${targetCount}); returning best-effort set.`
      );
    }
    const final = out.slice(0, targetCount);
    Logger.info(
      `[ensureQuestionCountAsync] Completed padding: start=${questions.length}, final=${final.length}, aiAdded=${aiAdded}, templateAdded=${templateAdded}, paraphraseAdded=${paraphraseAdded}`
    );
    return final;
  }

  /**
   * Strip legacy '(variant N)' suffixes and trailing guidance qualifiers.
   * @param {string} text
   * @returns {string}
   */
  stripVariantSuffix(text) {
    if (!text || typeof text !== "string") return text;
    return text
      .replace(/\(variant\s*\d+\)\s*$/i, "")
      .replace(
        /\s+(Give specifics\.|Focus on trade-offs\.|Highlight key decisions\.|Include metrics if possible\.)$/,
        ""
      )
      .trim();
  }

  /**
   * Get template-based questions
   * @param {Object} config
   * @param {Number} count
   * @returns {Promise<Array>}
   */
  async getTemplateQuestions(config, count) {
    await this.loadTemplates();
    const { jobRole, interviewType, difficulty } = config;
    const requestedRole = (jobRole || "software-engineer").toLowerCase();
    const normalized = this.normalizeRole(requestedRole);
    const roleKey = this.templates?.[normalized]
      ? normalized
      : this.classifyUnknownRole(normalized);
    const roleTemplates = this.templates?.[roleKey] || {};
    const levelTemplates =
      roleTemplates?.[mapDifficulty(difficulty)] ||
      roleTemplates?.["intermediate"] ||
      {};

    let templateQuestions = [];
    const safeCount = Math.max(0, count || 0);
    if (safeCount === 0) return [];

    if (interviewType === "mixed") {
      // 70% technical (or system-design counted as technical), 30% behavioral
      const TECH_RATIO = 0.7;
      const techBucket = [].concat(
        levelTemplates.technical || [],
        levelTemplates["system-design"] || []
      );
      const behavioralBucket = levelTemplates.behavioral || [];
      const techCount = Math.min(
        techBucket.length,
        Math.ceil(safeCount * TECH_RATIO)
      );
      const behavioralCount = Math.max(0, safeCount - techCount);
      templateQuestions = templateQuestions.concat(
        this.selectRandomQuestions(techBucket, techCount),
        this.selectRandomQuestions(behavioralBucket, behavioralCount)
      );
    } else {
      const typeKey =
        interviewType === "system-design" ? "system-design" : interviewType;
      const bucket = levelTemplates[typeKey] || [];
      templateQuestions = this.selectRandomQuestions(bucket, safeCount);
    }

    const RADIX = 36; // eslint-disable-line no-magic-numbers
    const START = 2; // eslint-disable-line no-magic-numbers
    const LEN = 9; // eslint-disable-line no-magic-numbers
    return templateQuestions.map((q) => ({
      ...q,
      difficulty: mapDifficulty(q.difficulty || difficulty),
      source: "template",
      id: `template_${Date.now()}_${Math.random()
        .toString(RADIX)
        .substr(START, LEN)}`,
      generatedAt: new Date(),
    }));
  }

  /**
   * Normalize role names to known keys; handle common synonyms.
   */
  normalizeRole(roleKey) {
    const aliases = {
      "software tester": "software-tester",
      tester: "software-tester",
      qa: "qa-engineer",
      "qa tester": "software-tester",
      "quality assurance": "qa-engineer",
      // SRE specific aliases now map to dedicated site-reliability-engineer role
      sre: "site-reliability-engineer",
      "site reliability": "site-reliability-engineer",
      "site reliability engineer": "site-reliability-engineer",
      "full stack": "full-stack-developer",
      fullstack: "full-stack-developer",
      mobile: "mobile-developer",
      ios: "mobile-developer",
      android: "mobile-developer",
      cloud: "cloud-architect",
      "cloud engineer": "cloud-architect",
      "data scientist": "data-analyst",
      "data analysis": "data-analyst",
      "data engineering": "data-engineer",
      "system admin": "system-administrator",
      sysadmin: "system-administrator",
      "it support": "it-support-specialist",
      helpdesk: "it-support-specialist",
      "cyber security": "cybersecurity-analyst",
      "security analyst": "cybersecurity-analyst",
      "security engineer": "cybersecurity-analyst",
      // Product / Agile / Design / ML / Network aliases
      "product manager": "product-manager",
      "product owner": "product-manager",
      "scrum master": "scrum-master",
      "agile coach": "scrum-master",
      "ui designer": "ui-ux-designer",
      "ux designer": "ui-ux-designer",
      "ui ux designer": "ui-ux-designer",
      "machine learning engineer": "machine-learning-engineer",
      "ml engineer": "machine-learning-engineer",
      "network engineer": "network-engineer",
      networking: "network-engineer",
    };
    return aliases[roleKey] || roleKey;
  }

  /**
   * Classify an unknown role into a closest existing template cluster using keyword heuristics.
   * Prevents everything defaulting to software-engineer which reduces variety.
   * @param {string} roleKey lower-cased incoming role key
   * @returns {string} canonical template key fallback
   */
  classifyUnknownRole(roleKey) {
    if (!this.templates) return "software-engineer";
    if (this.templates[roleKey]) return roleKey; // already known
    const keywordMap = [
      {
        keywords: ["devops", "reliab", "sre", "ops"],
        target: "site-reliability-engineer",
      },
      { keywords: ["cloud", "aws", "azure", "gcp"], target: "cloud-architect" },
      {
        keywords: ["frontend", "ui", "react", "css"],
        target: "frontend-developer",
      },
      {
        keywords: ["backend", "api", "server", "microservice"],
        target: "backend-developer",
      },
      { keywords: ["data", "etl", "pipeline"], target: "data-engineer" },
      {
        keywords: ["analysis", "analytics", "insight"],
        target: "data-analyst",
      },
      {
        keywords: ["security", "cyber", "threat"],
        target: "cybersecurity-analyst",
      },
      {
        keywords: ["support", "helpdesk", "ticket"],
        target: "it-support-specialist",
      },
      {
        keywords: ["system admin", "sysadmin"],
        target: "system-administrator",
      },
      { keywords: ["mobile", "android", "ios"], target: "mobile-developer" },
      {
        keywords: ["product", "roadmap", "stakeholder"],
        target: "product-manager",
      },
      { keywords: ["scrum", "agile", "ceremony"], target: "scrum-master" },
      {
        keywords: ["design", "ux", "ui", "wireframe"],
        target: "ui-ux-designer",
      },
      {
        keywords: ["machine learning", "ml", "model", "training"],
        target: "machine-learning-engineer",
      },
      {
        keywords: ["network", "routing", "switch"],
        target: "network-engineer",
      },
    ];
    for (const { keywords, target } of keywordMap) {
      if (keywords.some((k) => roleKey.includes(k))) {
        return target in this.templates ? target : "software-engineer";
      }
    }
    return "software-engineer"; // final fallback
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
   * Public API: Generate questions for interview
   * @param {Object} config - Interview configuration
   * @returns {Promise<Object>} { success: boolean, questions: Array }
   */
  async generateQuestions(config) {
    try {
      const questions = await this.generateHybridQuestions(config);
      return {
        success: true,
        questions: questions || [],
      };
    } catch (error) {
      Logger.error("[HybridQuestionService] generateQuestions error:", error);
      return {
        success: false,
        questions: [],
        error: error.message,
      };
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
