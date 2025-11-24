const geminiService = require("./aiProviders/geminiService");
const Logger = require("../utils/logger");
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require("../config/language");

class TranslationService {
  constructor() {
    this.cache = new Map();
  }

  _normalizeLanguage(lang) {
    const code = (lang || DEFAULT_LANGUAGE).toLowerCase();
    return SUPPORTED_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE;
  }

  _languageName(code) {
    const map = {
      en: "English",
      fr: "French",
      es: "Spanish",
      de: "German",
      ur: "Urdu",
    };
    return map[code] || code;
  }

  async translateText(text, targetLanguage) {
    const lang = this._normalizeLanguage(targetLanguage);
    if (lang === "en" || !text || !text.trim()) return text;

    Logger.info(
      `[TranslationService] Translating text to ${lang}: "${text.substring(
        0,
        50
      )}..."`
    );

    const key = `${lang}::${text}`;
    if (this.cache.has(key)) {
      Logger.debug(
        `[TranslationService] Cache hit for: "${text.substring(0, 30)}..."`
      );
      return this.cache.get(key);
    }

    const prompt = `Translate the following text from English to ${this._languageName(
      lang
    )}. Preserve code blocks, JSON, and placeholders in {braces}. Return ONLY the translated text.\n\nTEXT:\n"""\n${text}\n"""`;
    try {
      const translated = await geminiService.generateCompletion(prompt);
      const cleaned = translated.trim();

      if (!cleaned) {
        Logger.warn(
          `[TranslationService] Empty translation result for: "${text.substring(
            0,
            50
          )}". Using fallback.`
        );
        return this._fallbackTranslate(text, lang);
      }

      this.cache.set(key, cleaned);
      Logger.info(
        `[TranslationService] ✅ Translation success (${lang}): "${cleaned.substring(
          0,
          50
        )}..."`
      );
      return cleaned;
    } catch (err) {
      Logger.error(
        `[TranslationService] ❌ translateText FAILED (${lang}):`,
        err.message,
        err.stack,
        `Original text: "${text.substring(0, 100)}"`
      );
      const fallback = this._fallbackTranslate(text, lang);
      Logger.warn(
        `[TranslationService] Using fallback translation: "${fallback.substring(
          0,
          50
        )}..."`
      );
      return fallback;
    }
  }

  async translateArray(texts, targetLanguage) {
    const lang = this._normalizeLanguage(targetLanguage);
    if (lang === "en") return texts;
    const arr = Array.isArray(texts) ? texts : [];
    if (!arr.length) return arr;

    Logger.debug(
      `[TranslationService] Translating array of ${arr.length} items to ${lang}`
    );

    const joined = arr.join("\n---LINE_BREAK---\n");
    const prompt = `Translate each segment from English to ${this._languageName(
      lang
    )}. Preserve code and placeholders. Return translations separated by ---LINE_BREAK--- in the SAME ORDER.\n\nSEGMENTS:\n"""\n${joined}\n"""`;
    try {
      const response = await geminiService.generateCompletion(prompt);

      if (!response || !response.trim()) {
        Logger.warn(
          `[TranslationService] Empty response for array translation`
        );
        return arr.map((t) => this._fallbackTranslate(t, lang));
      }

      const parts = response
        .trim()
        .split(/---LINE_BREAK---/)
        .map((p) => p.trim());

      if (parts.length === arr.length) {
        parts.forEach((t, i) => {
          const key = `${lang}::${arr[i]}`;
          if (!this.cache.has(key)) this.cache.set(key, t);
        });
        Logger.debug(
          `[TranslationService] Array translation success: ${parts.length} items`
        );
        return parts;
      }

      Logger.warn(
        `[TranslationService] Translation mismatch: expected ${arr.length} parts, got ${parts.length}. Returning original.`
      );
      return arr.map((t) => this._fallbackTranslate(t, lang));
    } catch (err) {
      Logger.error(
        `[TranslationService] translateArray failed (${lang}):`,
        err.message,
        `Items: ${arr.length}`
      );
      return arr.map((t) => this._fallbackTranslate(t, lang));
    }
  }

  async translateQuestions(questions, targetLanguage) {
    const lang = this._normalizeLanguage(targetLanguage);
    if (lang === "en" || !Array.isArray(questions)) return questions;

    Logger.info(
      `[TranslationService] 🌐 Starting translation of ${questions.length} questions to ${lang}`
    );

    // Log first question before translation for debugging
    const sampleBefore = questions[0]?.questionText || questions[0]?.text || "";
    Logger.info(
      `[TranslationService] Sample BEFORE: "${sampleBefore.substring(
        0,
        100
      )}..."`
    );

    const qTexts = questions.map((q) => q.questionText || q.text || "");
    const evalCriteria = questions.map((q) => q.evaluationCriteria || "");
    const hintsGrouped = questions.map((q) =>
      Array.isArray(q.hints) ? q.hints : []
    );
    const allHints = hintsGrouped.flat();

    Logger.info(
      `[TranslationService] Translating ${qTexts.length} questions, ${evalCriteria.length} criteria, ${allHints.length} hints`
    );

    const [tQ, tCrit, tHints] = await Promise.all([
      this.translateArray(qTexts, lang),
      this.translateArray(evalCriteria, lang),
      this.translateArray(allHints, lang),
    ]);

    Logger.info(
      `[TranslationService] ✅ Translation complete for ${questions.length} questions`
    );

    let hintCursor = 0;
    const translatedQuestions = questions.map((q, i) => {
      const originalHints = hintsGrouped[i];
      const slice = tHints.slice(hintCursor, hintCursor + originalHints.length);
      hintCursor += originalHints.length;
      return {
        ...q,
        text: tQ[i] || q.text || q.questionText,
        questionText: tQ[i] || q.questionText || q.text,
        evaluationCriteria: tCrit[i] || q.evaluationCriteria,
        hints: slice.length ? slice : q.hints,
        language: lang,
      };
    });

    // Log first question after translation for debugging
    const sampleAfter = translatedQuestions[0]?.questionText || "";
    Logger.info(
      `[TranslationService] Sample AFTER: "${sampleAfter.substring(0, 100)}..."`
    );

    return translatedQuestions;
  }

  async translateEvaluation(evaluation, targetLanguage) {
    const lang = this._normalizeLanguage(targetLanguage);
    if (lang === "en" || !evaluation) return evaluation;
    const [strengths, improvements, feedback] = await Promise.all([
      this.translateArray(evaluation.strengths || [], lang),
      this.translateArray(evaluation.improvements || [], lang),
      this.translateText(evaluation.feedback || "", lang),
    ]);
    return { ...evaluation, strengths, improvements, feedback, language: lang };
  }

  /**
   * Very naive fallback translator (word/phrase replacements) for Urdu when API unavailable.
   * This is NOT a full translation engine; it gives user visible change instead of total failure.
   */
  _fallbackTranslate(text, lang) {
    if (!text || lang !== "ur") return text; // Only implement for Urdu fallback
    const map = [
      [/\bDescribe\b/gi, "بیان کریں"],
      [/\bExplain\b/gi, "وضاحت کریں"],
      [/\bthe concept of\b/gi, "کا تصور"],
      [/\bProvide\b/gi, "پیش کریں"],
      [/\bexample\b/gi, "مثال"],
      [/\btime\b/gi, "وقت"],
      [/\bchallenge\b/gi, "چیلنج"],
      [/\bdecision\b/gi, "فیصلہ"],
      [/\bproblem\b/gi, "مسئلہ"],
      [/\bsolution\b/gi, "حل"],
      [/\bteam\b/gi, "ٹیم"],
      [/\bmember\b/gi, "رکن"],
      [/\bhow did you\b/gi, "آپ نے کیسے"],
      [/\bhandle\b/gi, "نمٹا"],
      [/\bProvide a practical example\b/gi, "عملی مثال دیں"],
      [/\bExplain the concept\b/gi, "تصور کی وضاحت کریں"],
    ];
    let out = text;
    map.forEach(([pat, rep]) => {
      out = out.replace(pat, rep);
    });
    return out;
  }
}

module.exports = new TranslationService();
