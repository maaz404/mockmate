import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiService } from "../../services/api";

const OnboardingModal = ({ isOpen, onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [languageInput, setLanguageInput] = useState("");
  const modalRef = useRef(null);
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

  // Prevent closing with Escape key unintentionally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        // Block default ESC close behavior while modal is open
        e.preventDefault();
        e.stopPropagation();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
      // Prevent background scroll
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

    const loadingToast = toast.loading("Saving your preferences...");

    try {
      // Log the data being sent for debugging
      // eslint-disable-next-line no-console
      console.log("Submitting onboarding data:", formData);

      // apiService.post returns already-unwrapped data
      const result = await apiService.post(
        "/users/onboarding/complete",
        formData
      );

      // eslint-disable-next-line no-console
      console.log("Onboarding response:", result);

      toast.success("Profile setup completed successfully!", {
        id: loadingToast,
      });

      // Call onComplete with the server result (fallback to local form data)
      onComplete?.(result?.data || formData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Onboarding submission failed:", error);

      // Show detailed error message from server if available
      let errorMessage = "Failed to save preferences. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        // Handle validation errors with details
        const details = error.response.data.details;
        const detailMessages = Object.values(details).filter(Boolean);
        if (detailMessages.length > 0) {
          errorMessage = detailMessages.join(", ");
        }
      } else if (error.message && !error.message.includes('Request failed')) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });

      // Don't close the modal on error
      return;
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (currentStep === 1) {
      const { currentRole, industry } = formData.professionalInfo;
      if (!currentRole.trim() || !industry.trim()) {
        toast.error("Please provide your current role and industry");
        return false;
      }
    }

    if (currentStep === 2) {
      const { skills, targetRoles } = formData.professionalInfo;
      if (skills.length === 0 || targetRoles.length === 0) {
        toast.error("Please add at least one skill and target role");
        return false;
      }
    }

    if (currentStep === 3) {
      const { interviewTypes } = formData.preferences;
      if (interviewTypes.length === 0) {
        toast.error("Please select at least one interview type");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateForm()) {
      return;
    }

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
    <div className="fixed inset-0 bg-surface-900/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl border border-surface-200 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 bg-surface-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-surface-900">
                Welcome to MockMate! 🎯
              </h2>
              <p className="text-sm text-surface-600 mt-1">
                Let's personalize your interview experience
              </p>
            </div>
            <div className="text-sm text-surface-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-surface-200 rounded-full h-2">
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
                <h3 className="text-lg font-medium text-surface-900 mb-4">
                  Tell us about your professional background
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700">
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
                      className="mt-1 block w-full border border-surface-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Software Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700">
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
                      className="mt-1 block w-full border border-surface-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-surface-700">
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
                      className="mt-1 block w-full border border-surface-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Technology, Finance, Healthcare"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700">
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
                      className="mt-1 block w-full border border-surface-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <h3 className="text-lg font-medium text-surface-900 mb-4">
                  What are your skills and target roles?
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700">
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
                      className="mt-1 block w-full border border-surface-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="e.g., JavaScript, React, Node.js, Python, AWS, Leadership"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700">
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
                      className="mt-1 block w-full border border-surface-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <h3 className="text-lg font-medium text-surface-900 mb-4">
                  Interview preferences
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Interview Types */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-3">
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
                                  Array.from(new Set([...types, type]))
                                );
                              } else {
                                handleInputChange(
                                  "preferences",
                                  "interviewTypes",
                                  types.filter((t) => t !== type)
                                );
                              }
                            }}
                            className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-surface-700 capitalize">
                            {type.replace("-", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Segmented Control */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Preferred Difficulty
                    </label>
                    <div className="flex rounded-lg overflow-hidden border border-surface-300">
                      {["beginner", "intermediate", "advanced"].map((level) => (
                        <button
                          type="button"
                          key={level}
                          onClick={() =>
                            handleInputChange(
                              "preferences",
                              "difficulty",
                              level
                            )
                          }
                          className={`flex-1 px-3 py-2 text-sm ${
                            formData.preferences.difficulty === level
                              ? "bg-blue-600 text-white"
                              : "bg-white text-surface-700 hover:bg-surface-50"
                          } transition-colors`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Languages chips */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Preferred Languages
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.preferences.preferredLanguages.map(
                        (lang, idx) => (
                          <span
                            key={`${lang}-${idx}`}
                            className="inline-flex items-center gap-2 px-2 py-1 bg-surface-100 text-surface-800 rounded-full text-sm border border-surface-300"
                          >
                            {lang}
                            <button
                              type="button"
                              className="text-surface-500 hover:text-red-600"
                              onClick={() =>
                                handleInputChange(
                                  "preferences",
                                  "preferredLanguages",
                                  formData.preferences.preferredLanguages.filter(
                                    (l) => l !== lang
                                  )
                                )
                              }
                            >
                              ×
                            </button>
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={languageInput}
                        onChange={(e) => setLanguageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            (e.key === "Enter" || e.key === ",") &&
                            languageInput.trim()
                          ) {
                            e.preventDefault();
                            const next = Array.from(
                              new Set([
                                ...formData.preferences.preferredLanguages,
                                languageInput.trim(),
                              ])
                            );
                            handleInputChange(
                              "preferences",
                              "preferredLanguages",
                              next
                            );
                            setLanguageInput("");
                          }
                        }}
                        className="flex-1 border border-surface-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add a language and press Enter"
                      />
                      <button
                        type="button"
                        className="btn-primary px-4"
                        onClick={() => {
                          if (!languageInput.trim()) return;
                          const next = Array.from(
                            new Set([
                              ...formData.preferences.preferredLanguages,
                              languageInput.trim(),
                            ])
                          );
                          handleInputChange(
                            "preferences",
                            "preferredLanguages",
                            next
                          );
                          setLanguageInput("");
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Duration slider */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Preferred Session Duration:{" "}
                      <span className="font-semibold">
                        {formData.preferences.sessionDuration} min
                      </span>
                    </label>
                    <input
                      type="range"
                      min={15}
                      max={120}
                      step={15}
                      value={formData.preferences.sessionDuration}
                      onChange={(e) =>
                        handleInputChange(
                          "preferences",
                          "sessionDuration",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-surface-500 mt-1">
                      <span>15</span>
                      <span>30</span>
                      <span>45</span>
                      <span>60</span>
                      <span>75</span>
                      <span>90</span>
                      <span>105</span>
                      <span>120</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 rounded-b-2xl flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-surface-500 hover:text-surface-700 disabled:opacity-50"
          >
            Skip for now
          </button>

          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-surface-300 rounded-md text-surface-700 hover:bg-surface-50"
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
