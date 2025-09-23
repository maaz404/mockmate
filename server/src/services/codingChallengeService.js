const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");

const Logger = require("../utils/logger");
const judge0Service = require("./judge0Service");
const codeReviewService = require("./codeReviewService");

class CodingChallengeService {
  constructor() {
    this.challenges = new Map(); // In-memory storage for active challenges
    this.supportedLanguages = {
      javascript: {
        extension: "js",
        runner: "node",
        template: `// Write your solution here
function solution() {
    // Your code here
    return result;
}

// Test your solution
// console.log(solution()); // Uncomment to test locally`,
        testTemplate: `const assert = require('assert');

// Import the solution (this will be replaced with actual code)
const solution = {{SOLUTION_CODE}};

// Test cases
{{TEST_CASES}}`,
      },
      python: {
        extension: "py",
        runner: "python3",
        template: `# Write your solution here
def solution():
    # Your code here
    return result

# Test your solution
if __name__ == "__main__":
    print(solution())`,
        testTemplate: `import sys
import json

# Solution code (this will be replaced with actual code)
{{SOLUTION_CODE}}

# Test cases
{{TEST_CASES}}`,
      },
      java: {
        extension: "java",
        runner: "java",
        template: `public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.solution());
    }
    
    public Object solution() {
        // Your code here
        return null;
    }
}`,
        testTemplate: `public class Test {
    {{SOLUTION_CODE}}
    
    public static void main(String[] args) {
        {{TEST_CASES}}
    }
}`,
      },
    };

    this.predefinedChallenges = this.initializeChallenges();
  }

