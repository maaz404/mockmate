import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Star } from 'lucide-react';

const CodeExecutionResults = ({ result, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Executing code...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <p className="text-sm text-gray-500 text-center">
          Run your code to see execution results
        </p>
      </div>
    );
  }

  const { success, testResults, score, passedTests, totalTests, feedback, codeReview, error } = result;

  return (
    <div className="space-y-4">
      {/* Execution Status */}
      <div className={`border rounded-lg p-4 ${success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center space-x-2 mb-2">
          {success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <h3 className="font-semibold text-gray-900">
            {success ? 'Code Executed Successfully' : 'Execution Failed'}
          </h3>
        </div>
        
        {error && (
          <div className="text-sm text-red-700 bg-red-100 rounded p-2">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Test Results */}
      {testResults && testResults.length > 0 && (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Test Results</h4>
            <div className="text-sm text-gray-600">
              {passedTests}/{totalTests} tests passed
            </div>
          </div>

          <div className="space-y-2">
            {testResults.map((test, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  test.passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {test.passed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium text-sm">
                    Test Case {index + 1}
                  </span>
                  {test.executionTime && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{test.executionTime}ms</span>
                    </div>
                  )}
                </div>

                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Input:</span> {JSON.stringify(test.input)}
                  </div>
                  <div>
                    <span className="font-medium">Expected:</span> {JSON.stringify(test.expected)}
                  </div>
                  {test.actual !== undefined && (
                    <div>
                      <span className="font-medium">Actual:</span> {JSON.stringify(test.actual)}
                    </div>
                  )}
                  {test.error && (
                    <div className="text-red-600">
                      <span className="font-medium">Error:</span> {test.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Score */}
          {score !== undefined && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  Score: {score}/100
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Code Review */}
      {codeReview && codeReview.success && (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">AI Code Review</h4>
            {codeReview.score && (
              <div className="ml-auto">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                  Review Score: {codeReview.score}/100
                </span>
              </div>
            )}
          </div>

          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-gray-700">
              {codeReview.review}
            </div>
          </div>
        </div>
      )}

      {/* Basic Feedback (fallback) */}
      {feedback && !codeReview?.success && (
        <div className="border border-gray-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Feedback</h4>
          <div className="text-sm text-gray-700">
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeExecutionResults;