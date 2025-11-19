const aiProviderManager = require("./aiProviders");

class AdvancedFeedbackService {
  constructor() {
    this.isConfigured = true;
  }

  /**
   * Generate rich, multi-dimensional feedback for an interview using AI providers.
   * Falls back to a simple summary if providers are unavailable.
   */
  async generateAdvancedFeedback(interview) {
    try {
      const questions = interview.questions || [];
      const answered = questions
        .filter((q) => q.response && q.response.text)
        .map((q) => ({ question: q.questionText, answer: q.response.text }));

      // If AI provider manager available, use soft skills analysis + coaching tip
      if (aiProviderManager) {
        try {
          const softSkills = await aiProviderManager.analyzeSoftSkills(
            answered
          );

          const coaching = await aiProviderManager.generateCoachingTip({
            interviewId: interview._id,
            overallScore: interview.results?.overallScore || 0,
            strengths: (interview.questions || [])
              .flatMap((q) => q.feedback?.strengths || [])
              .slice(0, 5),
          });

          const feedback = {
            overallScore: interview.results?.overallScore || 0,
            dimensionalScores: {
              technical:
                interview.results?.breakdown?.technical ||
                Math.round((softSkills?.problemSolving?.score || 7) * 10),
              communication:
                interview.results?.breakdown?.communication ||
                Math.round((softSkills?.communication?.score || 7) * 10),
              problemSolving:
                interview.results?.breakdown?.problemSolving ||
                Math.round((softSkills?.problemSolving?.score || 7) * 10),
              behavioral:
                interview.results?.breakdown?.behavioral ||
                Math.round((softSkills?.leadership?.score || 7) * 10),
            },
            strengths:
              softSkills?.topStrengths ||
              (interview.questions || [])
                .flatMap((q) => q.feedback?.strengths || [])
                .slice(0, 5),
            areasForImprovement:
              softSkills?.areasToImprove ||
              (interview.questions || [])
                .flatMap((q) => q.feedback?.improvements || [])
                .slice(0, 5),
            recommendations:
              (coaching && coaching.recommendations) ||
              (softSkills && softSkills.recommendation)
                ? Array.isArray(coaching.recommendations)
                  ? coaching.recommendations
                  : [coaching.recommendation || softSkills.recommendation]
                : ["Practice targeted questions and review feedback"],
            detailedAnalysis: softSkills || {},
            coachingTip: coaching || {},
            generatedAt: new Date().toISOString(),
            provider: "ai",
          };

          return feedback;
        } catch (error) {
          console.warn(
            "AI advanced feedback failed, falling back:",
            error.message
          );
          return this.generateFallbackFeedback(interview);
        }
      }

      return this.generateFallbackFeedback(interview);
    } catch (error) {
      console.error("Error generating advanced feedback:", error);
      return this.generateFallbackFeedback(interview);
    }
  }

  generateFallbackFeedback(interview) {
    const questions = interview.questions || [];
    const answeredQuestions = questions.filter(
      (q) => q.response && q.response.text
    );
    const avgScore = interview.results?.overallScore || 70;
    return {
      overallScore: avgScore,
      dimensionalScores: {
        technical: 70,
        communication: 70,
        problemSolving: 70,
        behavioral: 70,
      },
      strengths: ["Shows potential for growth"],
      areasForImprovement: ["Continue building on existing strengths"],
      recommendations: ["Practice more interview questions"],
      detailedAnalysis: "Interview performance analyzed.",
      generatedAt: new Date().toISOString(),
      provider: "fallback",
    };
  }
}

module.exports = new AdvancedFeedbackService();