  /**
   * Initialize predefined coding challenges
   */
  initializeChallenges() {
    return {
      "two-sum": {
        id: "two-sum",
        title: "Two Sum",
        difficulty: "easy",
        category: "arrays",
        timeLimit: 30, // minutes
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
            explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
          },
        ],
        constraints: [
          "2 ≤ nums.length ≤ 10^4",
          "-10^9 ≤ nums[i] ≤ 10^9",
          "-10^9 ≤ target ≤ 10^9",
          "Only one valid answer exists.",
        ],
        testCases: [
          { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
          { input: [[3, 2, 4], 6], expected: [1, 2] },
          { input: [[3, 3], 6], expected: [0, 1] },
        ],
        starterCode: {
          javascript: `function twoSum(nums, target) {
    // Write your solution here
    
}`,
          python: `def two_sum(nums, target):
    # Write your solution here
    pass`,
          java: `public int[] twoSum(int[] nums, int target) {
    // Write your solution here
    return new int[]{};
}`,
        },
        hints: [
          "Try using a hash map to store numbers you've seen",
          "For each number, check if target - number exists in your hash map",
          "Remember to return the indices, not the values",
        ],
      },

      "reverse-string": {
        id: "reverse-string",
        title: "Reverse String",
        difficulty: "easy",
        category: "strings",
        timeLimit: 15,
        description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
        examples: [
          {
            input: 's = ["h","e","l","l","o"]',
            output: '["o","l","l","e","h"]',
          },
          {
            input: 's = ["H","a","n","n","a","h"]',
            output: '["h","a","n","n","a","H"]',
          },
        ],
        testCases: [
          {
            input: [["h", "e", "l", "l", "o"]],
            expected: ["o", "l", "l", "e", "h"],
          },
          {
            input: [["H", "a", "n", "n", "a", "h"]],
            expected: ["h", "a", "n", "n", "a", "H"],
          },
          { input: [["a"]], expected: ["a"] },
        ],
        starterCode: {
          javascript: `function reverseString(s) {
    // Write your solution here
    
}`,
          python: `def reverse_string(s):
    # Write your solution here
    pass`,
          java: `public void reverseString(char[] s) {
    // Write your solution here
    
}`,
        },
      },

      fibonacci: {
        id: "fibonacci",
        title: "Fibonacci Number",
        difficulty: "medium",
        category: "dynamic-programming",
        timeLimit: 25,
        description: `The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.

Given n, calculate F(n).`,
        examples: [
          {
            input: "n = 2",
            output: "1",
            explanation: "F(2) = F(1) + F(0) = 1 + 0 = 1.",
          },
          {
            input: "n = 3",
            output: "2",
            explanation: "F(3) = F(2) + F(1) = 1 + 1 = 2.",
          },
          {
            input: "n = 4",
            output: "3",
            explanation: "F(4) = F(3) + F(2) = 2 + 1 = 3.",
          },
        ],
        testCases: [
          { input: [2], expected: 1 },
          { input: [3], expected: 2 },
          { input: [4], expected: 3 },
          { input: [10], expected: 55 },
        ],
        starterCode: {
          javascript: `function fib(n) {
    // Write your solution here
    
}`,
          python: `def fib(n):
    # Write your solution here
    pass`,
          java: `public int fib(int n) {
    // Write your solution here
    return 0;
}`,
        },
      },

      "valid-parentheses": {
        id: "valid-parentheses",
        title: "Valid Parentheses",
        difficulty: "medium",
        category: "stack",
        timeLimit: 20,
        description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        examples: [
          { input: 's = "()"', output: "true" },
          { input: 's = "()[]{}"', output: "true" },
          { input: 's = "(]"', output: "false" },
        ],
        testCases: [
          { input: ["()"], expected: true },
          { input: ['()[]{}"'], expected: true },
          { input: ["(]"], expected: false },
          { input: ["([)]"], expected: false },
        ],
        starterCode: {
          javascript: `function isValid(s) {
    // Write your solution here
    
}`,
          python: `def is_valid(s):
    # Write your solution here
    pass`,
          java: `public boolean isValid(String s) {
    // Write your solution here
    return false;
}`,
        },
      },

      "binary-search": {
        id: "binary-search",
        title: "Binary Search",
        difficulty: "medium",
        category: "algorithms",
        timeLimit: 25,
        description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.`,
        examples: [
          { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
          { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
        ],
        testCases: [
          { input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
          { input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
          { input: [[5], 5], expected: 0 },
        ],
        starterCode: {
          javascript: `function search(nums, target) {
    // Write your solution here
    
}`,
          python: `def search(nums, target):
    # Write your solution here
    pass`,
          java: `public int search(int[] nums, int target) {
    // Write your solution here
    return -1;
}`,
        },
      },
    };
  }

  /**
   * Create a new coding challenge session
   */
  async createChallengeSession(interviewId, config) {
    try {
      const sessionId = uuidv4();
      const selectedChallenges = this.selectChallenges(config);

      const session = {
        id: sessionId,
        interviewId,
        challenges: selectedChallenges,
        currentChallengeIndex: 0,
        startedAt: new Date(),
        status: "active",
        config: {
          ...config,
          timePerChallenge: config.timePerChallenge || 30, // minutes
          language: config.language || "javascript",
          difficulty: config.difficulty || "mixed",
        },
        submissions: [],
        results: {
          totalScore: 0,
          challengesCompleted: 0,
          totalTime: 0,
        },
      };

      this.challenges.set(sessionId, session);

      return {
        success: true,
        sessionId,
        challenges: selectedChallenges.map((c) => ({
          id: c.id,
          title: c.title,
          difficulty: c.difficulty,
          category: c.category,
          timeLimit: c.timeLimit,
        })),
        currentChallenge: this.getCurrentChallenge(sessionId),
      };
    } catch (error) {
      Logger.error("Failed to create challenge session:", error);
      return {
        success: false,
        error: "Failed to create coding challenge session",
      };
    }
  }

  /**
   * Get current challenge for session
   */
  getCurrentChallenge(sessionId) {
    const session = this.challenges.get(sessionId);
    if (
      !session ||
      session.currentChallengeIndex >= session.challenges.length
    ) {
      return null;
    }

    const challenge = session.challenges[session.currentChallengeIndex];
    const language = session.config.language;

    return {
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      category: challenge.category,
      timeLimit: challenge.timeLimit,
      description: challenge.description,
      examples: challenge.examples,
      constraints: challenge.constraints,
      starterCode:
        challenge.starterCode[language] || challenge.starterCode.javascript,
      hints: challenge.hints || [],
      currentIndex: session.currentChallengeIndex,
      totalChallenges: session.challenges.length,
      timeRemaining: this.calculateTimeRemaining(session, challenge),
    };
  }

  /**
   * Submit code for evaluation
   */
  async submitCode(sessionId, challengeId, code, language = "javascript") {
    try {
      const session = this.challenges.get(sessionId);
      if (!session) {
        return { success: false, error: "Session not found" };
      }

      const challenge = this.predefinedChallenges[challengeId];
      if (!challenge) {
        return { success: false, error: "Challenge not found" };
      }

      const submissionId = uuidv4();
      const submission = {
        id: submissionId,
        challengeId,
        code,
        language,
        submittedAt: new Date(),
        status: "evaluating",
      };

      // Add submission to session
      session.submissions.push(submission);

      try {
        // Run tests
        const testResults = await this.runTests(challenge, code, language);

        // Calculate score
        const score = this.calculateScore(testResults, challenge);

        // Generate AI code review
        const executionResult = {
          success: true,
          testResults,
          score
        };
        
        const codeReview = await codeReviewService.reviewCode(
          code, 
          language, 
          challenge, 
          executionResult
        );

        // Update submission with results
        submission.status = "completed";
        submission.testResults = testResults;
        submission.score = score;
        submission.codeReview = codeReview;
        submission.completedAt = new Date();
        submission.executionTime =
          submission.completedAt - submission.submittedAt;

        // Update session results
        session.results.totalScore += score;
        session.results.challengesCompleted++;
        session.results.totalTime += submission.executionTime;

        return {
          success: true,
          submissionId,
          testResults,
          score,
          passedTests: testResults.filter((t) => t.passed).length,
          totalTests: testResults.length,
          feedback: this.generateCodeFeedback(testResults, code, challenge),
          codeReview
        };
        
      } catch (executionError) {
        // Handle execution failure
        const executionResult = {
          success: false,
          error: executionError.message
        };
        
        const codeReview = await codeReviewService.reviewCode(
          code, 
          language, 
          challenge, 
          executionResult
        );

        submission.status = "failed";
        submission.error = executionError.message;
        submission.codeReview = codeReview;
        submission.completedAt = new Date();

        return {
          success: false,
          error: executionError.message,
          submissionId,
          codeReview
        };
      }
    } catch (error) {
      console.error("Code submission failed:", error);
      return {
        success: false,
        error: "Failed to evaluate code submission",
      };
    }
  }

  /**
   * Run test cases against submitted code
   */
  async runTests(challenge, code, language) {
    const results = [];

    for (let i = 0; i < challenge.testCases.length; i++) {
      const testCase = challenge.testCases[i];

      try {
        const result = await this.executeTest(
          code,
          testCase,
          language,
          challenge
        );
        results.push({
          testIndex: i,
          input: testCase.input,
          expected: testCase.expected,
          actual: result.output,
          passed: this.compareResults(result.output, testCase.expected),
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
        });
      } catch (error) {
        results.push({
          testIndex: i,
          input: testCase.input,
          expected: testCase.expected,
          actual: null,
          passed: false,
          error: error.message,
          executionTime: 0,
        });
      }
    }

    return results;
  }

  /**
   * Execute a single test case using Judge0 or fallback
   */
  async executeTest(code, testCase, language, challenge) {
    const startTime = Date.now();

    try {
      // Use Judge0 if available, otherwise fallback to local execution
      if (judge0Service.isAvailable()) {
        return await this.executeWithJudge0(code, testCase, language, challenge);
      } else {
        // Fallback to local execution (for development/testing)
        return await this.executeLocally(code, testCase, language, challenge);
      }
    } catch (error) {
      throw new Error(`Execution error: ${error.message}`);
    }
  }

  /**
   * Execute code using Judge0 API
   */
  async executeWithJudge0(code, testCase, language, challenge) {
    try {
      // Prepare test code for Judge0
      const testCode = this.prepareTestCode(code, testCase, language, challenge);
      
      // Execute using Judge0
      const result = await judge0Service.executeCode(testCode, language);
      
      // Parse Judge0 result
      if (result.status.id === 3) { // Accepted
        const output = this.parseJudge0Output(result.stdout, language);
        return {
          output,
          executionTime: result.time * 1000, // Convert to milliseconds
          memoryUsed: result.memory || 0,
          judge0Result: result
        };
      } else {
        throw new Error(`Execution failed: ${result.stderr || result.compile_output || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`Judge0 execution failed: ${error.message}`);
    }
  }

