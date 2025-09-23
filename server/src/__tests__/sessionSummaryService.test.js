const sessionSummaryService = require('../services/sessionSummaryService');

// Mock Interview data for testing
const mockInterview = {
  _id: 'test-interview-id',
  userId: 'test-user-id',
  status: 'completed',
  config: {
    jobRole: 'Frontend Developer',
    experienceLevel: 'mid',
    interviewType: 'technical',
  },
  completedAt: new Date(),
  timing: {
    totalDuration: 45,
  },
  results: {
    overallScore: 78,
  },
  questions: [
    {
      questionText: 'What is React and why would you use it?',
      response: {
        text: 'React is a JavaScript library for building user interfaces...',
      },
      score: {
        overall: 85,
      },
      timeSpent: 120,
      categories: ['react', 'frontend'],
      feedback: {
        strengths: ['Clear explanation', 'Good examples'],
        improvements: ['Could mention more about virtual DOM'],
      },
    },
    {
      questionText: 'Explain the concept of closures in JavaScript.',
      response: {
        text: 'Closures are functions that have access to variables...',
      },
      score: {
        overall: 72,
      },
      timeSpent: 90,
      categories: ['javascript', 'concepts'],
      feedback: {
        strengths: ['Correct definition'],
        improvements: ['Need practical examples'],
      },
    },
  ],
};

describe('Session Summary Service', () => {
  describe('calculateAggregateMetrics', () => {
    test('should calculate correct aggregate metrics', () => {
      const metrics = sessionSummaryService.calculateAggregateMetrics(mockInterview);
      
      expect(metrics.totalQuestions).toBe(2);
      expect(metrics.answeredQuestions).toBe(2);
      expect(metrics.averageScore).toBe(79); // (85 + 72) / 2 rounded
      expect(metrics.completionRate).toBe(100);
      expect(metrics.totalResponseTime).toBe(210); // 120 + 90
      expect(metrics.averageResponseTime).toBe(105); // 210 / 2
    });

    test('should handle empty questions array', () => {
      const emptyInterview = { ...mockInterview, questions: [] };
      const metrics = sessionSummaryService.calculateAggregateMetrics(emptyInterview);
      
      expect(metrics.totalQuestions).toBe(0);
      expect(metrics.answeredQuestions).toBe(0);
      expect(metrics.averageScore).toBe(0);
      expect(metrics.completionRate).toBe(0);
    });
  });

  describe('calculateCategoryScores', () => {
    test('should calculate category scores correctly', () => {
      const categoryScores = sessionSummaryService.calculateCategoryScores(mockInterview);
      
      expect(categoryScores).toHaveLength(4); // react, frontend, javascript, concepts
      
      // Should be sorted by average score descending
      expect(categoryScores[0].averageScore).toBeGreaterThanOrEqual(categoryScores[1].averageScore);
      
      // Check specific categories
      const reactCategory = categoryScores.find(cat => cat.category === 'react');
      expect(reactCategory).toBeDefined();
      expect(reactCategory.averageScore).toBe(85);
      expect(reactCategory.questionsCount).toBe(1);
    });
  });

  describe('identifyPerformanceHighlights', () => {
    test('should identify best and worst answers', () => {
      const highlights = sessionSummaryService.identifyPerformanceHighlights(mockInterview);
      
      expect(highlights.bestAnswers).toHaveLength(2);
      expect(highlights.worstAnswers).toHaveLength(2);
      
      // Best answer should be the one with highest score
      expect(highlights.bestAnswers[0].score).toBe(85);
      
      // Worst answer should be the one with lowest score
      expect(highlights.worstAnswers[0].score).toBe(72);
    });
  });

  describe('generateOverallAssessment', () => {
    test('should generate correct readiness level', () => {
      const assessment = sessionSummaryService.generateOverallAssessment(mockInterview);
      
      expect(assessment.overallScore).toBe(78);
      expect(assessment.readinessLevel).toBe('good'); // Score 78 should be 'good'
      expect(assessment.completionRate).toBe(100);
      expect(assessment.sessionRating).toBeGreaterThan(0);
      expect(assessment.sessionRating).toBeLessThanOrEqual(5);
    });

    test('should handle different score ranges', () => {
      // Test excellent score
      const excellentInterview = { 
        ...mockInterview, 
        results: { overallScore: 87 } 
      };
      const excellentAssessment = sessionSummaryService.generateOverallAssessment(excellentInterview);
      expect(excellentAssessment.readinessLevel).toBe('excellent');

      // Test needs improvement score
      const poorInterview = { 
        ...mockInterview, 
        results: { overallScore: 45 } 
      };
      const poorAssessment = sessionSummaryService.generateOverallAssessment(poorInterview);
      expect(poorAssessment.readinessLevel).toBe('needs-improvement');
    });
  });

  describe('analyzeTimeMetrics', () => {
    test('should analyze time metrics correctly', () => {
      const timeAnalysis = sessionSummaryService.analyzeTimeMetrics(mockInterview);
      
      expect(timeAnalysis.totalTime).toBe(45);
      expect(timeAnalysis.averageTime).toBe(105); // (120 + 90) / 2
      expect(timeAnalysis.fastestAnswer.time).toBe(90);
      expect(timeAnalysis.slowestAnswer.time).toBe(120);
      expect(timeAnalysis.timeEfficiency).toBeDefined();
    });

    test('should handle no answered questions', () => {
      const noAnswersInterview = {
        ...mockInterview,
        questions: [
          { questionText: 'Test question', response: null }
        ]
      };
      
      const timeAnalysis = sessionSummaryService.analyzeTimeMetrics(noAnswersInterview);
      
      expect(timeAnalysis.averageTime).toBe(0);
      expect(timeAnalysis.fastestAnswer).toBeNull();
      expect(timeAnalysis.slowestAnswer).toBeNull();
    });
  });
});