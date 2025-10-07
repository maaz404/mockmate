const Interview = require("../models/Interview");
const UserProfile = require("../models/UserProfile");

class SessionSummaryService {
  /**
   * Generate comprehensive session summary for an interview
   */
  async generateSessionSummary(interviewId, userId) {
    try {
      const interview = await Interview.findOne({
        _id: interviewId,
        userId,
      }).populate("userProfile");

      if (!interview) {
        throw new Error("Interview not found");
      }

      if (interview.status !== "completed") {
        throw new Error("Interview must be completed to generate summary");
      }

      const summary = {
        sessionId: interviewId,
        generatedAt: new Date(),
        
        // Basic session info
        sessionInfo: {
          jobRole: interview.config.jobRole,
          experienceLevel: interview.config.experienceLevel,
          interviewType: interview.config.interviewType,
          completedAt: interview.completedAt,
          totalDuration: interview.timing.totalDuration,
        },

        // Aggregate scores and metrics
        aggregateMetrics: this.calculateAggregateMetrics(interview),
        
        // Per-tag/category scores
        categoryScores: this.calculateCategoryScores(interview),
        
        // Time analysis
        timeAnalysis: this.analyzeTimeMetrics(interview),
        
        // Best and worst answers
        performanceHighlights: this.identifyPerformanceHighlights(interview),
        
        // Overall assessment
        overallAssessment: this.generateOverallAssessment(interview),
      };

      return {
        success: true,
        summary,
      };
    } catch (error) {
      console.error("Session summary generation failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate aggregate metrics for the session
   */
  calculateAggregateMetrics(interview) {
  const questions = interview.questions || [];
  const skippedQuestions = questions.filter(q => q.skipped).length;
  const answeredQuestions = questions.filter(q => q.response && q.response.text && !q.skipped);
    
    // Calculate average score
    const scores = answeredQuestions.map(q => q.score?.overall || 0);
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    // Calculate completion rate
    // Completion rate considers only answered vs total (skips still count as not answered)
    const completionRate = questions.length > 0
      ? Math.round((answeredQuestions.length / questions.length) * 100)
      : 0;

    // Calculate total response time
    const totalResponseTime = answeredQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
    const averageResponseTime = answeredQuestions.length > 0
      ? Math.round(totalResponseTime / answeredQuestions.length)
      : 0;

    return {
      totalQuestions: questions.length,
  answeredQuestions: answeredQuestions.length,
  skippedQuestions,
      averageScore,
      completionRate,
      totalResponseTime,
      averageResponseTime,
      scoreDistribution: this.calculateScoreDistribution(scores),
    };
  }

  /**
   * Calculate scores per category/tag
   */
  calculateCategoryScores(interview) {
    const questions = interview.questions || [];
    const categoryMap = new Map();

    questions.forEach(question => {
      if (question.response && question.score) {
        const categories = question.categories || question.tags || ['general'];
        const score = question.score.overall || 0;

        categories.forEach(category => {
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { scores: [], count: 0 });
          }
          categoryMap.get(category).scores.push(score);
          categoryMap.get(category).count++;
        });
      }
    });

    const categoryScores = [];
    categoryMap.forEach((data, category) => {
      const averageScore = data.scores.length > 0
        ? Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length)
        : 0;

      categoryScores.push({
        category,
        averageScore,
        questionsCount: data.count,
        performance: this.getPerformanceLevel(averageScore),
      });
    });

    return categoryScores.sort((a, b) => b.averageScore - a.averageScore);
  }

  /**
   * Analyze time-related metrics
   */
  analyzeTimeMetrics(interview) {
    const questions = interview.questions || [];
    const answeredQuestions = questions.filter(q => q.response && q.timeSpent);

    if (answeredQuestions.length === 0) {
      return {
        totalTime: interview.timing.totalDuration || 0,
        averageTime: 0,
        fastestAnswer: null,
        slowestAnswer: null,
        timeEfficiency: 'unknown',
      };
    }

    const times = answeredQuestions.map(q => q.timeSpent);
    const fastestTime = Math.min(...times);
    const slowestTime = Math.max(...times);

    const fastestAnswer = answeredQuestions.find(q => q.timeSpent === fastestTime);
    const slowestAnswer = answeredQuestions.find(q => q.timeSpent === slowestTime);

    return {
      totalTime: interview.timing.totalDuration || 0,
      averageTime: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
      fastestAnswer: {
        time: fastestTime,
        question: fastestAnswer.questionText.substring(0, 100) + '...',
        score: fastestAnswer.score?.overall || 0,
      },
      slowestAnswer: {
        time: slowestTime,
        question: slowestAnswer.questionText.substring(0, 100) + '...',
        score: slowestAnswer.score?.overall || 0,
      },
      timeEfficiency: this.calculateTimeEfficiency(interview),
    };
  }

