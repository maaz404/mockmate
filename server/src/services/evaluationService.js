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
          "[EvaluationService] AI evaluation disabled via feature flags, using basic evaluator"
        );
        return this.basicEvaluation(question, answer);
      }

      // If AI providers are configured, use the manager to evaluate
      if (aiProviderManager) {
        Logger.info(
          "[EvaluationService] Calling AI provider manager for evaluation",
          {
            hasQuestion: !!question,
            hasAnswer: !!answer,
            configKeys: Object.keys(config),
          }
        );
        const aiResponse = await aiProviderManager.evaluateAnswer(
          question,
          answer,
          config
        );

        Logger.info("AI Evaluation Response Structure:", {
          hasScore: !!aiResponse.score,
          hasFeedback: !!aiResponse.feedback,
          hasStrengths: !!aiResponse.strengths,
          hasImprovements: !!aiResponse.improvements,
          feedbackLength: aiResponse.feedback?.length || 0,
          strengthsCount: aiResponse.strengths?.length || 0,
          improvementsCount: aiResponse.improvements?.length || 0,
        });

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
          strengths: Array.isArray(aiResponse.strengths)
            ? aiResponse.strengths
            : [],
          improvements: Array.isArray(aiResponse.improvements)
            ? aiResponse.improvements
            : [],
          feedback:
            aiResponse.feedback ||
            aiResponse.detailedFeedback ||
            aiResponse.overall ||
            "Evaluation completed. Please check strengths and improvements for detailed feedback.",
          modelAnswer:
            aiResponse.modelAnswer || aiResponse.suggestedAnswer || "",
          raw: aiResponse,
          evaluation_method: aiResponse.evaluation_method || "ai-provider",
        };

        Logger.info("Normalized Evaluation:", {
          score: normalized.score,
          feedbackLength: normalized.feedback.length,
          strengthsCount: normalized.strengths.length,
          improvementsCount: normalized.improvements.length,
          method: normalized.evaluation_method,
        });

        return normalized;
      }

      // If manager not available, fallback
      Logger.warn(
        "[EvaluationService] AI provider manager unavailable, falling back to basic evaluation"
      );
      return this.basicEvaluation(question, answer);
    } catch (error) {
      Logger.error("[EvaluationService] AI evaluation failed completely:", {
        error: error.message,
        stack: error.stack,
      });

      // Try basic evaluation as fallback
      try {
        Logger.info("[EvaluationService] Attempting basic evaluation fallback");
        return this.basicEvaluation(question, answer);
      } catch (basicError) {
        // Last resort - return minimal valid evaluation
        Logger.error("[EvaluationService] Basic evaluation also failed:", {
          error: basicError.message,
        });

        return {
          score: 50,
          rubricScores: {
            relevance: 3,
            clarity: 3,
            depth: 2,
            structure: 3,
          },
          feedback:
            "Your answer has been recorded. Due to a technical issue, detailed evaluation is temporarily unavailable. The response demonstrates an attempt to address the question. Consider reviewing key concepts and providing more detailed examples in future responses.",
          strengths: [
            "Provided a response to the question",
            "Attempted to address the topic",
          ],
          improvements: [
            "Add more technical depth and specific examples",
            "Structure the answer with clear explanations",
          ],
          evaluation_method: "emergency-fallback",
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

    const feedbackText =
      totalScore >= 80
        ? `Excellent work! Your answer demonstrates strong understanding. You covered ${matchedCount} key concepts effectively. The length and detail of your response (${wordCount} words) shows good comprehension.`
        : totalScore >= 60
        ? `Good attempt! Your answer shows decent understanding. You mentioned ${matchedCount} relevant concepts. To improve further, consider adding more depth and examples to strengthen your response.`
        : `Your answer needs improvement. While you attempted to respond, the answer lacks depth and misses several key concepts. Try to be more comprehensive and include specific examples.`;

    return {
      score: totalScore,
      feedback: feedbackText,
      strengths:
        matchedCount > 0
          ? [
              `Covered ${matchedCount} key concepts`,
              `Answer length appropriate (${wordCount} words)`,
            ]
          : ["Made an attempt to answer the question"],
      improvements:
        keywords.length - matchedCount > 0
          ? [
              `Consider mentioning these concepts: ${keywords
                .slice(0, 3)
                .join(", ")}`,
              "Add more technical depth and specific examples",
              "Structure your answer with clear explanations",
            ]
          : [
              "Provide more detailed technical explanation",
              "Use industry-standard terminology",
            ],
      evaluation_method: "keyword-based",
    };
  }
}

module.exports = new EvaluationService();
