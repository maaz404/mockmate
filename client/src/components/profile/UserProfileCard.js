import React, { useState, useEffect } from "react";
import StyledSelect from "../ui/StyledSelect";
import { useAuthContext } from "../../context/AuthContext";
import { Briefcase, Award, Camera, Edit3, Save, X } from "lucide-react";
import { apiService } from "../../services/api";
import AvatarUploader from "./AvatarUploader";
import ResumeUploader from "./ResumeUploader";

const UserProfileCard = () => {
  const { user, userProfile, updateProfile, loading } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        professionalInfo: {
          currentRole: userProfile.professionalInfo?.currentRole || "",
          company: userProfile.professionalInfo?.company || "",
          experience: userProfile.professionalInfo?.experience || "entry",
          industry: userProfile.professionalInfo?.industry || "",
          skills:
            userProfile.professionalInfo?.skills?.map((skill) =>
              typeof skill === "object" ? skill.name : skill
            ) || [],
          careerGoals: userProfile.professionalInfo?.careerGoals || "",
        },
      });
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.get("/users/stats");
        setStats(data?.data || data);
      } catch (error) {
        // Handle error silently
      }
    };

    if (userProfile) {
      fetchStats();
    }
  }, [userProfile]);

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [section, subField] = field.split(".");
      setEditForm((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subField]: value,
        },
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSkillsChange = (value) => {
    const skills = value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    setEditForm((prev) => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        skills,
      },
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userProfile) {
      setEditForm({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        professionalInfo: {
          currentRole: userProfile.professionalInfo?.currentRole || "",
          company: userProfile.professionalInfo?.company || "",
          experience: userProfile.professionalInfo?.experience || "entry",
          industry: userProfile.professionalInfo?.industry || "",
          skills:
            userProfile.professionalInfo?.skills?.map((skill) =>
              typeof skill === "object" ? skill.name : skill
            ) || [],
          careerGoals: userProfile.professionalInfo?.careerGoals || "",
        },
      });
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-surface-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-surface-200 rounded w-32"></div>
            <div className="h-3 bg-surface-200 rounded w-24"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-surface-200 rounded"></div>
          <div className="h-3 bg-surface-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={user?.profileImageUrl || "/api/placeholder/64/64"}
              alt="Profile"
              className="w-16 h-16 rounded-full border-2 border-surface-200"
            />
            <div className="absolute -bottom-1 -right-1">
              <AvatarUploader />
            </div>
          </div>
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="text-xl font-semibold bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="text-xl font-semibold bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500 ml-2"
                  placeholder="Last Name"
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-surface-900">
                  {userProfile.firstName} {userProfile.lastName}
                </h2>
                <p className="text-surface-600">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 bg-surface-700 text-white rounded-lg hover:bg-surface-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Professional Info */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <Briefcase className="h-5 w-5 text-primary-600" />
          <h3 className="font-medium text-surface-900">
            Professional Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Current Role
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.professionalInfo.currentRole}
                onChange={(e) =>
                  handleInputChange(
                    "professionalInfo.currentRole",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Software Engineer"
              />
            ) : (
              <p className="text-surface-900">
                {userProfile.professionalInfo?.currentRole || "Not specified"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Company
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.professionalInfo.company}
                onChange={(e) =>
                  handleInputChange("professionalInfo.company", e.target.value)
                }
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Google"
              />
            ) : (
              <p className="text-surface-900">
                {userProfile.professionalInfo?.company || "Not specified"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Experience
            </label>
            {isEditing ? (
              <StyledSelect
                value={editForm.professionalInfo.experience}
                onChange={(e) =>
                  handleInputChange(
                    "professionalInfo.experience",
                    e.target.value
                  )
                }
                size="sm"
                ariaLabel="Experience level"
              >
                <option value="entry">Entry (0-2y)</option>
                <option value="junior">Junior (2-4y)</option>
                <option value="mid">Mid (4-7y)</option>
                <option value="senior">Senior (7+y)</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </StyledSelect>
            ) : (
              <p className="text-surface-900">
                {userProfile.professionalInfo?.experience || "Not specified"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Industry
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.professionalInfo.industry}
                onChange={(e) =>
                  handleInputChange("professionalInfo.industry", e.target.value)
                }
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Technology"
              />
            ) : (
              <p className="text-surface-900">
                {userProfile.professionalInfo?.industry || "Not specified"}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Skills
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.professionalInfo.skills.join(", ")}
              onChange={(e) => handleSkillsChange(e.target.value)}
              className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., React, Python, Leadership (comma separated)"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {userProfile.professionalInfo?.skills?.length > 0 ? (
                userProfile.professionalInfo.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {typeof skill === "object" ? skill.name : skill}
                  </span>
                ))
              ) : (
                <p className="text-surface-500">No skills added</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Career Goals
          </label>
          {isEditing ? (
            <textarea
              value={editForm.professionalInfo.careerGoals}
              onChange={(e) =>
                handleInputChange(
                  "professionalInfo.careerGoals",
                  e.target.value
                )
              }
              rows={3}
              className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe your career aspirations..."
            />
          ) : (
            <p className="text-surface-900">
              {userProfile.professionalInfo?.careerGoals || "Not specified"}
            </p>
          )}
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="mt-6 pt-6 border-t border-surface-200">
          <div className="flex items-center space-x-2 mb-3">
            <Award className="h-5 w-5 text-primary-600" />
            <h3 className="font-medium text-surface-900">Statistics</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {stats.analytics?.totalInterviews || 0}
              </p>
              <p className="text-sm text-surface-600">Total Interviews</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.analytics?.averageScore || 0}%
              </p>
              <p className="text-sm text-surface-600">Avg Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {stats.analytics?.streak?.current || 0}
              </p>
              <p className="text-sm text-surface-600">Current Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-600">
                {stats.analytics?.streak?.longest || 0}
              </p>
              <p className="text-sm text-surface-600">Best Streak</p>
            </div>
          </div>
        </div>
      )}

      {/* Media Section */}
      <div className="mt-6 pt-6 border-t border-surface-200">
        <h3 className="font-medium text-surface-900 mb-2 flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary-600" /> Media
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-surface-600 mb-1">Update Avatar</p>
            <AvatarUploader />
          </div>
          <div>
            <p className="text-sm text-surface-600 mb-1">Upload Resume (PDF)</p>
            <ResumeUploader />
          </div>
        </div>
      </div>

      {/* Profile Completeness */}
      <div className="mt-6 pt-6 border-t border-surface-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-surface-700">
            Profile Completeness
          </span>
          <span className="text-sm text-surface-600">
            {userProfile.profileCompleteness || 0}%
          </span>
        </div>
        <div className="w-full bg-surface-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${userProfile.profileCompleteness || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
