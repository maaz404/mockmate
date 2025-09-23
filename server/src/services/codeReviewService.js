const OpenAI = require('openai');

class CodeReviewService {
  constructor() {
    this.openai = null;
    this.isConfigured = false;

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isConfigured = true;
    } else {
      console.warn('OpenAI API key not configured. Code review features will be disabled.');
    }
  }

  /**
   * Generate code review using OpenAI
   */
  async reviewCode(code, language, challenge, executionResult) {
    if (!this.isConfigured) {
      return {
        success: false,
        review: 'Code review service not available. Please configure OpenAI API key.',
        score: null
      };
    }

    try {
      const prompt = this.buildCodeReviewPrompt(code, language, challenge, executionResult);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert code reviewer and programming mentor. Provide constructive, detailed feedback on code submissions for coding interviews. Focus on:
1. Code correctness and logic
2. Code clarity and readability
3. Time and space complexity
4. Best practices and conventions
5. Potential improvements
6. Edge case handling

Provide a score from 0-100 and detailed feedback.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const reviewText = response.choices[0].message.content;
      return this.parseCodeReview(reviewText);

    } catch (error) {
      console.error('Code review generation failed:', error);
      return {
        success: false,
        review: 'Failed to generate code review. Please try again.',
        score: null
      };
    }
  }

  /**
   * Build prompt for code review
   */
  buildCodeReviewPrompt(code, language, challenge, executionResult) {
    return `
Please review this ${language} code submission for a coding challenge:

**Challenge:**
Title: ${challenge.title}
Description: ${challenge.description}
Difficulty: ${challenge.difficulty}

**Code Submission:**
\`\`\`${language}
${code}
\`\`\`

**Execution Results:**
${executionResult.success ? 
  `✅ Code executed successfully
  Test Results: ${executionResult.testResults.length} test cases
  Passed: ${executionResult.testResults.filter(t => t.passed).length}
  Failed: ${executionResult.testResults.filter(t => !t.passed).length}
  Score: ${executionResult.score}/100` :
  `❌ Execution failed: ${executionResult.error}`
}

Please provide:
1. **Overall Score (0-100):** Based on correctness, efficiency, and code quality
2. **Code Quality Assessment:** Readability, structure, naming conventions
3. **Algorithm Analysis:** Time/space complexity, approach efficiency
4. **Specific Improvements:** Concrete suggestions for enhancement
5. **Positive Aspects:** What the candidate did well

Format your response as:
**Score:** [0-100]
**Review:** [Your detailed feedback]
`;
  }

  /**
   * Parse AI review response
   */
  parseCodeReview(reviewText) {
    try {
      // Extract score using regex
      const scoreMatch = reviewText.match(/\*\*Score:\*\*\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

      // Extract review content
      const reviewMatch = reviewText.match(/\*\*Review:\*\*\s*([\s\S]*)/i);
      const review = reviewMatch ? reviewMatch[1].trim() : reviewText;

      return {
        success: true,
        score,
        review,
        rawResponse: reviewText
      };
    } catch (error) {
      return {
        success: true,
        score: null,
        review: reviewText,
        rawResponse: reviewText
      };
    }
  }

  /**
   * Generate improvement suggestions
   */
  async generateImprovements(code, language, issues) {
    if (!this.isConfigured) {
      return 'Improvement suggestions not available.';
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a coding mentor. Provide specific, actionable improvement suggestions for code.'
          },
          {
            role: 'user',
            content: `Please suggest specific improvements for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Known issues: ${issues.join(', ')}

Provide 3-5 specific, actionable suggestions for improvement.`
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      });

      return response.choices[0].message.content;
    } catch (error) {
      return 'Failed to generate improvement suggestions.';
    }
  }
}

module.exports = new CodeReviewService();