  /**
   * Prepare test code for Judge0 execution
   */
  prepareTestCode(code, testCase, language, challenge) {
    switch (language) {
      case 'javascript':
        return this.prepareJavaScriptTestCode(code, testCase, challenge);
      case 'python':
        return this.preparePythonTestCode(code, testCase, challenge);
      case 'java':
        return this.prepareJavaTestCode(code, testCase, challenge);
      default:
        throw new Error(`Language ${language} not supported`);
    }
  }

  /**
   * Prepare JavaScript test code for Judge0
   */
  prepareJavaScriptTestCode(code, testCase, challenge) {
    const input = JSON.stringify(testCase.input);
    return `
${code}

// Test execution
try {
  const input = ${input};
  let result;
  
  switch('${challenge.id}') {
    case 'two-sum':
      result = twoSum(input[0], input[1]);
      break;
    case 'reverse-string':
      const arr = [...input[0]];
      reverseString(arr);
      result = arr;
      break;
    case 'fibonacci':
      result = fib(input[0]);
      break;
    case 'valid-parentheses':
      result = isValid(input[0]);
      break;
    case 'binary-search':
      result = search(input[0], input[1]);
      break;
    default:
      throw new Error('Unknown challenge');
  }
  
  console.log(JSON.stringify(result));
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
}`;
  }

