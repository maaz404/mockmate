const aiQuestionService = require('../services/aiQuestionService');

describe('Follow-up Question Generation', () => {
  describe('generateFollowUp', () => {
    it('should return null when OpenAI API key is not configured', async () => {
      // Temporarily remove the API key
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const result = await aiQuestionService.generateFollowUp(
        'What is React?',
        'React is a JavaScript library for building user interfaces.',
        { jobRole: 'Frontend Developer', experienceLevel: 'mid' }
      );

      expect(result).toBeNull();

      // Restore the API key
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    });

    it('should handle malformed API responses gracefully', async () => {
      // Set API key for the test
      process.env.OPENAI_API_KEY = 'test-key';
      
      // Mock the OpenAI client to return malformed JSON
      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'This is not valid JSON'
                }
              }]
            })
          }
        }
      };

      const originalGetClient = aiQuestionService.getOpenAIClient;
      aiQuestionService.getOpenAIClient = jest.fn().mockReturnValue(mockClient);

      const result = await aiQuestionService.generateFollowUp(
        'What is React?',
        'React is a JavaScript library for building user interfaces.',
        { jobRole: 'Frontend Developer', experienceLevel: 'mid' }
      );

      // Should fallback to extracting questions from text
      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
      
      // Restore original function
      aiQuestionService.getOpenAIClient = originalGetClient;
    });

    it('should return follow-up questions in correct format when API works', async () => {
      // Set API key for the test
      process.env.OPENAI_API_KEY = 'test-key';
      
      const mockResponse = {
        followUps: [
          {
            text: 'Can you explain the concept of virtual DOM in React?',
            type: 'technical'
          },
          {
            text: 'What are some performance optimization techniques you would use?',
            type: 'example'
          }
        ]
      };

      const mockClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify(mockResponse)
                }
              }]
            })
          }
        }
      };

      const originalGetClient = aiQuestionService.getOpenAIClient;
      aiQuestionService.getOpenAIClient = jest.fn().mockReturnValue(mockClient);

      const result = await aiQuestionService.generateFollowUp(
        'What is React?',
        'React is a JavaScript library for building user interfaces.',
        { jobRole: 'Frontend Developer', experienceLevel: 'mid' }
      );

      expect(result).toEqual(mockResponse.followUps);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('text');
      expect(result[0]).toHaveProperty('type');
      
      // Restore original function
      aiQuestionService.getOpenAIClient = originalGetClient;
    });
  });
});