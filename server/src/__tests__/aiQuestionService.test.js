const aiQuestionService = require('../services/aiQuestionService');

describe('AIQuestionService', () => {
  describe('getBasicEvaluation', () => {
    it('should return enhanced feedback with rubric scores and model answer', () => {
      const question = {
        text: 'What is React?',
        category: 'frontend',
        type: 'technical',
        difficulty: 'intermediate'
      };
      
      const answer = 'React is a JavaScript library for building user interfaces. It uses components and virtual DOM for efficient rendering.';
      
      const result = aiQuestionService.getBasicEvaluation(question, answer);
      
      // Check basic structure
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('rubricScores');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('improvements');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('modelAnswer');
      
      // Check rubric scores are 1-5 scale
      expect(result.rubricScores).toHaveProperty('relevance');
      expect(result.rubricScores).toHaveProperty('clarity');
      expect(result.rubricScores).toHaveProperty('depth');
      expect(result.rubricScores).toHaveProperty('structure');
      
      Object.values(result.rubricScores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(5);
      });
      
      // Check improvements array has exactly 2 items as per requirements
      expect(result.improvements).toHaveLength(2);
      
      // Check model answer exists
      expect(result.modelAnswer).toBeTruthy();
      expect(typeof result.modelAnswer).toBe('string');
    });

    it('should handle empty answers appropriately', () => {
      const question = {
        text: 'What is JavaScript?',
        category: 'programming',
        type: 'technical'
      };
      
      const result = aiQuestionService.getBasicEvaluation(question, '');
      
      expect(result.score).toBeLessThan(50);
      expect(result.rubricScores.relevance).toBeGreaterThanOrEqual(1);
      expect(result.modelAnswer).toBeTruthy();
    });

    it('should generate appropriate model answers for different question types', () => {
      const technicalQuestion = {
        text: 'Explain REST APIs',
        category: 'backend',
        type: 'technical'
      };
      
      const behavioralQuestion = {
        text: 'Tell me about a challenging project',
        category: 'general',
        type: 'behavioral'
      };
      
      const systemDesignQuestion = {
        text: 'Design a messaging system',
        category: 'architecture',
        type: 'system-design'
      };
      
      const answer = 'Sample answer';
      
      const technicalResult = aiQuestionService.getBasicEvaluation(technicalQuestion, answer);
      const behavioralResult = aiQuestionService.getBasicEvaluation(behavioralQuestion, answer);
      const systemDesignResult = aiQuestionService.getBasicEvaluation(systemDesignQuestion, answer);
      
      expect(technicalResult.modelAnswer).toContain('implementation');
      expect(behavioralResult.modelAnswer).toContain('STAR');
      expect(systemDesignResult.modelAnswer).toContain('architecture');
    });
  });

  describe('generateBasicModelAnswer', () => {
    it('should generate appropriate model answers for different question types', () => {
      const technicalQuestion = { type: 'technical', category: 'react' };
      const behavioralQuestion = { type: 'behavioral', category: 'leadership' };
      const systemDesignQuestion = { type: 'system-design', category: 'scalability' };
      const generalQuestion = { type: 'general', category: 'communication' };
      
      const technicalAnswer = aiQuestionService.generateBasicModelAnswer(technicalQuestion);
      const behavioralAnswer = aiQuestionService.generateBasicModelAnswer(behavioralQuestion);
      const systemDesignAnswer = aiQuestionService.generateBasicModelAnswer(systemDesignQuestion);
      const generalAnswer = aiQuestionService.generateBasicModelAnswer(generalQuestion);
      
      expect(technicalAnswer).toContain('technical');
      expect(behavioralAnswer).toContain('STAR');
      expect(systemDesignAnswer).toContain('system design');
      expect(generalAnswer).toContain('communication');
    });
  });
});