import React from "react";

const FollowUpQuestions = ({
  followUpQuestions,
  loading,
  onGenerate,
  hasAnswer,
  isVisible,
}) => {
  if (!hasAnswer) {
    return (
      <div className="bg-surface-50 border border-surface-200 rounded-lg p-4">
        <p className="text-sm text-surface-600">
          💡 Complete your answer above to generate follow-up questions that
          might be asked based on your response.
        </p>
      </div>
    );
  }

  if (!isVisible) {
    return (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-surface-900">
          Follow-up Questions
        </h3>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            "Generate Follow-ups"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-surface-900 mb-4">
        Follow-up Questions
      </h3>

      {followUpQuestions && followUpQuestions.length > 0 ? (
        <>
          <div className="space-y-4">
            {followUpQuestions.map((followUp, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-medium">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="text-surface-900 font-medium">
                    {followUp.text}
                  </p>
                  {followUp.type && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                      {followUp.type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-primary-100 rounded-lg">
            <p className="text-sm text-primary-800">
              💡 These follow-up questions are designed to help you think deeper
              about your answer. Consider how you might respond to these in a
              real interview.
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-surface-600">
            No follow-up questions were generated for this answer.
          </p>
        </div>
      )}
    </div>
  );
};

export default FollowUpQuestions;
