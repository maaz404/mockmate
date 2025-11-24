import React, { useState, useEffect } from "react";
import StyledSelect from "../components/ui/StyledSelect";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { apiService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const InterviewCreationPage = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useAuthContext();
  const { language, setLanguage, supported, labels, t } = useLanguage();
  const [formData, setFormData] = useState({
    jobRole: "",
    experienceLevel: "intermediate",
    interviewType: "mixed",
    skills: [],
    duration: 30,
    focusAreas: [],
    adaptiveDifficultyEnabled: false,
    includeCodingChallenges: false,
    codingChallengeCount: 2,
    codingDifficulty: "mixed",
    codingLanguage: "javascript",
    videoAnswersEnabled: true,
  });
  const [loading, setLoading] = useState(false);

  // Localized labels - these will update when language changes
  const experienceLevels = [
    { value: "entry", label: t("experience_entry") },
    { value: "intermediate", label: t("experience_intermediate") },
    { value: "senior", label: t("experience_senior") },
    { value: "expert", label: t("experience_expert") },
  ];

  const interviewTypes = [
    {
      value: "technical",
      label: t("technical_only"),
      description: t("technical_only_desc"),
    },
    {
      value: "behavioral",
      label: t("behavioral_only"),
      description: t("behavioral_only_desc"),
    },
    {
      value: "mixed",
      label: t("mixed_interview"),
      description: t("mixed_interview_desc"),
    },
    {
      value: "system-design",
      label: t("system_design"),
      description: t("system_design_desc"),
    },
  ];

  const focusAreaOptions = [
    { value: "algorithms", label: "Data Structures & Algorithms" },
    { value: "frontend", label: "Frontend Development" },
    { value: "backend", label: "Backend Development" },
    { value: "database", label: "Database Design" },
    { value: "system-design", label: "System Design" },
    { value: "leadership", label: "Leadership & Management" },
    { value: "communication", label: "Communication Skills" },
    { value: "problem-solving", label: "Problem Solving" },
  ];

  const commonSkills = [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "TypeScript",
    "AWS",
    "Docker",
    "MongoDB",
    "PostgreSQL",
    "Git",
    "REST APIs",
    "GraphQL",
    "Redux",
    "Express.js",
    "Spring Boot",
    "Vue.js",
    "Angular",
  ];

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserProfile();
    }
  }, [isLoaded, user]);

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

  const handleSkillToggle = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleFocusAreaToggle = (area) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter((a) => a !== area)
        : [...prev.focusAreas, area],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map client values to server expected values
      const experienceLevelMapping = {
        entry: "entry",
        intermediate: "mid",
        senior: "senior",
        expert: "executive",
      };

      // Create interview
      const response = await apiService.post("/interviews", {
        config: {
          ...formData,
          experienceLevel:
            experienceLevelMapping[formData.experienceLevel] ||
            formData.experienceLevel,
          // No difficulty field - backend will use mixed distribution by default
          // or adaptive algorithm when adaptiveDifficultyEnabled is true
          adaptiveDifficulty: { enabled: !!formData.adaptiveDifficultyEnabled },
          // Always use 10 questions by default, regardless of duration
          // Duration is for time limit, not question count
          questionCount: 10,
          coding: formData.includeCodingChallenges
            ? {
                challengeCount: formData.codingChallengeCount,
                difficulty: formData.codingDifficulty,
                language: formData.codingLanguage,
              }
            : undefined,
          videoAnswersEnabled: formData.videoAnswersEnabled,
          language,
        },
      });

      console.log("Interview creation response:", response); // Debug log

      if (response && response.data && response.data._id) {
        // Redirect to hardware check lobby first
        navigate(`/hardware-check-lobby/${response.data._id}`);
      } else {
        // Fallback: try to navigate anyway or show error
        console.error("Unexpected response format:", response);
        alert(
          "Interview created but navigation failed. Check console for details."
        );
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
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
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
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
                  {t("create_new_interview")}
                </h1>
                <p className="text-surface-600 dark:text-surface-300 mt-2">
                  {t("customize_interview_desc")}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm bg-surface-100 dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 shadow-sm">
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  {t("language_label")}:
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent focus:outline-none text-surface-900 dark:text-surface-100 font-medium cursor-pointer"
                >
                  {supported.map((code) => (
                    <option key={code} value={code}>
                      {labels[code]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Job Role & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="jobRole"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  {t("job_role_position")}
                </label>
                <input
                  type="text"
                  id="jobRole"
                  name="jobRole"
                  value={formData.jobRole}
                  onChange={handleInputChange}
                  placeholder={t("job_role_placeholder")}
                  className="w-full px-4 py-3 bg-white dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-surface-900 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-400 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="experienceLevel"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  {t("experience_level")}
                </label>
                <StyledSelect
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  ariaLabel="Experience level"
                >
                  {experienceLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </StyledSelect>
              </div>
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
                    {t("adaptive_difficulty")}
                  </span>
                  <span className="block text-sm text-surface-600 dark:text-surface-400">
                    {t("adaptive_difficulty_desc")}
                  </span>
                </span>
              </label>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-4">
                {t("interview_type")}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interviewTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.interviewType === type.value
                        ? "border-primary-500 bg-primary-500/10 ring-2 ring-primary-500/50"
                        : "border-surface-300 dark:border-surface-600 hover:border-surface-400 dark:hover:border-surface-500 bg-surface-50 dark:bg-surface-700/30"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        interviewType: type.value,
                      }))
                    }
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        value={type.value}
                        checked={formData.interviewType === type.value}
                        onChange={() => {}}
                        className="mr-3 text-primary-500 bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                      />
                      <div>
                        <h4 className="font-medium text-surface-900 dark:text-surface-50">
                          {type.label}
                        </h4>
                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                          {type.description}
                        </p>
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

            {/* Duration */}
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
              >
                {t("duration_minutes")}
              </label>
              <StyledSelect
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                ariaLabel="Duration"
              >
                <option value={15}>{t("duration_15_quick")}</option>
                <option value={30}>{t("duration_30_standard")}</option>
                <option value={45}>{t("duration_45_comprehensive")}</option>
                <option value={60}>{t("duration_60_full")}</option>
              </StyledSelect>
              <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                Questions will have a mixed difficulty distribution (beginner,
                intermediate, advanced).
                {formData.adaptiveDifficultyEnabled &&
                  " Adaptive difficulty will adjust based on your performance."}
              </p>
            </div>

            {/* Skills Selection */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-4">
                {t("relevant_skills")}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {commonSkills.map((skill) => (
                  <div
                    key={skill}
                    className={`px-3 py-2 rounded-lg border cursor-pointer text-center text-sm transition-all ${
                      formData.skills.includes(skill)
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-300 dark:border-surface-600 hover:border-primary-400"
                    }`}
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-4">
                {t("focus_areas_optional")}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {focusAreaOptions.map((area) => (
                  <div
                    key={area.value}
                    className={`px-4 py-3 rounded-lg border cursor-pointer text-sm transition-all ${
                      formData.focusAreas.includes(area.value)
                        ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30 dark:border-green-500/40"
                        : "bg-surface-50 dark:bg-surface-700/30 text-surface-700 dark:text-surface-300 border-surface-300 dark:border-surface-600 hover:border-surface-500"
                    }`}
                    onClick={() => handleFocusAreaToggle(area.value)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.focusAreas.includes(area.value)}
                        onChange={() => {}}
                        className="mr-3 text-primary-500 bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                      />
                      {area.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-surface-200 dark:border-surface-700">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t("creating_interview") : t("start_interview")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewCreationPage;
