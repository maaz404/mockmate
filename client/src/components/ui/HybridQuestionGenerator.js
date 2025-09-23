import React, { useState } from "react";
import QuestionCard from "../ui/QuestionCard";
import { apiService } from "../../services/api";

const HybridQuestionGenerator = ({ onQuestionsGenerated }) => {
  const [config, setConfig] = useState({
    jobRole: "software-engineer",
    experienceLevel: "intermediate", 
    interviewType: "mixed",
    difficulty: "intermediate",
    questionCount: 10,
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);

  const jobRoles = [
    { value: "software-engineer", label: "Software Engineer" },
    { value: "frontend-developer", label: "Frontend Developer" },
    { value: "backend-developer", label: "Backend Developer" },
    { value: "fullstack-developer", label: "Full Stack Developer" },
    { value: "data-scientist", label: "Data Scientist" },
    { value: "devops-engineer", label: "DevOps Engineer" },
    { value: "product-manager", label: "Product Manager" },
  ];

  const experienceLevels = [
    { value: "beginner", label: "Beginner (0-2 years)" },
    { value: "intermediate", label: "Intermediate (3-5 years)" },
    { value: "advanced", label: "Advanced (6+ years)" },
  ];

  const interviewTypes = [
    { value: "technical", label: "Technical Only" },
    { value: "behavioral", label: "Behavioral Only" },
    { value: "mixed", label: "Mixed (Technical + Behavioral)" },
  ];

  const handleGenerateQuestions = async () => {
    setLoading(true);
    try {
      const response = await apiService.post("/questions/generate", { config });
      
      if (response.success) {
        setQuestions(response.data.questions);
        setMetadata(response.data.metadata);
        setShowQuestions(true);
        
        if (onQuestionsGenerated) {
          onQuestionsGenerated(response.data.questions);
        }
      } else {
        // console.error("Failed to generate questions:", response.message);
        alert("Failed to generate questions. Please try again.");
      }
    } catch (error) {
      // console.error("Error generating questions:", error);
      alert("An error occurred while generating questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Generate Interview Questions
        </h2>
        <p className="text-gray-600 mb-6">
          Configure your interview parameters to generate a mix of template-based and AI-generated questions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Job Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Role
            </label>
            <select
              value={config.jobRole}
              onChange={(e) => handleConfigChange("jobRole", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {jobRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              value={config.experienceLevel}
              onChange={(e) => handleConfigChange("experienceLevel", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {experienceLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Type
            </label>
            <select
              value={config.interviewType}
              onChange={(e) => handleConfigChange("interviewType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {interviewTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              min="5"
              max="20"
              value={config.questionCount}
              onChange={(e) => handleConfigChange("questionCount", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={handleGenerateQuestions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Questions...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Questions
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Questions Section */}
      {showQuestions && questions.length > 0 && (
        <div className="space-y-6">
          {/* Metadata Section */}
          {metadata && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Generation Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metadata.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-700 mb-2">Source Breakdown:</div>
                  <div className="space-y-1">
                    {Object.entries(metadata.sourceBreakdown).map(([source, count]) => (
                      <div key={source} className="text-xs">
                        <span className="font-medium">{source}:</span> {count} ({Math.round((count / metadata.totalQuestions) * 100)}%)
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-700 mb-2">Tag Coverage:</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {metadata.tagCoverage.slice(0, 5).map((tag, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                    {metadata.tagCoverage.length > 5 && (
                      <span className="text-xs text-gray-500">+{metadata.tagCoverage.length - 5} more</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Questions</h3>
            {questions.map((question, index) => (
              <QuestionCard
                key={question.id || index}
                question={question}
                index={index}
                total={questions.length}
                showTags={true}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setShowQuestions(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors duration-200"
            >
              Generate New Set
            </button>
            <button
              onClick={() => onQuestionsGenerated && onQuestionsGenerated(questions)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
            >
              Start Interview with These Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HybridQuestionGenerator;