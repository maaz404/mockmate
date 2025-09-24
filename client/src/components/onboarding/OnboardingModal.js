import React, { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { X, User, Briefcase, Target, Settings } from "lucide-react";
import toast from "react-hot-toast";

const OnboardingModal = ({ isOpen, onClose }) => {
  const { refreshProfile } = useAuthContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    professionalInfo: {
      currentRole: "",
      company: "",
      experience: "",
      skills: [],
      industry: "",
      careerGoals: "",
    },
    preferences: {
      interviewTypes: [],
      difficulty: "intermediate",
      focusAreas: [],
      notifications: {
        email: true,
        push: true,
        interviews: true,
        progress: true,
      },
    },
  });

  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Manufacturing",
    "Consulting",
    "Retail",
    "Media",
    "Government",
    "Nonprofit",
    "Other",
  ];

  const interviewTypes = [
    "Technical",
    "Behavioral",
    "System Design",
    "Case Study",
    "Leadership",
    "Sales",
  ];

  const focusAreas = [
    "Problem Solving",
    "Communication",
    "Leadership",
    "Technical Skills",
    "Industry Knowledge",
    "Presentation Skills",
  ];

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleArrayToggle = (section, field, value) => {
    setFormData((prev) => {
      const currentArray = prev[section][field];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];

      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray,
        },
      };
    });
  };

  const handleNotificationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [field]: value,
        },
      },
    }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    // Validate required fields before submission
    const { currentRole, industry } = formData.professionalInfo;
    const { interviewTypes } = formData.preferences;

    if (!currentRole.trim()) {
      toast.error("Please provide your current role");
      return;
    }

    if (!industry.trim()) {
      toast.error("Please select your industry");
      return;
    }

    if (!interviewTypes || interviewTypes.length === 0) {
      toast.error("Please select at least one interview type");
      return;
    }

    setLoading(true);
    try {
      // console.log("Submitting onboarding data:", formData); // eslint-disable-line no-console

      const response = await api.post("/users/onboarding/complete", formData);

      // console.log("Onboarding response:", response); // eslint-disable-line no-console

      if (response.data && response.data.success) {
        await refreshProfile();
        onClose();
        toast.success("Profile setup completed successfully!");
      } else {
        throw new Error(response.data?.message || "Failed to complete setup");
      }
    } catch (error) {
      console.error("Onboarding completion failed:", error); // eslint-disable-line no-console

      // Show detailed error message from server if available
      let errorMessage = "Failed to complete setup. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        // Handle validation errors with details
        const details = error.response.data.details;
        const detailMessages = Object.values(details).filter(Boolean);
        if (detailMessages.length > 0) {
          errorMessage = detailMessages.join(", ");
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Professional Information
        </h3>
        <p className="text-gray-600 dark:text-surface-400">
          Tell us about your professional background
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
            Job Title
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="e.g., Software Engineer, Product Manager"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
            Company
          </label>
          <input
            type="text"
            value={formData.professionalInfo.company}
            onChange={(e) =>
              handleInputChange("professionalInfo", "company", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="e.g., Google, Microsoft, Startup"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
            Years of Experience
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          >
            <option value="">Select experience level</option>
            <option value="0-1">0-1 years</option>
            <option value="2-3">2-3 years</option>
            <option value="4-6">4-6 years</option>
            <option value="7-10">7-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
            Industry
          </label>
          <select
            value={formData.professionalInfo.industry}
            onChange={(e) =>
              handleInputChange("professionalInfo", "industry", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          >
            <option value="">Select industry</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Briefcase className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Skills & Goals
        </h3>
        <p className="text-gray-600 dark:text-surface-400">
          What skills do you want to improve?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
            Key Skills (comma separated)
          </label>
          <input
            type="text"
            value={formData.professionalInfo.skills.join(", ")}
            onChange={(e) =>
              handleInputChange(
                "professionalInfo",
                "skills",
                e.target.value.split(", ").filter(Boolean)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="e.g., React, Python, Leadership, Communication"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
            Career Goals
          </label>
          <textarea
            value={formData.professionalInfo.careerGoals}
            onChange={(e) =>
              handleInputChange(
                "professionalInfo",
                "careerGoals",
                e.target.value
              )
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="Describe your career aspirations and what you want to achieve..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Target className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Interview Preferences
        </h3>
        <p className="text-gray-600 dark:text-surface-400">
          Customize your interview practice
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-3">
            Interview Types (select multiple)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {interviewTypes.map((type) => (
              <label
                key={type}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.preferences.interviewTypes.includes(type)}
                  onChange={() =>
                    handleArrayToggle("preferences", "interviewTypes", type)
                  }
                  className="rounded border-gray-300 dark:border-surface-600 text-primary-600 bg-white dark:bg-surface-700 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-surface-300">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
            Difficulty Level
          </label>
          <select
            value={formData.preferences.difficulty}
            onChange={(e) =>
              handleInputChange("preferences", "difficulty", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-3">
            Focus Areas (select multiple)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {focusAreas.map((area) => (
              <label
                key={area}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.preferences.focusAreas.includes(area)}
                  onChange={() =>
                    handleArrayToggle("preferences", "focusAreas", area)
                  }
                  className="rounded border-gray-300 dark:border-surface-600 text-primary-600 bg-white dark:bg-surface-700 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-surface-300">
                  {area}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Settings className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Notification Preferences
        </h3>
        <p className="text-gray-600 dark:text-surface-400">
          Choose how you want to stay updated
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Email Notifications
            </p>
            <p className="text-sm text-gray-600 dark:text-surface-400">
              Receive updates via email
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.preferences.notifications.email}
              onChange={(e) =>
                handleNotificationChange("email", e.target.checked)
              }
              className="sr-only"
            />
            <div
              className={`w-11 h-6 bg-gray-200 dark:bg-surface-600 rounded-full peer ${
                formData.preferences.notifications.email
                  ? "peer-checked:bg-primary-600"
                  : ""
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.preferences.notifications.email
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              ></div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Push Notifications
            </p>
            <p className="text-sm text-gray-600 dark:text-surface-400">
              Browser notifications
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.preferences.notifications.push}
              onChange={(e) =>
                handleNotificationChange("push", e.target.checked)
              }
              className="sr-only"
            />
            <div
              className={`w-11 h-6 bg-gray-200 dark:bg-surface-600 rounded-full peer ${
                formData.preferences.notifications.push
                  ? "peer-checked:bg-primary-600"
                  : ""
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.preferences.notifications.push
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              ></div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Interview Reminders
            </p>
            <p className="text-sm text-gray-600 dark:text-surface-400">
              Get reminded about scheduled interviews
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.preferences.notifications.interviews}
              onChange={(e) =>
                handleNotificationChange("interviews", e.target.checked)
              }
              className="sr-only"
            />
            <div
              className={`w-11 h-6 bg-gray-200 dark:bg-surface-600 rounded-full peer ${
                formData.preferences.notifications.interviews
                  ? "peer-checked:bg-primary-600"
                  : ""
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.preferences.notifications.interviews
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              ></div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Progress Updates
            </p>
            <p className="text-sm text-gray-600 dark:text-surface-400">
              Weekly progress summaries
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.preferences.notifications.progress}
              onChange={(e) =>
                handleNotificationChange("progress", e.target.checked)
              }
              className="sr-only"
            />
            <div
              className={`w-11 h-6 bg-gray-200 dark:bg-surface-600 rounded-full peer ${
                formData.preferences.notifications.progress
                  ? "peer-checked:bg-primary-600"
                  : ""
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.preferences.notifications.progress
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              ></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to MockMate!
              </h2>
              <p className="text-gray-600 dark:text-surface-400">
                Step {step} of 4
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-surface-500 hover:text-gray-600 dark:hover:text-surface-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s <= step
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-surface-600 text-gray-600 dark:text-surface-400"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-200 dark:bg-surface-600 rounded-full">
              <div
                className="h-2 bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-surface-600">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                step === 1
                  ? "bg-gray-100 dark:bg-surface-700 text-gray-400 dark:text-surface-500 cursor-not-allowed"
                  : "bg-gray-100 dark:bg-surface-700 text-gray-700 dark:text-surface-300 hover:bg-gray-200 dark:hover:bg-surface-600"
              }`}
            >
              Previous
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Completing..." : "Complete Setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
