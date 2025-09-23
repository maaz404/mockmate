import React, { useState } from 'react';
import CodeEditor from '../components/ui/CodeEditor';
import CodeExecutionResults from '../components/ui/CodeExecutionResults';

const CodingChallengeDemo = () => {
  const [code, setCode] = useState(`// Two Sum Problem - LeetCode #1
function twoSum(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
}

// Test cases
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log(twoSum([3, 2, 4], 6)); // Expected: [1, 2]`);

  const [language, setLanguage] = useState('javascript');
  const [executionResult, setExecutionResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleCodeExecution = async () => {
    setIsExecuting(true);
    
    // Simulate execution for demo
    setTimeout(() => {
      setExecutionResult({
        success: true,
        testResults: [
          {
            testIndex: 0,
            input: [[2, 7, 11, 15], 9],
            expected: [0, 1],
            actual: [0, 1],
            passed: true,
            executionTime: 2
          },
          {
            testIndex: 1,
            input: [[3, 2, 4], 6],
            expected: [1, 2],
            actual: [1, 2],
            passed: true,
            executionTime: 1
          }
        ],
        score: 100,
        passedTests: 2,
        totalTests: 2,
        codeReview: {
          success: true,
          score: 85,
          review: `**Code Quality Assessment:**
• Clean and readable implementation
• Efficient O(n) time complexity using HashMap approach
• Good variable naming conventions
• Proper handling of edge cases

**Algorithm Analysis:**
• Time Complexity: O(n) - excellent optimization
• Space Complexity: O(n) for the HashMap storage
• Approach is optimal for this problem

**Specific Improvements:**
1. Consider adding input validation for edge cases
2. Could add comments explaining the algorithm strategy
3. Function could handle empty array case explicitly

**Positive Aspects:**
• Excellent use of HashMap for complement lookup
• Clean, concise implementation
• Optimal time complexity achieved`
        }
      });
      setIsExecuting(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">Coding Challenge Demo</h1>
            <p className="text-blue-100">
              Experience the Monaco Editor integration with Judge0 API and AI code review
            </p>
          </div>

          {/* Challenge Description */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Problem: Two Sum
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 mb-3">
                Given an array of integers <code className="bg-gray-200 px-1 rounded">nums</code> and an integer <code className="bg-gray-200 px-1 rounded">target</code>, 
                return indices of the two numbers such that they add up to <code className="bg-gray-200 px-1 rounded">target</code>.
              </p>
              <p className="text-gray-700 mb-3">
                You may assume that each input would have exactly one solution, and you may not use the same element twice.
              </p>
              <div className="bg-white rounded border p-3">
                <p className="font-medium text-gray-900 mb-2">Example:</p>
                <code className="text-sm">
                  Input: nums = [2,7,11,15], target = 9<br/>
                  Output: [0,1]<br/>
                  Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
                </code>
              </div>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Solution:
            </h3>
            
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              onRun={handleCodeExecution}
              loading={isExecuting}
              height="500px"
            />

            {/* Execution Results */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Execution Results:
              </h3>
              <CodeExecutionResults 
                result={executionResult}
                loading={isExecuting}
              />
            </div>
          </div>

          {/* Features Showcase */}
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🚀 Key Features Demonstrated:
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-blue-600 mb-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Monaco Editor</h4>
                <p className="text-sm text-gray-600">VS Code-like editor with syntax highlighting</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-green-600 mb-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Judge0 Integration</h4>
                <p className="text-sm text-gray-600">Secure code execution in multiple languages</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-purple-600 mb-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">AI Code Review</h4>
                <p className="text-sm text-gray-600">OpenAI-powered code analysis and feedback</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-orange-600 mb-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900">Multi-language Support</h4>
                <p className="text-sm text-gray-600">JavaScript, Python, Java, C++, and more</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingChallengeDemo;