import React, { useState } from "react";
import { apiService } from "../../services/api";

const OnboardingModal = ({ isOpen, onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    professionalInfo: {
      currentRole: "",
      experience: "entry",
      industry: "",
      company: "",
      targetRoles: [],
      skills: [],
    },
    preferences: {
      preferredLanguages: ["English"],
      interviewTypes: ["technical", "behavioral"],
      difficulty: "beginner",
      sessionDuration: 30,
    },
  });

  const totalSteps = 3;

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleArrayInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiService.post("/users/onboarding", formData);
      onComplete(formData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Onboarding error:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome to MockMate! 🎯
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Let's personalize your interview experience
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Tell us about your professional background
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Current Role
                    </label>
                    <input
                      type="text"
                      value={formData.professionalInfo.currentRole}
                      onChange={(e) =>
                        handleInputChange(
                          "professionalInfo",
                          "currentRole",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Software Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Experience Level
                    </label>
                    <select
                      value={formData.professionalInfo.experience}
                      onChange={(e) =>
                        handleInputChange(
                          "professionalInfo",
                          "experience",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="junior">Junior (2-4 years)</option>
                      <option value="mid">Mid Level (4-7 years)</option>
                      <option value="senior">Senior (7+ years)</option>
                      <option value="lead">Lead/Principal (10+ years)</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={formData.professionalInfo.industry}
                      onChange={(e) =>
                        handleInputChange(
                          "professionalInfo",
                          "industry",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Technology, Finance, Healthcare"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Current Company
                    </label>
                    <input
                      type="text"
                      value={formData.professionalInfo.company}
                      onChange={(e) =>
                        handleInputChange(
                          "professionalInfo",
                          "company",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  What are your skills and target roles?
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Skills (comma separated)
                    </label>
                    <textarea
                      value={formData.professionalInfo.skills.join(", ")}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "professionalInfo",
                          "skills",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="e.g., JavaScript, React, Node.js, Python, AWS, Leadership"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Target Roles (comma separated)
                    </label>
                    <textarea
                      value={formData.professionalInfo.targetRoles.join(", ")}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "professionalInfo",
                          "targetRoles",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="e.g., Senior Developer, Tech Lead, Product Manager"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Interview preferences
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Interview Types (select all that apply)
                    </label>
                    <div className="space-y-2">
                      {[
                        "technical",
                        "behavioral",
                        "system-design",
                        "case-study",
                      ].map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.preferences.interviewTypes.includes(
                              type
                            )}
                            onChange={(e) => {
                              const types = formData.preferences.interviewTypes;
                              if (e.target.checked) {
                                handleInputChange(
                                  "preferences",
                                  "interviewTypes",
                                  [...types, type]
                                );
                              } else {
                                handleInputChange(
                                  "preferences",
                                  "interviewTypes",
                                  types.filter((t) => t !== type)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {type.replace("-", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Preferred Difficulty
                    </label>
                    <select
                      value={formData.preferences.difficulty}
                      onChange={(e) =>
                        handleInputChange(
                          "preferences",
                          "difficulty",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Preferred Session Duration
                    </label>
                    <select
                      value={formData.preferences.sessionDuration}
                      onChange={(e) =>
                        handleInputChange(
                          "preferences",
                          "sessionDuration",
                          parseInt(e.target.value)
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip for now
          </button>

          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : currentStep === totalSteps
                ? "Complete Setup"
                : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
