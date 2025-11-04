const aiProviderManager = require('./aiProviders');

class CodeReviewService {
  constructor() {
    this.isConfigured = true;
  }

  async reviewCode(code, language, challenge, executionResult) {
    try {
      const response = await aiProviderManager.evaluateAnswer(
        {
          text: challenge.description,
          category: 'coding',
          difficulty: challenge.difficulty,
          title: challenge.title
        },
        code,
        {
          language,
          executionResult,
          evaluationType: 'code_review'
        }
      );

      return {
        success: true,
        review: this.formatCodeReview(response, executionResult),
        score: response.score || 0,
        details: {
          strengths: response.strengths || [],
          improvements: response.improvements || [],
          rubricScores: response.rubricScores || {}
        }
      };
    } catch (error) {
      console.error('Code review generation failed:', error);
      return {
        success: false,
        review: 'Failed to generate code review. Please try again.',
        score: null
      };
    }
  }

  formatCodeReview(evaluation, executionResult) {
    const sections = [];
    const score = evaluation.score || 0;
    sections.push('Overall Score: ' + score + '/100');
    sections.push('');

    if (executionResult && executionResult.success) {
      sections.push('Code executed successfully');
      const totalTests = executionResult.totalTests || 0;
      const passedTests = executionResult.passedTests || 0;
      sections.push('Test Results: ' + passedTests + '/' + totalTests + ' passed');
    } else if (executionResult) {
      sections.push('Execution failed: ' + (executionResult.error || 'Unknown error'));
    }
    sections.push('');

    if (evaluation.strengths && evaluation.strengths.length > 0) {
      sections.push('**Strengths:**');
      evaluation.strengths.forEach(s => sections.push('- ' + s));
      sections.push('');
    }

    if (evaluation.improvements && evaluation.improvements.length > 0) {
      sections.push('**Areas for Improvement:**');
      evaluation.improvements.forEach(i => sections.push('- ' + i));
      sections.push('');
    }

    if (evaluation.feedback) {
      sections.push('**Detailed Feedback:**');
      sections.push(evaluation.feedback);
    }

    return sections.join('\\n');
  }
}

module.exports = new CodeReviewService();
