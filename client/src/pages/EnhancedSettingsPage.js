import React, { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import UserProfileCard from "../components/profile/UserProfileCard";
import EnhancedOnboardingModal from "../components/onboarding/EnhancedOnboardingModal";
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
      const response = await api.put("/users/profile", { preferences: updatedPreferences });
      if (response.data && response.data.success) {
        // Refresh the profile context to sync the updated data
        await refreshProfile();
        toast.success("Preferences updated successfully");
      }
    } catch (error) {
      console.error("Error updating preferences:", error); // eslint-disable-line no-console
      // Revert the local state on error
      setPreferences(userProfile.preferences);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-50"
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

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Onboarding
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Retake the onboarding process to update your preferences and
                    goals.
                  </p>
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Restart Onboarding
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && preferences && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Notification Preferences
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Email Notifications
                      </h4>
                      <p className="text-sm text-gray-600">
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
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
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
                      <h4 className="font-medium text-gray-900">
                        Push Notifications
                      </h4>
                      <p className="text-sm text-gray-600">
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
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
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
                      <h4 className="font-medium text-gray-900">
                        Interview Reminders
                      </h4>
                      <p className="text-sm text-gray-600">
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
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
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
                      <h4 className="font-medium text-gray-900">
                        Progress Updates
                      </h4>
                      <p className="text-sm text-gray-600">
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
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
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
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Privacy & Security
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Account Security
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
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
                      <h4 className="font-medium text-gray-900 mb-2">
                        Data Privacy
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Your interview data and personal information are kept
                        private and secure.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Interview recordings are stored securely
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Personal data is never shared without consent
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Session Management
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage your active sessions and sign out from other
                        devices.
                      </p>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Sign Out All Devices
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Data Management
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Export Your Data
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Download a copy of all your data including profile
                        information, interview history, and analytics.
                      </p>
                      <button
                        onClick={handleExportData}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>{loading ? "Exporting..." : "Export Data"}</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-medium text-gray-900 mb-2 text-red-600">
                        Danger Zone
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        These actions are irreversible. Please be careful.
                      </p>

                      <div className="space-y-4">
                        <div className="border border-red-200 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Delete All Interview Data
                          </h5>
                          <p className="text-sm text-gray-600 mb-3">
                            This will permanently delete all your interview
                            recordings, results, and analytics.
                          </p>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Interview Data</span>
                          </button>
                        </div>

                        <div className="border border-red-200 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Delete Account
                          </h5>
                          <p className="text-sm text-gray-600 mb-3">
                            This will permanently delete your account and all
                            associated data. This action cannot be undone.
                          </p>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
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
      <EnhancedOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
};

export default SettingsPage;