  /**
   * Prepare Python test code for Judge0
   */
  preparePythonTestCode(code, testCase, challenge) {
    return `
import json
import sys

${code}

# Test execution
try:
    input_data = ${JSON.stringify(testCase.input)}
    
    # Execute based on challenge
    if '${challenge.id}' == 'two-sum':
        result = twoSum(input_data[0], input_data[1])
    elif '${challenge.id}' == 'fibonacci':
        result = fib(input_data[0])
    else:
        raise Exception('Unknown challenge')
    
    print(json.dumps(result))
except Exception as e:
    print(f"Test execution failed: {e}", file=sys.stderr)
    sys.exit(1)`;
  }

  /**
   * Prepare Java test code for Judge0
   */
  prepareJavaTestCode(code, testCase, challenge) {
    return `
import java.util.*;
import com.google.gson.Gson;

${code}

public class Main {
    public static void main(String[] args) {
        try {
            Solution solution = new Solution();
            Gson gson = new Gson();
            
            // Test execution based on challenge
            Object result = null;
            
            switch("${challenge.id}") {
                case "two-sum":
                    int[] nums = ${JSON.stringify(testCase.input[0])};
                    int target = ${testCase.input[1]};
                    result = solution.twoSum(nums, target);
                    break;
                default:
                    throw new Exception("Unknown challenge");
            }
            
            System.out.println(gson.toJson(result));
        } catch (Exception e) {
            System.err.println("Test execution failed: " + e.getMessage());
            System.exit(1);
        }
    }
}`;
  }

  /**
   * Parse Judge0 output based on language
   */
  parseJudge0Output(stdout, language) {
    try {
      const trimmed = stdout.trim();
      return JSON.parse(trimmed);
    } catch (error) {
      // If JSON parsing fails, return the raw output
      return stdout.trim();
    }
  }

  /**
   * Fallback local execution (for development)
   */
  async executeLocally(code, testCase, language, challenge) {
    const startTime = Date.now();
    let result;

    if (language === "javascript") {
      result = this.executeJavaScriptTest(code, testCase, challenge);
    } else if (language === "python") {
      result = this.executePythonTest(code, testCase, challenge);
    } else {
      throw new Error(`Language ${language} not supported for local execution`);
    }

    const executionTime = Date.now() - startTime;

    return {
      output: result,
      executionTime,
      memoryUsed: 0, // Placeholder
    };
  }

  /**
   * Execute JavaScript test (simplified - unsafe for production)
   */
  executeJavaScriptTest(code, testCase, challenge) {
    // WARNING: This is unsafe for production use
    // In production, use a secure sandbox like vm2 or isolated containers

    try {
      // Create a safe execution context
      const func = new Function(
        "input",
        `
        ${code}
        
        // Call the appropriate function based on challenge
        const challengeId = '${challenge.id}';
        const args = input;
        
        switch(challengeId) {
          case 'two-sum':
            return twoSum(args[0], args[1]);
          case 'reverse-string':
            const arr = [...args[0]];
            reverseString(arr);
            return arr;
          case 'fibonacci':
            return fib(args[0]);
          case 'valid-parentheses':
            return isValid(args[0]);
          case 'binary-search':
            return search(args[0], args[1]);
          default:
            throw new Error('Unknown challenge');
        }
      `
      );

      return func(testCase.input);
    } catch (error) {
      throw new Error(`JavaScript execution failed: ${error.message}`);
    }
  }

  /**
   * Execute Python test (placeholder)
   */
  executePythonTest(code, testCase, challenge) {
    // In production, this would use a Python subprocess or container
    throw new Error("Python execution not implemented in this demo");
  }

  /**
   * Compare expected vs actual results
   */
  compareResults(actual, expected) {
    if (Array.isArray(expected)) {
      return JSON.stringify(actual) === JSON.stringify(expected);
    }
    return actual === expected;
  }

  /**
   * Calculate score based on test results
   */
  calculateScore(testResults, challenge) {
    const passedTests = testResults.filter((t) => t.passed).length;
    const totalTests = testResults.length;
    const accuracy = passedTests / totalTests;

    // Base score from accuracy
    let score = Math.round(accuracy * 100);

    // Bonus for completing all tests
    if (accuracy === 1.0) {
      score = Math.min(100, score + 10);
    }

    // Penalty for errors
    const errorCount = testResults.filter((t) => t.error).length;
    score = Math.max(0, score - errorCount * 5);

    return score;
  }

