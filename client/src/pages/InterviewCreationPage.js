import React, { useState, useEffect } from "react";
import StyledSelect from "../components/ui/StyledSelect";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { apiService } from "../services/api";

const InterviewCreationPage = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [formData, setFormData] = useState({
    jobRole: "",
    experienceLevel: "intermediate",
    interviewType: "mixed",
    skills: [],
    duration: 30,
    difficulty: "medium",
    focusAreas: [],
    adaptiveDifficultyEnabled: true,
    includeCodingChallenges: false,
    codingChallengeCount: 2,
    codingDifficulty: "mixed",
    codingLanguage: "javascript",
  });
  const [loading, setLoading] = useState(false);

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "intermediate", label: "Intermediate (2-5 years)" },
    { value: "senior", label: "Senior (5-10 years)" },
    { value: "expert", label: "Expert (10+ years)" },
  ];

  const interviewTypes = [
    {
      value: "technical",
      label: "Technical Only",
      description: "Focus on coding and technical skills",
    },
    {
      value: "behavioral",
      label: "Behavioral Only",
      description: "Focus on soft skills and experiences",
    },
    {
      value: "mixed",
      label: "Mixed Interview",
      description: "Combination of technical and behavioral",
    },
    {
      value: "system-design",
      label: "System Design",
      description: "Architecture and system design questions",
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

      const difficultyMapping = {
        easy: "beginner",
        medium: "intermediate",
        hard: "advanced",
        mixed: "intermediate",
      };

      // Create interview
      const response = await apiService.post("/interviews", {
        config: {
          ...formData,
          experienceLevel:
            experienceLevelMapping[formData.experienceLevel] ||
            formData.experienceLevel,
          difficulty:
            difficultyMapping[formData.difficulty] || formData.difficulty,
          adaptiveDifficulty: { enabled: !!formData.adaptiveDifficultyEnabled },
          questionCount: Math.floor(formData.duration / 3), // Roughly 3 minutes per question
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
            <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
              Create New Interview
            </h1>
            <p className="text-surface-600 dark:text-surface-300 mt-2">
              Customize your interview practice session based on your goals and
              preferences.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Job Role & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="jobRole"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  Job Role/Position
                </label>
                <input
                  type="text"
                  id="jobRole"
                  name="jobRole"
                  value={formData.jobRole}
                  onChange={handleInputChange}
                  placeholder="e.g., Software Engineer, Product Manager"
                  className="w-full px-4 py-3 bg-white dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-surface-900 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-400 transition-all duration-200"
                  required
                />
              </div>

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

            {/* Skills Selection */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-4">
                Relevant Skills & Technologies
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
                Focus Areas (Optional)
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
