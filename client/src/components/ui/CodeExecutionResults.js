import React, { useState } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle, Star } from "lucide-react";

const CodeExecutionResults = ({ result, loading = false }) => {
  // Hooks must be first
  const [expanded, setExpanded] = useState({});

  if (loading) {
    return (
      <div className="bg-white border border-surface-300 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-surface-600">Executing code...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-surface-50 border border-surface-300 rounded-lg p-4">
        <p className="text-sm text-surface-500 text-center">
          Run your code to see execution results
        </p>
      </div>
    );
  }

  const {
    success,
    testResults,
    score,
    passedTests,
    totalTests,
    feedback,
    codeReview,
    error,
  } = result;

  const toggle = (i) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="space-y-4">
      {/* Execution Status */}
      <div
        className={`border rounded-lg p-4 ${
          success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center space-x-2 mb-2">
          {success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <h3 className="font-semibold text-surface-900">
            {success ? "Code Executed Successfully" : "Execution Failed"}
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
        <div className="border border-surface-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-surface-900">Test Results</h4>
            <div className="text-sm text-surface-600">
              {passedTests}/{totalTests} tests passed
            </div>
          </div>

          <div className="space-y-2">
            {testResults.map((test, index) => {
              const pass = !!test.passed;
              const show = expanded[index];
              return (
                <div
                  key={index}
                  className={`group rounded border px-3 py-2 cursor-pointer transition relative ${
                    pass
                      ? "bg-green-50 border-green-200 hover:bg-green-100"
                      : "bg-red-50 border-red-200 hover:bg-red-100"
                  }`}
                  onClick={() => toggle(index)}
                  title={pass ? "Passed" : test.error ? test.error : "Failed"}
                >
                  <div className="flex items-center gap-2">
                    {pass ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium text-sm">
                      Test {index + 1}
                    </span>
                    {test.executionTime && (
                      <div className="flex items-center gap-1 text-xs text-surface-500">
                        <Clock className="h-3 w-3" />
                        <span>{test.executionTime}ms</span>
                      </div>
                    )}
                    <span
                      className={`ml-auto text-xs rounded px-2 py-0.5 font-semibold ${
                        pass
                          ? "bg-green-200 text-green-900"
                          : "bg-red-200 text-red-900"
                      }`}
                    >
                      {pass ? "PASS" : "FAIL"}
                    </span>
                  </div>
                  {show && (
                    <div className="mt-2 text-xs space-y-1 animate-fadeIn">
                      <div>
                        <span className="font-medium">Input:</span>{" "}
                        {JSON.stringify(test.input)}
                      </div>
                      <div>
                        <span className="font-medium">Expected:</span>{" "}
                        {JSON.stringify(test.expected)}
                      </div>
                      {test.actual !== undefined && (
                        <div>
                          <span className="font-medium">Actual:</span>{" "}
                          {JSON.stringify(test.actual)}
                        </div>
                      )}
                      {test.error && (
                        <div className="text-red-700">
                          <span className="font-medium">Error:</span>{" "}
                          {test.error}
                        </div>
                      )}
                    </div>
                  )}
                  {!show && (
                    <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none -top-1 left-1/2 -translate-x-1/2 -translate-y-full bg-surface-900 text-white text-[10px] px-2 py-1 rounded shadow transition">
                      Click to {show ? "collapse" : "expand"} details
                    </div>
                  )}
                </div>
              );
            })}
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
        <div className="border border-surface-300 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-surface-900">AI Code Review</h4>
            {codeReview.score && (
              <div className="ml-auto">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                  Review Score: {codeReview.score}/100
                </span>
              </div>
            )}
          </div>

          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-surface-700">
              {codeReview.review}
            </div>
          </div>
        </div>
      )}

      {/* Basic Feedback (fallback) */}
      {feedback && !codeReview?.success && (
        <div className="border border-surface-300 rounded-lg p-4">
          <h4 className="font-semibold text-surface-900 mb-2">Feedback</h4>
          <div className="text-sm text-surface-700">{feedback}</div>
        </div>
      )}
    </div>
  );
};

export default CodeExecutionResults;
