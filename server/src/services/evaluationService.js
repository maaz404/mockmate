/* eslint-disable no-magic-numbers */
const FEATURES = require("../config/features");
const Logger = require("../utils/logger");
const aiProviderManager = require("./aiProviders");

class EvaluationService {
  async evaluateAnswer(question, answer) {
    // Backwards compatible basic evaluation
    return this.basicEvaluation(question, answer);
  }

  /**
   * Try to evaluate answer using configured AI providers. Falls back
   * to the basic keyword evaluator if providers are unavailable or fail.
   */
  async evaluateAnswerWithAI(question, answer, config = {}) {
    try {
      if (!FEATURES.AI_QUESTIONS && !FEATURES.ADVANCED_ANALYTICS) {
        Logger.info(
          "AI evaluation disabled via feature flags, using basic evaluator"
        );
        return this.basicEvaluation(question, answer);
      }

      // If AI providers are configured, use the manager to evaluate
      if (aiProviderManager) {
        Logger.info("Calling AI provider manager for evaluation");
        const aiResponse = await aiProviderManager.evaluateAnswer(
          question,
          answer,
          config
        );

        // aiResponse may already be structured or be the provider's parsed JSON
        // Normalize to our internal shape
        const normalized = {
          score: Number(aiResponse.score) || 0,
          rubricScores: aiResponse.rubricScores || {
            relevance: Math.min(
              5,
              Math.max(1, Math.round((aiResponse.score || 0) / 20))
            ),
            clarity: Math.min(
              5,
              Math.max(1, Math.round((aiResponse.score || 0) / 20))
            ),
            depth: Math.min(
              5,
              Math.max(1, Math.round((aiResponse.score || 0) / 20))
            ),
            structure: Math.min(
              5,
              Math.max(1, Math.round((aiResponse.score || 0) / 20))
            ),
          },
          strengths: aiResponse.strengths || [],
          improvements: aiResponse.improvements || [],
          feedback:
            aiResponse.feedback ||
            aiResponse.detailedFeedback ||
            aiResponse.overall ||
            "",
          modelAnswer:
            aiResponse.modelAnswer || aiResponse.suggestedAnswer || "",
          raw: aiResponse,
          evaluation_method: aiResponse.evaluation_method || "ai-provider",
        };

        return normalized;
      }

      // If manager not available, fallback
      Logger.warn(
        "AI provider manager unavailable, falling back to basic evaluation"
      );
      return this.basicEvaluation(question, answer);
    } catch (error) {
      Logger.error(
        "AI evaluation failed, falling back to basic evaluator:",
        error
      );
      try {
        return this.basicEvaluation(question, answer);
      } catch (e) {
        // As a last resort
        return {
          score: 0,
          feedback: { overall: "Evaluation unavailable" },
          strengths: [],
          improvements: [],
          evaluation_method: "none",
        };
      }
    }
  }

  basicEvaluation(question, answer) {
    const answerText = (answer.text || answer.answerText || "")
      .toLowerCase()
      .trim();
    const keywords = question.tags || question.keywords || [];

    const matchedCount = keywords.filter((k) =>
      answerText.includes(k.toLowerCase())
    ).length;

    const keywordScore =
      keywords.length > 0 ? (matchedCount / keywords.length) * 70 : 50;
    const wordCount = answerText.split(/\s+/).filter(Boolean).length;
    const lengthScore =
      wordCount < 10 ? 0 : wordCount < 20 ? 5 : wordCount < 50 ? 10 : 15;
    const totalScore = Math.max(
      0,
      Math.min(100, Math.round(keywordScore + lengthScore + 15))
    );

    return {
      score: totalScore,
      feedback: {
        overall:
          totalScore >= 80
            ? "Excellent!"
            : totalScore >= 60
            ? "Good!"
            : "Needs improvement",
        strengths:
          matchedCount > 0
            ? [`Covered ${matchedCount} key concepts`]
            : ["Attempted"],
        improvements:
          keywords.length - matchedCount > 0
            ? [`Try mentioning: ${keywords.slice(0, 3).join(", ")}`]
            : [],
      },
      evaluation_method: "keyword-based",
    };
  }
}

module.exports = new EvaluationService();