  /**
   * Identify best and worst performing answers
   */
  identifyPerformanceHighlights(interview) {
    const questions = interview.questions || [];
    const scoredQuestions = questions.filter(q => q.response && q.score?.overall !== undefined);

    if (scoredQuestions.length === 0) {
      return {
        bestAnswers: [],
        worstAnswers: [],
        improvementOpportunities: [],
      };
    }

    // Sort by score
    const sortedQuestions = [...scoredQuestions].sort((a, b) => b.score.overall - a.score.overall);
    
    // Get top 3 best and worst
    const bestAnswers = sortedQuestions.slice(0, 3).map(q => ({
      question: q.questionText.substring(0, 100) + '...',
      score: q.score.overall,
      timeSpent: q.timeSpent || 0,
      strengths: q.feedback?.strengths || [],
      category: q.categories?.[0] || q.tags?.[0] || 'general',
    }));

    const worstAnswers = sortedQuestions.slice(-3).reverse().map(q => ({
      question: q.questionText.substring(0, 100) + '...',
      score: q.score.overall,
      timeSpent: q.timeSpent || 0,
      improvements: q.feedback?.improvements || [],
      category: q.categories?.[0] || q.tags?.[0] || 'general',
    }));

    return {
      bestAnswers,
      worstAnswers,
      improvementOpportunities: this.generateImprovementOpportunities(worstAnswers),
    };
  }

  /**
   * Generate overall assessment
   */
  generateOverallAssessment(interview) {
    const averageScore = interview.results?.overallScore || 0;
    const questions = interview.questions || [];
    const answeredQuestions = questions.filter(q => q.response && q.response.text);
    
    let readinessLevel = 'needs-improvement';
    let recommendation = 'Continue practicing to improve your interview skills.';

    if (averageScore >= 85) {
      readinessLevel = 'excellent';
      recommendation = 'You\'re well-prepared for interviews in this role!';
    } else if (averageScore >= 75) {
      readinessLevel = 'good';
      recommendation = 'Good performance! Focus on weak areas for improvement.';
    } else if (averageScore >= 65) {
      readinessLevel = 'average';
      recommendation = 'Decent foundation. Practice more to boost confidence.';
    }

    return {
      overallScore: averageScore,
      readinessLevel,
      recommendation,
      completionRate: questions.length > 0 ? Math.round((answeredQuestions.length / questions.length) * 100) : 0,
      sessionRating: this.calculateSessionRating(interview),
    };
  }

  // Helper methods
  calculateScoreDistribution(scores) {
    if (scores.length === 0) return { excellent: 0, good: 0, average: 0, poor: 0 };

    const distribution = { excellent: 0, good: 0, average: 0, poor: 0 };
    
    scores.forEach(score => {
      if (score >= 85) distribution.excellent++;
      else if (score >= 75) distribution.good++;
      else if (score >= 60) distribution.average++;
      else distribution.poor++;
    });

    return distribution;
  }

  getPerformanceLevel(score) {
    if (score >= 85) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'needs-improvement';
  }

  calculateTimeEfficiency(interview) {
    const totalTime = interview.timing?.totalDuration || 0;
    const questions = interview.questions || [];
    const expectedTime = questions.length * 3; // Assuming 3 minutes per question average

    if (totalTime <= expectedTime * 0.8) return 'efficient';
    if (totalTime <= expectedTime * 1.2) return 'moderate';
    return 'slow';
  }

  generateImprovementOpportunities(worstAnswers) {
    const opportunities = [];
    const categoryCount = new Map();

    worstAnswers.forEach(answer => {
      const category = answer.category;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    categoryCount.forEach((count, category) => {
      if (count >= 2) {
        opportunities.push({
          area: category,
          priority: 'high',
          suggestion: `Focus on improving ${category} skills through targeted practice.`,
        });
      }
    });

    return opportunities;
  }

  calculateSessionRating(interview) {
    const score = interview.results?.overallScore || 0;
    const completionRate = interview.questions?.length > 0 
      ? (interview.questions.filter(q => q.response).length / interview.questions.length) * 100
      : 0;

    // Weighted rating: 70% score, 30% completion
    const rating = (score * 0.7 + completionRate * 0.3) / 20; // Scale to 5-star rating
    return Math.min(5, Math.max(1, Math.round(rating * 2) / 2)); // Round to nearest 0.5
  }
}

module.exports = new SessionSummaryService();