  /**
   * Generate feedback for code submission
   */
  generateCodeFeedback(testResults, code, challenge) {
    const passedTests = testResults.filter((t) => t.passed).length;
    const totalTests = testResults.length;
    const accuracy = passedTests / totalTests;

    let feedback = {
      summary: "",
      strengths: [],
      improvements: [],
      suggestions: [],
    };

    // Summary
    if (accuracy === 1.0) {
      feedback.summary = "Excellent! All test cases passed.";
      feedback.strengths.push("Correct algorithm implementation");
      feedback.strengths.push("Handles all edge cases properly");
    } else if (accuracy >= 0.7) {
      feedback.summary = `Good progress! ${passedTests} out of ${totalTests} test cases passed.`;
      feedback.strengths.push("Core logic is mostly correct");
      feedback.improvements.push("Review failed test cases for edge cases");
    } else {
      feedback.summary = `Keep working! ${passedTests} out of ${totalTests} test cases passed.`;
      feedback.improvements.push("Algorithm needs revision");
      feedback.improvements.push("Consider the problem requirements carefully");
    }

    // Code quality analysis
    const codeLines = code.split("\n").length;
    if (codeLines < 10) {
      feedback.strengths.push("Concise implementation");
    }

    // Add challenge-specific feedback
    if (challenge.hints) {
      feedback.suggestions = challenge.hints.slice(0, 2);
    }

    return feedback;
  }

  /**
   * Select challenges based on configuration
   */
  selectChallenges(config) {
    const availableChallenges = Object.values(this.predefinedChallenges);
    let selected = [];

    // Filter by difficulty if specified
    if (config.difficulty && config.difficulty !== "mixed") {
      selected = availableChallenges.filter(
        (c) => c.difficulty === config.difficulty
      );
    } else {
      selected = availableChallenges;
    }

    // Filter by category if specified
    if (config.categories && config.categories.length > 0) {
      selected = selected.filter((c) => config.categories.includes(c.category));
    }

    // Shuffle and select requested number
    selected = this.shuffleArray(selected);
    return selected.slice(0, config.challengeCount || 3);
  }

  /**
   * Get next challenge in session
   */
  getNextChallenge(sessionId) {
    const session = this.challenges.get(sessionId);
    if (!session) return null;

    session.currentChallengeIndex++;

    if (session.currentChallengeIndex >= session.challenges.length) {
      session.status = "completed";
      return null;
    }

    return this.getCurrentChallenge(sessionId);
  }

  /**
   * Complete coding challenge session
   */
  completeSession(sessionId) {
    const session = this.challenges.get(sessionId);
    if (!session) return null;

    session.status = "completed";
    session.completedAt = new Date();
    session.totalDuration = session.completedAt - session.startedAt;

    // Calculate final results
    const totalPossibleScore = session.challenges.length * 100;
    const finalScore = Math.round(
      (session.results.totalScore / totalPossibleScore) * 100
    );

    const results = {
      sessionId,
      finalScore,
      challengesCompleted: session.results.challengesCompleted,
      totalChallenges: session.challenges.length,
      totalTime: session.totalDuration,
      averageScore: Math.round(
        session.results.totalScore / session.challenges.length
      ),
      submissions: session.submissions,
      performance: this.categorizePerformance(finalScore),
    };

    return results;
  }

  /**
   * Helper methods
   */
  calculateTimeRemaining(session, challenge) {
    const elapsed = Date.now() - session.startedAt;
    const allowedTime = challenge.timeLimit * 60 * 1000; // convert to ms
    return Math.max(0, allowedTime - elapsed);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  categorizePerformance(score) {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 60) return "average";
    return "needs-improvement";
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId) {
    const session = this.challenges.get(sessionId);
    if (!session) return null;

    return {
      id: sessionId,
      status: session.status,
      currentChallengeIndex: session.currentChallengeIndex,
      totalChallenges: session.challenges.length,
      submissions: session.submissions.length,
      startedAt: session.startedAt,
      results: session.results,
    };
  }

  /**
   * Get available challenge categories
   */
  getAvailableCategories() {
    const categories = new Set();
    Object.values(this.predefinedChallenges).forEach((challenge) => {
      categories.add(challenge.category);
    });
    return Array.from(categories);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.supportedLanguages);
  }
}

module.exports = new CodingChallengeService();
