import React, { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import UserProfileCard from "../components/profile/UserProfileCard";
import OnboardingModal from "../components/onboarding/OnboardingModal";
import { Settings, Bell, Shield, Eye, Trash2, Download } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const { userProfile, refreshProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState("profile");
  const [preferences, setPreferences] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.preferences) {
      setPreferences(userProfile.preferences);
    }
  }, [userProfile]);

  const handlePreferenceChange = async (section, field, value) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      [section]: {
        ...preferences[section],
        [field]: value,
      },
    };

    setPreferences(updatedPreferences);

    try {
      const response = await api.put("/users/profile", {
        preferences: updatedPreferences,
      });
      if (response.data && response.data.success) {
        // Refresh the profile context to sync the updated data
        await refreshProfile();
        toast.success("Preferences updated successfully");
      }
    } catch (error) {
      console.error("Error updating preferences:", error); // eslint-disable-line no-console
      // Revert the local state on error
      setPreferences(userProfile?.preferences || null);
      toast.error("Failed to save preferences. Please try again.");
    }
  };

  const handleNotificationChange = async (field, value) => {
    await handlePreferenceChange("notifications", field, value);
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/auth/account");
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mockmate-data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "data", label: "Data Management", icon: Download },
  ];

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center transition-colors duration-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            Settings
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-2">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="card p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700"
                          : "text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <UserProfileCard />

                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                    Onboarding
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    Retake the onboarding process to update your preferences and
                    goals.
                  </p>
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="btn-primary"
                  >
                    Restart Onboarding
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && preferences && (
              <div className="card p-6 transition-colors duration-200">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-6">
                  Notification Preferences
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50">
                        Email Notifications
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        Receive updates and reminders via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications?.email || false}
                        onChange={(e) =>
                          handleNotificationChange("email", e.target.checked)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          preferences.notifications?.email
                            ? "bg-primary-600"
                            : "bg-surface-200 dark:bg-surface-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white dark:bg-surface-100 rounded-full shadow transform transition-transform ${
                            preferences.notifications?.email
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50">
                        Push Notifications
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        Browser push notifications
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications?.push || false}
                        onChange={(e) =>
                          handleNotificationChange("push", e.target.checked)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          preferences.notifications?.push
                            ? "bg-primary-600"
                            : "bg-surface-200 dark:bg-surface-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white dark:bg-surface-100 rounded-full shadow transform transition-transform ${
                            preferences.notifications?.push
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50">
                        Interview Reminders
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        Get reminded about scheduled interviews
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications?.interviews || false}
                        onChange={(e) =>
                          handleNotificationChange(
                            "interviews",
                            e.target.checked
                          )
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          preferences.notifications?.interviews
                            ? "bg-primary-600"
                            : "bg-surface-200 dark:bg-surface-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white dark:bg-surface-100 rounded-full shadow transform transition-transform ${
                            preferences.notifications?.interviews
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50">
                        Progress Updates
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        Weekly progress summaries and insights
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications?.progress || false}
                        onChange={(e) =>
                          handleNotificationChange("progress", e.target.checked)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          preferences.notifications?.progress
                            ? "bg-primary-600"
                            : "bg-surface-200 dark:bg-surface-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white dark:bg-surface-100 rounded-full shadow transform transition-transform ${
                            preferences.notifications?.progress
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div className="card p-6 transition-colors duration-200">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-6">
                    Privacy & Security
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                        Account Security
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        Your account is secured through Clerk authentication
                        with industry-standard security measures.
                      </p>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2 text-green-600">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span className="text-sm">
                            Two-factor authentication available
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-green-600">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span className="text-sm">
                            Encrypted data storage
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                        Data Privacy
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        Your interview data and personal information are kept
                        private and secure.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-surface-400" />
                          <span className="text-sm text-surface-600 dark:text-surface-400">
                            Interview recordings are stored securely
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-surface-400" />
                          <span className="text-sm text-surface-600 dark:text-surface-400">
                            Personal data is never shared without consent
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                        Facial Expression Analysis
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        AI-powered analysis of your facial expressions and
                        delivery during interviews. All processing happens
                        locally in your browser.
                      </p>

                      <div className="space-y-4">
                        {/* Main Enable/Disable Toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-surface-800 dark:text-surface-200">
                              Enable Facial Analysis
                            </h5>
                            <p className="text-sm text-surface-600 dark:text-surface-400">
                              Analyze eye contact, expressions, and delivery for
                              confidence feedback
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                preferences.facialAnalysis?.enabled || false
                              }
                              onChange={(e) =>
                                handlePreferenceChange(
                                  "facialAnalysis",
                                  "enabled",
                                  e.target.checked
                                )
                              }
                              className="sr-only"
                            />
                            <div
                              className={`w-11 h-6 rounded-full transition-colors ${
                                preferences.facialAnalysis?.enabled
                                  ? "bg-primary-600"
                                  : "bg-surface-200 dark:bg-surface-700"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 bg-white dark:bg-surface-100 rounded-full shadow transform transition-transform ${
                                  preferences.facialAnalysis?.enabled
                                    ? "translate-x-5"
                                    : "translate-x-0"
                                }`}
                              ></div>
                            </div>
                          </label>
                        </div>

                        {preferences.facialAnalysis?.enabled && (
                          <div className="ml-4 space-y-3 border-l-2 border-primary-100 dark:border-primary-900/30 pl-4">
                            {/* Auto Calibration */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h6 className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                  Auto Calibration
                                </h6>
                                <p className="text-xs text-surface-600 dark:text-surface-400">
                                  Automatically run baseline calibration before
                                  interviews
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    preferences.facialAnalysis
                                      ?.autoCalibration !== false
                                  }
                                  onChange={(e) =>
                                    handlePreferenceChange(
                                      "facialAnalysis",
                                      "autoCalibration",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={`w-9 h-5 rounded-full transition-colors ${
                                    preferences.facialAnalysis
                                      ?.autoCalibration !== false
                                      ? "bg-primary-500"
                                      : "bg-surface-200 dark:bg-surface-700"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white dark:bg-surface-100 rounded-full shadow transform transition-transform ${
                                      preferences.facialAnalysis
                                        ?.autoCalibration !== false
                                        ? "translate-x-4"
                                        : "translate-x-0"
                                    }`}
                                  ></div>
                                </div>
                              </label>
                            </div>

                            {/* Show Confidence Meter */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h6 className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                  Confidence Meter
                                </h6>
                                <p className="text-xs text-surface-600 dark:text-surface-400">
                                  Display real-time confidence score during
                                  recording
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    preferences.facialAnalysis
                                      ?.showConfidenceMeter !== false
                                  }
                                  onChange={(e) =>
                                    handlePreferenceChange(
                                      "facialAnalysis",
                                      "showConfidenceMeter",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={`w-9 h-5 rounded-full transition-colors ${
                                    preferences.facialAnalysis
                                      ?.showConfidenceMeter !== false
                                      ? "bg-primary-500"
                                      : "bg-surface-200 dark:bg-surface-700"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white dark:bg-surface-100 rounded-full shadow transform transition-transform ${
                                      preferences.facialAnalysis
                                        ?.showConfidenceMeter !== false
                                        ? "translate-x-4"
                                        : "translate-x-0"
                                    }`}
                                  ></div>
                                </div>
                              </label>
                            </div>

                            {/* Real-time Feedback */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h6 className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                  Real-time Tips
                                </h6>
                                <p className="text-xs text-surface-600 dark:text-surface-400">
                                  Show delivery improvement tips during
                                  interviews
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    preferences.facialAnalysis
                                      ?.showRealtimeFeedback !== false
                                  }
                                  onChange={(e) =>
                                    handlePreferenceChange(
                                      "facialAnalysis",
                                      "showRealtimeFeedback",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={`w-9 h-5 rounded-full transition-colors ${
                                    preferences.facialAnalysis
                                      ?.showRealtimeFeedback !== false
                                      ? "bg-primary-500"
                                      : "bg-surface-200 dark:bg-surface-700"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white dark:bg-surface-100 rounded-full shadow transform transition-transform ${
                                      preferences.facialAnalysis
                                        ?.showRealtimeFeedback !== false
                                        ? "translate-x-4"
                                        : "translate-x-0"
                                    }`}
                                  ></div>
                                </div>
                              </label>
                            </div>

                            {/* Feedback Frequency */}
                            <div>
                              <h6 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Feedback Frequency
                              </h6>
                              <select
                                value={
                                  preferences.facialAnalysis
                                    ?.feedbackFrequency || "medium"
                                }
                                onChange={(e) =>
                                  handlePreferenceChange(
                                    "facialAnalysis",
                                    "feedbackFrequency",
                                    e.target.value
                                  )
                                }
                                className="form-select"
                              >
                                <option value="low">
                                  Low (Every 30 seconds)
                                </option>
                                <option value="medium">
                                  Medium (Every 15 seconds)
                                </option>
                                <option value="high">
                                  High (Every 10 seconds)
                                </option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Privacy Notice */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-green-800">
                              <p className="font-medium">Privacy Protected</p>
                              <p className="text-xs mt-1">
                                All facial analysis happens locally in your
                                browser. No video data is transmitted or stored
                                on our servers.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Consent Status */}
                        {preferences.facialAnalysis?.consentGiven && (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                              <span className="text-sm text-blue-800">
                                Consent given on{" "}
                                {new Date(
                                  preferences.facialAnalysis.consentDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                        Session Management
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        Manage your active sessions and sign out from other
                        devices.
                      </p>
                      <button className="btn-outline text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20">
                        Sign Out All Devices
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-6">
                <div className="card p-6 transition-colors duration-200">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-6">
                    Data Management
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                        Export Your Data
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        Download a copy of all your data including profile
                        information, interview history, and analytics.
                      </p>
                      <button
                        onClick={handleExportData}
                        disabled={loading}
                        className="btn-primary disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>{loading ? "Exporting..." : "Export Data"}</span>
                      </button>
                    </div>

                    <div className="border-t border-surface-200 dark:border-surface-700 pt-6">
                      <h4 className="font-medium mb-2 text-red-600">
                        Danger Zone
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        These actions are irreversible. Please be careful.
                      </p>

                      <div className="space-y-4">
                        <div className="border border-red-200 dark:border-red-800/50 rounded-lg p-4 bg-white dark:bg-surface-900/40">
                          <h5 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                            Delete All Interview Data
                          </h5>
                          <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                            This will permanently delete all your interview
                            recordings, results, and analytics.
                          </p>
                          <button className="btn-outline text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 flex items-center space-x-2">
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Interview Data</span>
                          </button>
                        </div>

                        <div className="border border-red-200 dark:border-red-800/50 rounded-lg p-4 bg-white dark:bg-surface-900/40">
                          <h5 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                            Delete Account
                          </h5>
                          <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                            This will permanently delete your account and all
                            associated data. This action cannot be undone.
                          </p>
                          <button className="btn-outline text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 flex items-center space-x-2">
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Account</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
};

export default SettingsPage;
