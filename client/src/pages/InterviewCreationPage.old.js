import React, { useState, useEffect } from "react";
import StyledSelect from "../components/ui/StyledSelect";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";
import { apiService } from "../services/api";
import { IT_JOB_ROLES, EXPERIENCE_LEVELS, getRoleById, getRolesByCategory, getCategories } from "../data/itRoles";
import { INTERVIEW_TYPES, getRecommendedTypes } from "../data/interviewTypes";
import { TECHNOLOGY_CATEGORIES, getTechnologiesByCategory } from "../data/technologies";
import { FOCUS_AREA_CATEGORIES, getFocusAreasByCategory } from "../data/focusAreas";

const InterviewCreationPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();
  const [formData, setFormData] = useState({
    // IT-specific fields
    role: "", // Role ID from itRoles.js
    roleCategory: "",
    experienceLevel: "mid",
    interviewType: "mixed",
    technologies: [], // Array of technology IDs
    focusAreas: [], // Array of focus area IDs
    
    // Legacy/compatibility fields
    jobRole: "", // Will be populated from role label
    skills: [],
    
    // Interview settings
    duration: 45,
    difficulty: "medium",
    adaptiveDifficultyEnabled: true,
    videoAnswersEnabled: true,
    
    // Coding challenges
    includeCodingChallenges: false,
    codingChallengeCount: 2,
    codingDifficulty: "mixed",
    codingLanguage: "javascript",
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(""); // For filtering roles by category
  const [recommendedInterviewTypes, setRecommendedInterviewTypes] = useState(INTERVIEW_TYPES);

  // Dynamic role filtering based on category
  const filteredRoles = selectedCategory 
    ? getRolesByCategory(selectedCategory)
    : IT_JOB_ROLES;

  // Helper to update recommended interview types when role changes
  const updateRecommendedTypes = (roleId, experienceLevel) => {
    const role = getRoleById(roleId);
    if (role) {
      const recommended = getRecommendedTypes(role.label, experienceLevel);
      setRecommendedInterviewTypes(recommended.length > 0 ? recommended : INTERVIEW_TYPES);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchUserProfile();
    }
  }, [loading, user]);

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.get("/users/profile");
      if (response.success) {
        // Pre-populate with user's profile data
        setFormData((prev) => ({
          ...prev,
          jobRole: response.data.jobRole || "",
          experienceLevel: response.data.experienceLevel || "intermediate",
          skills: response.data.skills?.map((skill) => skill.name) || [],
        }));
      }
    } catch (error) {
      // Silently handle error - user profile is optional
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e) => {
    const roleId = e.target.value;
    const role = getRoleById(roleId);
    
    if (role) {
      setFormData((prev) => ({
        ...prev,
        role: roleId,
        roleCategory: role.category,
        jobRole: role.label, // Legacy compatibility
        technologies: [], // Reset technologies for new selection
      }));
      
      // Update recommended interview types
      updateRecommendedTypes(roleId, formData.experienceLevel);
    }
  };

  const handleExperienceLevelChange = (e) => {
    const experienceLevel = e.target.value;
    setFormData((prev) => ({
      ...prev,
      experienceLevel,
    }));
    
    // Update recommended interview types if role is selected
    if (formData.role) {
      updateRecommendedTypes(formData.role, experienceLevel);
    }
  };

  const handleTechnologyToggle = (techId) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.includes(techId)
        ? prev.technologies.filter((t) => t !== techId)
        : [...prev.technologies, techId],
    }));
  };

  const handleFocusAreaToggle = (areaId) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(areaId)
        ? prev.focusAreas.filter((a) => a !== areaId)
        : [...prev.focusAreas, areaId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDataLoading(true);

    try {
      // Map client values to server expected values
      const experienceLevelMapping = {
        intern: "intern",
        entry: "entry",
        junior: "junior",
        mid: "mid",
        senior: "senior",
        staff: "staff",
        principal: "principal",
      };

      const difficultyMapping = {
        easy: "easy",
        medium: "medium",
        hard: "hard",
        mixed: "medium",
      };

      // Create interview with IT-specific fields
      const response = await apiService.post("/interviews", {
        config: {
          jobRole: formData.jobRole || "IT Professional", // Fallback
          experienceLevel:
            experienceLevelMapping[formData.experienceLevel] ||
            formData.experienceLevel,
          interviewType: formData.interviewType,
          difficulty:
            difficultyMapping[formData.difficulty] || formData.difficulty,
          duration: formData.duration,
          questionCount: Math.floor(formData.duration / 3), // Roughly 3 minutes per question
          adaptiveDifficulty: { enabled: !!formData.adaptiveDifficultyEnabled },
          videoAnswersEnabled: formData.videoAnswersEnabled,
          
          // IT-specific fields
          role: formData.role,
          roleCategory: formData.roleCategory,
          technologies: formData.technologies,
          focusAreas: formData.focusAreas,
          
          // Coding challenges
          coding: formData.includeCodingChallenges
            ? {
                challengeCount: formData.codingChallengeCount,
                difficulty: formData.codingDifficulty,
                language: formData.codingLanguage,
              }
            : undefined,
        },
      });

      if (response.success) {
        // Redirect to the interview
        navigate(`/interview/${response.data._id}/experience`);
      }
    } catch (error) {
      // Surface server message if available for easier debugging
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create interview. Please try again.";
      // eslint-disable-next-line no-console
      console.error("Create interview failed:", {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      alert(serverMsg);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-surface-800/60 backdrop-blur-sm rounded-xl shadow-lg dark:shadow-surface-lg border border-surface-200 dark:border-surface-700">
          {/* Header */}
          <div className="px-8 py-6 border-b border-surface-200 dark:border-surface-700">
            <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
              Create New Interview
            </h1>
            <p className="text-surface-600 dark:text-surface-300 mt-2">
              Customize your interview practice session based on your goals and
              preferences.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Job Role Category & Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="roleCategory"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  Role Category
                </label>
                <StyledSelect
                  id="roleCategory"
                  name="roleCategory"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setFormData((prev) => ({ ...prev, role: "", jobRole: "" }));
                  }}
                  ariaLabel="Role category"
                >
                  <option value="">All Categories</option>
                  {getCategories().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </StyledSelect>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  IT Job Role <span className="text-red-500">*</span>
                </label>
                <StyledSelect
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  ariaLabel="IT job role"
                  required
                >
                  <option value="">Select a role...</option>
                  {filteredRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </StyledSelect>
                {formData.role && getRoleById(formData.role)?.description && (
                  <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                    {getRoleById(formData.role).description}
                  </p>
                )}
              </div>
            </div>

            {/* Experience Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="experienceLevel"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  Experience Level
                </label>
                <StyledSelect
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleExperienceLevelChange}
                  ariaLabel="Experience level"
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label} ({level.years})
                    </option>
                  ))}
                </StyledSelect>
              </div>

              {/* Salary Expectation (Optional, shown if role selected) */}
              {formData.role && getRoleById(formData.role)?.salary && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Salary Range (for context)
                  </label>
                  <div className="px-4 py-3 bg-surface-50 dark:bg-surface-700/30 border border-surface-300 dark:border-surface-600 rounded-lg text-sm text-surface-700 dark:text-surface-300">
                    {getRoleById(formData.role).salary[formData.experienceLevel] || "N/A"}
                  </div>
                </div>
              )}
            </div>

            {/* Adaptive Difficulty */}
            <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.adaptiveDifficultyEnabled}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      adaptiveDifficultyEnabled:
                        !prev.adaptiveDifficultyEnabled,
                    }))
                  }
                  className="mt-1 text-primary-500 bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                />
                <span>
                  <span className="block font-medium text-surface-900 dark:text-surface-50">
                    Adaptive Difficulty
                  </span>
                  <span className="block text-sm text-surface-600 dark:text-surface-400">
                    Adjusts the difficulty of upcoming questions based on your
                    performance. Starts at the selected difficulty and adapts
                    each question.
                  </span>
                </span>
              </label>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-4">
                Interview Type
                {recommendedInterviewTypes.length < INTERVIEW_TYPES.length && (
                  <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">
                    (Showing recommended for your role)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedInterviewTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.interviewType === type.id
                        ? "border-primary-500 bg-primary-500/10 ring-2 ring-primary-500/50"
                        : "border-surface-300 dark:border-surface-600 hover:border-surface-400 dark:hover:border-surface-500 bg-surface-50 dark:bg-surface-700/30"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        interviewType: type.id,
                      }))
                    }
                  >
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">{type.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={type.id}
                            checked={formData.interviewType === type.id}
                            onChange={() => {}}
                            className="text-primary-500 bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                          />
                          <h4 className="font-medium text-surface-900 dark:text-surface-50">
                            {type.name}
                          </h4>
                        </div>
                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 ml-6">
                          {type.description}
                        </p>
                        <div className="mt-2 ml-6 text-xs text-surface-500 dark:text-surface-400">
                          Duration: {type.duration.default} min
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coding Challenges Opt-In */}
            <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.includeCodingChallenges}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      includeCodingChallenges: !prev.includeCodingChallenges,
                    }))
                  }
                  className="mt-1 text-primary-500 bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                />
                <span>
                  <span className="block font-medium text-surface-900 dark:text-surface-50">
                    Include Coding Challenges
                  </span>
                  <span className="block text-sm text-surface-600 dark:text-surface-400">
                    Adds hands-on coding problems during the interview session.
                  </span>
                </span>
              </div>
              {formData.includeCodingChallenges && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                      Challenge Count
                    </label>
                    <select
                      value={formData.codingChallengeCount}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          codingChallengeCount: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-sm"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                      Coding Difficulty
                    </label>
                    <select
                      value={formData.codingDifficulty}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          codingDifficulty: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-sm"
                    >
                      <option value="mixed">Mixed</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                      Language
                    </label>
                    <select
                      value={formData.codingLanguage}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          codingLanguage: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-sm"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Video Answers Opt-In */}
            <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.videoAnswersEnabled}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      videoAnswersEnabled: !prev.videoAnswersEnabled,
                    }))
                  }
                  className="mt-1 text-primary-500 bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                />
                <span>
                  <span className="block font-medium text-surface-900 dark:text-surface-50">
                    Enable Video Answers
                  </span>
                  <span className="block text-sm text-surface-600 dark:text-surface-400">
                    Allow recording optional video responses for non-coding
                    questions.
                  </span>
                </span>
              </div>
              {!formData.videoAnswersEnabled && (
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  Video recorder will be hidden; users can still provide written
                  answers.
                </div>
              )}
            </div>

            {/* Duration & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  Duration (minutes)
                </label>
                <StyledSelect
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  ariaLabel="Duration"
                >
                  <option value={15}>15 minutes (Quick practice)</option>
                  <option value={30}>30 minutes (Standard)</option>
                  <option value={45}>45 minutes (Comprehensive)</option>
                  <option value={60}>60 minutes (Full interview)</option>
                </StyledSelect>
              </div>

              <div>
                <label
                  htmlFor="difficulty"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  Difficulty Level
                </label>
                <StyledSelect
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  ariaLabel="Difficulty"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </StyledSelect>
              </div>
            </div>

            {/* Technologies Selection */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-4">
                Technologies & Skills
                {formData.role && (
                  <span className="ml-2 text-xs text-surface-500 dark:text-surface-400">
                    (Select relevant technologies for {getRoleById(formData.role)?.label})
                  </span>
                )}
              </label>
              <div className="space-y-4">
                {TECHNOLOGY_CATEGORIES.map((category) => {
                  const techs = getTechnologiesByCategory(category.id);
                  if (techs.length === 0) return null;
                  
                  return (
                    <div key={category.id}>
                      <h4 className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-2">
                        {category.icon} {category.label}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {techs.map((tech) => (
                          <div
                            key={tech.id}
                            className={`px-3 py-2 rounded-lg border cursor-pointer text-center text-sm transition-all ${
                              formData.technologies.includes(tech.id)
                                ? "bg-primary-600 text-white border-primary-600"
                                : "bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-300 dark:border-surface-600 hover:border-primary-400"
                            }`}
                            onClick={() => handleTechnologyToggle(tech.id)}
                          >
                            {tech.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-4">
                Focus Areas (Optional)
                {formData.interviewType && (
                  <span className="ml-2 text-xs text-surface-500 dark:text-surface-400">
                    (Recommended for {INTERVIEW_TYPES.find(t => t.id === formData.interviewType)?.name})
                  </span>
                )}
              </label>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {FOCUS_AREA_CATEGORIES.map((category) => {
                  const areas = getFocusAreasByCategory(category.id);
                  if (areas.length === 0) return null;
                  
                  return (
                    <div key={category.id}>
                      <h4 className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-2 flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {areas.map((area) => (
                          <div
                            key={area.id}
                            className={`px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${
                              formData.focusAreas.includes(area.id)
                                ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30 dark:border-green-500/40"
                                : "bg-surface-50 dark:bg-surface-700/30 text-surface-700 dark:text-surface-300 border-surface-300 dark:border-surface-600 hover:border-surface-500"
                            }`}
                            onClick={() => handleFocusAreaToggle(area.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formData.focusAreas.includes(area.id)}
                                  onChange={() => {}}
                                  className="text-primary-500 bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                                />
                                <span>{area.name}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                area.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                area.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {area.difficulty}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-surface-200 dark:border-surface-700">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Interview..." : "Start Interview"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewCreationPage;
