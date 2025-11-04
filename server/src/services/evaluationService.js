/* eslint-disable no-magic-numbers */
const FEATURES = require("../config/features");
const Logger = require("../utils/logger");

class EvaluationService {
  async evaluateAnswer(question, answer) {
    return this.basicEvaluation(question, answer);
  }

  async evaluateAnswerWithAI(question, answer) {
    if (FEATURES.USE_PYTHON_SERVICE) {
      Logger.warn("Python service disabled");
    }
    return this.basicEvaluation(question, answer);
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
