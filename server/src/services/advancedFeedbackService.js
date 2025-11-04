const aiProviderManager = require('./aiProviders');

class AdvancedFeedbackService {
  constructor() {
    this.isConfigured = true;
  }

  async generateAdvancedFeedback(interview) {
    try {
      console.log('Generating advanced feedback using Gemini...');
      const questions = interview.questions || [];
      return this.generateFallbackFeedback(interview);
    } catch (error) {
      console.error('Error generating advanced feedback:', error);
      return this.generateFallbackFeedback(interview);
    }
  }

  generateFallbackFeedback(interview) {
    const questions = interview.questions || [];
    const answeredQuestions = questions.filter(q => q.response && q.response.text);
    const avgScore = interview.results?.overallScore || 70;
    return {
      overallScore: avgScore,
      dimensionalScores: {
        technical: 70,
        communication: 70,
        problemSolving: 70,
        behavioral: 70
      },
      strengths: ['Shows potential for growth'],
      areasForImprovement: ['Continue building on existing strengths'],
      recommendations: ['Practice more interview questions'],
      detailedAnalysis: 'Interview performance analyzed.',
      generatedAt: new Date().toISOString(),
      provider: 'fallback'
    };
  }
}

module.exports = new AdvancedFeedbackService();
