import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import {
  X,
  User,
  Target,
  Settings,
  CheckCircle,
  Star,
  TrendingUp,
  Award,
  Save,
  Code,
} from "lucide-react";
import toast from "react-hot-toast";

const OnboardingModal = ({ isOpen, onClose, onComplete }) => {
  const { refreshProfile, userProfile } = useAuthContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedProgress, setSavedProgress] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [profileStrength, setProfileStrength] = useState(0);

  const [formData, setFormData] = useState({
    professionalInfo: {
      currentRole: "",
      company: "",
      experience: "entry", // Default to entry level
      skills: [],
      skillsToImprove: [],
      industry: "",
      careerGoals: "",
    },
    interviewGoals: {
      primaryGoal: "",
      targetCompanies: [],
      timeline: "",
      expectedInterviewDate: null,
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

  // Tech-focused industries
  const industries = [
    "Software Development",
    "Data Science & Analytics",
    "Product Management",
    "UX/UI Design",
    "DevOps & Infrastructure",
    "Cybersecurity",
    "Machine Learning & AI",
    "QA & Testing",
    "Technical Management",
    "IT Support",
    "Other (Tech)",
  ];

  // Comprehensive skills database
  const skillsDatabase = {
    programming: [
      "JavaScript",
      "Python",
      "Java",
      "C++",
      "C#",
      "Go",
      "Rust",
      "TypeScript",
      "PHP",
      "Ruby",
      "Swift",
      "Kotlin",
      "Scala",
      "R",
      "MATLAB",
    ],
    framework: [
      "React",
      "Angular",
      "Vue.js",
      "Node.js",
      "Express",
      "Django",
      "Flask",
      "Spring",
      "Laravel",
      "Rails",
      ".NET",
      "TensorFlow",
      "PyTorch",
      "Pandas",
      "NumPy",
      "Scikit-learn",
    ],
    tool: [
      "Git",
      "Docker",
      "Kubernetes",
      "AWS",
      "Azure",
      "GCP",
      "Jenkins",
      "GitHub Actions",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Elasticsearch",
      "Kafka",
      "Linux",
      "Bash",
    ],
    "soft-skill": [
      "Communication",
      "Leadership",
      "Problem Solving",
      "Team Collaboration",
      "Project Management",
      "Time Management",
      "Adaptability",
      "Critical Thinking",
    ],
    domain: [
      "System Design",
      "Algorithms",
      "Data Structures",
      "Machine Learning",
      "Web Development",
      "Mobile Development",
      "Cloud Computing",
      "DevOps",
      "Security",
      "Database Design",
      "API Design",
      "Microservices",
    ],
  };

  const interviewTypes = [
    { value: "technical", label: "Technical" },
    { value: "behavioral", label: "Behavioral" },
    { value: "system-design", label: "System Design" },
    { value: "case-study", label: "Case Study" },
    { value: "leadership", label: "Leadership" },
    { value: "sales", label: "Sales" },
  ];

  const focusAreas = [
    { value: "problem-solving", label: "Problem Solving" },
    { value: "communication", label: "Communication" },
    { value: "leadership", label: "Leadership" },
    { value: "technical-skills", label: "Technical Skills" },
    { value: "industry-knowledge", label: "Industry Knowledge" },
    { value: "presentation-skills", label: "Presentation Skills" },
  ];

  const primaryGoals = [
    {
      value: "specific-company",
      label: "Preparing for a specific company interview",
      icon: Target,
    },
    {
      value: "general-practice",
      label: "General interview practice",
      icon: TrendingUp,
    },
    {
      value: "technical-communication",
      label: "Improving technical communication",
      icon: Award,
    },
    {
      value: "behavioral-confidence",
      label: "Building confidence in behavioral responses",
      icon: Star,
    },
  ];

  const timelines = [
    { value: "within-1-week", label: "Within 1 week", urgency: "high" },
    { value: "1-4-weeks", label: "1-4 weeks", urgency: "medium" },
    { value: "1-3-months", label: "1-3 months", urgency: "low" },
    { value: "exploring", label: "Just exploring options", urgency: "none" },
  ];

  // Step metadata for UI (title, subtitle, icon)
  const stepMeta = [
    {
      title: "Professional Information",
      subtitle: "Tell us about your professional background",
      icon: User,
    },
    {
      title: "Skills & Experience",
      subtitle: "Show your strengths and growth areas",
      icon: Code,
    },
    {
      title: "Interview Preferences",
      subtitle: "Customize practice to your style",
      icon: Target,
    },
    {
      title: "AI Coaching & Practice Settings",
      subtitle: "Tune session length, language, and optional facial analysis",
      icon: Settings,
    },
    {
      title: "Interview Goals",
      subtitle: "Set your target timeline and companies",
      icon: CheckCircle,
    },
  ];

  // Calculate profile strength
  useEffect(() => {
    const calculateStrength = () => {
      let strength = 0;
      const { professionalInfo, interviewGoals, preferences } = formData;

      // Professional info (40%)
      if (professionalInfo.currentRole) strength += 10;
      if (professionalInfo.company) strength += 5;
      if (professionalInfo.experience) strength += 10;
      if (professionalInfo.industry) strength += 5;
      if (professionalInfo.skills.length > 0) strength += 10;

      // Interview goals (30%)
      if (interviewGoals.primaryGoal) strength += 15;
      if (interviewGoals.timeline) strength += 10;
      if (interviewGoals.targetCompanies.length > 0) strength += 5;

      // Preferences (30%)
      if (preferences.interviewTypes.length > 0) strength += 15;
      if (preferences.focusAreas.length > 0) strength += 10;
      if (preferences.difficulty) strength += 5;

      setProfileStrength(Math.min(strength, 100));
    };

    calculateStrength();
  }, [formData]);

  // Close on Escape for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose && onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Load existing user profile data when modal opens
  useEffect(() => {
    if (isOpen && userProfile && !userProfile.onboardingCompleted) {
      setFormData({
        professionalInfo: {
          currentRole: userProfile.professionalInfo?.currentRole || "",
          company: userProfile.professionalInfo?.company || "",
          experience: userProfile.professionalInfo?.experience || "entry",
          skills:
            userProfile.professionalInfo?.skills?.map((skill) =>
              typeof skill === "object"
                ? skill
                : { name: skill, confidence: 3, category: "general" }
            ) || [],
          skillsToImprove:
            userProfile.professionalInfo?.skillsToImprove?.map((skill) =>
              typeof skill === "object"
                ? skill
                : { name: skill, priority: "medium" }
            ) || [],
          industry: userProfile.professionalInfo?.industry || "",
          careerGoals: userProfile.professionalInfo?.careerGoals || "",
        },
        interviewGoals: {
          primaryGoal: userProfile.interviewGoals?.primaryGoal || "",
          targetCompanies: userProfile.interviewGoals?.targetCompanies || [],
          timeline: userProfile.interviewGoals?.timeline || "",
          expectedInterviewDate:
            userProfile.interviewGoals?.expectedInterviewDate || null,
        },
        preferences: {
          interviewTypes: userProfile.preferences?.interviewTypes || [],
          difficulty: userProfile.preferences?.difficulty || "intermediate",
          focusAreas: userProfile.preferences?.focusAreas || [],
          notifications: {
            email: userProfile.preferences?.notifications?.email ?? true,
            push: userProfile.preferences?.notifications?.push ?? true,
            interviews:
              userProfile.preferences?.notifications?.interviews ?? true,
            progress: userProfile.preferences?.notifications?.progress ?? true,
          },
        },
      });
    }
  }, [isOpen, userProfile]);

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

  // notifications toggles removed in favor of AI coaching settings step

  const handleSkillAdd = (skillName, category) => {
    if (!formData.professionalInfo.skills.find((s) => s.name === skillName)) {
      setFormData((prev) => ({
        ...prev,
        professionalInfo: {
          ...prev.professionalInfo,
          skills: [
            ...prev.professionalInfo.skills,
            {
              name: skillName,
              confidence: 3,
              category,
            },
          ],
        },
      }));
    }
  };

  const handleSkillRemove = (skillName) => {
    setFormData((prev) => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        skills: prev.professionalInfo.skills.filter(
          (s) => s.name !== skillName
        ),
      },
    }));
  };

  const handleSkillConfidenceChange = (skillName, confidence) => {
    setFormData((prev) => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        skills: prev.professionalInfo.skills.map((s) =>
          s.name === skillName ? { ...s, confidence: parseInt(confidence) } : s
        ),
      },
    }));
  };

  const handleSaveProgress = async () => {
    try {
      setLoading(true);
      await api.post("/users/onboarding/save-progress", formData);
      setSavedProgress(true);
      toast.success("Progress saved successfully!");
      setTimeout(() => setSavedProgress(false), 3000);
    } catch (error) {
      let errorMessage = "Failed to save progress";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        const details = error.response.data.details;
        if (typeof details === "object") {
          const detailMessages = Object.values(details).filter(Boolean);
          if (detailMessages.length > 0) {
            errorMessage = `Validation error: ${detailMessages.join(", ")}`;
          }
        }
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    // Validation
    const { professionalInfo, interviewGoals } = formData;

    if (!professionalInfo.currentRole.trim()) {
      toast.error("Please provide your current role");
      return;
    }

    if (!interviewGoals.primaryGoal) {
      toast.error("Please select your primary interview goal");
      return;
    }

    if (!interviewGoals.timeline) {
      toast.error("Please select your interview timeline");
      return;
    }

    if (formData.preferences.interviewTypes.length === 0) {
      toast.error("Please select at least one interview type");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/users/onboarding/complete", formData);

      if (response.data && response.data.success) {
        await refreshProfile();
        // Allow parent to perform additional actions (e.g., refresh, navigate)
        if (typeof onComplete === "function") {
          try {
            await onComplete();
          } catch (_) {
            // swallow to avoid blocking UI
          }
        }
        setStep(6); // Show success step
        setTimeout(() => {
          onClose && onClose();
        }, 3000);
      } else {
        throw new Error(response.data?.message || "Failed to complete setup");
      }
    } catch (error) {
      let errorMessage = "Failed to complete setup. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        // Handle validation errors
        const details = error.response.data.details;
        if (typeof details === "object") {
          const detailMessages = Object.values(details).filter(Boolean);
          if (detailMessages.length > 0) {
            errorMessage = detailMessages.join(", ");
          }
        }
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
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
        <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
          Professional Information
        </h3>
        <p className="text-surface-600 dark:text-surface-400">
          Tell us about your professional background
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
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
            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="e.g., Software Engineer, Product Manager"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Company
          </label>
          <input
            type="text"
            value={formData.professionalInfo.company}
            onChange={(e) =>
              handleInputChange("professionalInfo", "company", e.target.value)
            }
            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="e.g., Google, Microsoft, Startup"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
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
            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          >
            <option value="">Select experience level</option>
            <option value="entry">Entry Level (0-1 years)</option>
            <option value="junior">Junior (2-3 years)</option>
            <option value="mid">Mid Level (4-6 years)</option>
            <option value="senior">Senior (7-10 years)</option>
            <option value="lead">Lead/Principal (10+ years)</option>
            <option value="executive">Executive (15+ years)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Industry
          </label>
          <select
            value={formData.professionalInfo.industry}
            onChange={(e) =>
              handleInputChange("professionalInfo", "industry", e.target.value)
            }
            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
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

  const renderStep2 = () => {
    const handleSkillInputChange = (value) => {
      setSkillInput(value);
      if (value.length > 0) {
        const filtered = Object.entries(skillsDatabase)
          .flatMap(([category, skills]) =>
            skills.map((skill) => ({ name: skill, category }))
          )
          .filter(
            (skill) =>
              skill.name.toLowerCase().includes(value.toLowerCase()) &&
              !formData.professionalInfo.skills.find(
                (s) => s.name === skill.name
              )
          )
          .slice(0, 5);
        setFilteredSkills(filtered);
      } else {
        setFilteredSkills([]);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Code className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
            Skills Assessment
          </h3>
          <p className="text-surface-600 dark:text-surface-400">
            Select your skills and rate your confidence level
          </p>
        </div>

        <div className="space-y-4">
          {/* Skill Search and Add */}
          <div className="relative">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Add Skills
            </label>
            <input
              type="text"
              value={skillInput}
              onChange={(e) => handleSkillInputChange(e.target.value)}
              className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Search for skills (e.g., React, Python, SQL)"
            />
            {filteredSkills.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg shadow-lg max-h-40 overflow-y-auto hover-scrollbar">
                {filteredSkills.map((skill) => (
                  <button
                    key={`${skill.category}-${skill.name}`}
                    onClick={() => {
                      handleSkillAdd(skill.name, skill.category);
                      setSkillInput("");
                      setFilteredSkills([]);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-surface-100 dark:hover:bg-surface-600 text-surface-900 dark:text-white text-sm"
                  >
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-surface-500 dark:text-surface-400 ml-2">
                      ({skill.category})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Skills with Confidence */}
          {formData.professionalInfo.skills.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Your Skills & Confidence Levels
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto hover-scrollbar">
                {formData.professionalInfo.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between p-2 bg-surface-100 dark:bg-surface-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSkillRemove(skill.name)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-surface-900 dark:text-white">
                        {skill.name}
                      </span>
                      <span className="text-xs text-surface-500 dark:text-surface-400 bg-surface-200 dark:bg-surface-600 px-2 py-1 rounded">
                        {skill.category}
                      </span>
                    </div>
                    <select
                      value={skill.confidence}
                      onChange={(e) =>
                        handleSkillConfidenceChange(skill.name, e.target.value)
                      }
                      className="text-sm border border-surface-300 dark:border-surface-600 rounded px-2 py-1 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                    >
                      <option value={1}>Beginner</option>
                      <option value={2}>Basic</option>
                      <option value={3}>Intermediate</option>
                      <option value={4}>Advanced</option>
                      <option value={5}>Expert</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills to Improve */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Skills to Improve (optional)
            </label>
            <input
              type="text"
              value={formData.professionalInfo.skillsToImprove
                .map((s) => s.name || s)
                .join(", ")}
              onChange={(e) => {
                const skillNames = e.target.value.split(", ").filter(Boolean);
                const skillsToImprove = skillNames.map((name) => ({
                  name,
                  priority: "medium",
                }));
                handleInputChange(
                  "professionalInfo",
                  "skillsToImprove",
                  skillsToImprove
                );
              }}
              className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="e.g., System Design, Algorithms, Leadership"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Target className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
        <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
          Interview Preferences
        </h3>
        <p className="text-surface-600 dark:text-surface-400">
          Customize your interview practice
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            Interview Types (select multiple)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {interviewTypes.map((type) => (
              <label
                key={type.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.preferences.interviewTypes.includes(
                    type.value
                  )}
                  onChange={() =>
                    handleArrayToggle(
                      "preferences",
                      "interviewTypes",
                      type.value
                    )
                  }
                  className="rounded border-surface-300 dark:border-surface-600 text-primary-600 bg-white dark:bg-surface-700 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Difficulty Level
          </label>
          <select
            value={formData.preferences.difficulty}
            onChange={(e) =>
              handleInputChange("preferences", "difficulty", e.target.value)
            }
            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            Focus Areas (select multiple)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {focusAreas.map((area) => (
              <label
                key={area.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.preferences.focusAreas.includes(area.value)}
                  onChange={() =>
                    handleArrayToggle("preferences", "focusAreas", area.value)
                  }
                  className="rounded border-surface-300 dark:border-surface-600 text-primary-600 bg-white dark:bg-surface-700 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {area.label}
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
        <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
          AI Coaching & Practice Settings
        </h3>
        <p className="text-surface-600 dark:text-surface-400">
          Personalize your sessions and optional facial analysis
        </p>
      </div>

      <div className="space-y-6">
        {/* Session duration */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Session Duration (minutes)
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
            className="w-full"
          />
          <div className="mt-1 text-sm text-surface-600 dark:text-surface-400">
            {formData.preferences.sessionDuration} minutes
          </div>
        </div>

        {/* Preferred language */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Preferred Language
          </label>
          <select
            value={formData.preferences.preferredLanguages?.[0] || "English"}
            onChange={(e) =>
              handleInputChange("preferences", "preferredLanguages", [
                e.target.value,
              ])
            }
            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          >
            {["English", "Spanish", "French", "German", "Hindi", "Urdu"].map(
              (lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              )
            )}
          </select>
        </div>

        {/* Facial analysis */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-surface-900 dark:text-white">
                Enable Facial Expression Analysis
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Analyze eye contact, emotions, and expressions
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.preferences.facialAnalysis.enabled}
              onChange={(e) =>
                handleInputChange("preferences", "facialAnalysis", {
                  ...formData.preferences.facialAnalysis,
                  enabled: e.target.checked,
                })
              }
            />
          </div>

          {formData.preferences.facialAnalysis.enabled && (
            <div className="space-y-3 pl-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.preferences.facialAnalysis.consentGiven}
                  onChange={(e) =>
                    handleInputChange("preferences", "facialAnalysis", {
                      ...formData.preferences.facialAnalysis,
                      consentGiven: e.target.checked,
                    })
                  }
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  I consent to optional facial analysis during practice
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.preferences.facialAnalysis.autoCalibration}
                  onChange={(e) =>
                    handleInputChange("preferences", "facialAnalysis", {
                      ...formData.preferences.facialAnalysis,
                      autoCalibration: e.target.checked,
                    })
                  }
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  Auto calibration
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    formData.preferences.facialAnalysis.showConfidenceMeter
                  }
                  onChange={(e) =>
                    handleInputChange("preferences", "facialAnalysis", {
                      ...formData.preferences.facialAnalysis,
                      showConfidenceMeter: e.target.checked,
                    })
                  }
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  Show confidence meter
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    formData.preferences.facialAnalysis.showRealtimeFeedback
                  }
                  onChange={(e) =>
                    handleInputChange("preferences", "facialAnalysis", {
                      ...formData.preferences.facialAnalysis,
                      showRealtimeFeedback: e.target.checked,
                    })
                  }
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  Show real‑time feedback
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Feedback frequency
                </label>
                <select
                  value={formData.preferences.facialAnalysis.feedbackFrequency}
                  onChange={(e) =>
                    handleInputChange("preferences", "facialAnalysis", {
                      ...formData.preferences.facialAnalysis,
                      feedbackFrequency: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Target className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
        <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
          Interview Goals & Timeline
        </h3>
        <p className="text-surface-600 dark:text-surface-400">
          Set your interview preparation goals
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Primary Interview Goal
          </label>
          <select
            value={formData.interviewGoals.primaryGoal}
            onChange={(e) =>
              handleInputChange("interviewGoals", "primaryGoal", e.target.value)
            }
            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          >
            <option value="">Select your primary goal</option>
            {primaryGoals.map((goal) => (
              <option key={goal.value} value={goal.value}>
                {goal.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Target Companies (optional)
          </label>
          <input
            type="text"
            value={formData.interviewGoals.targetCompanies.join(", ")}
            onChange={(e) =>
              handleInputChange(
                "interviewGoals",
                "targetCompanies",
                e.target.value.split(", ").filter(Boolean)
              )
            }
            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="e.g., Google, Meta, Amazon, Netflix"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Interview Timeline
          </label>
          <select
            value={formData.interviewGoals.timeline}
            onChange={(e) =>
              handleInputChange("interviewGoals", "timeline", e.target.value)
            }
            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          >
            <option value="">Select timeline</option>
            {timelines.map((timeline) => (
              <option key={timeline.value} value={timeline.value}>
                {timeline.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="mb-6">
        <CheckCircle className="mx-auto h-16 w-16 text-green-600 dark:text-green-400 mb-4" />
        <h3 className="text-2xl font-semibold text-surface-900 dark:text-white mb-2">
          Welcome to MockMate! 🎉
        </h3>
        <p className="text-surface-600 dark:text-surface-400">
          Your profile has been set up successfully. Here are your personalized
          recommendations:
        </p>
      </div>

      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-primary-800 dark:text-primary-200 mb-2">
          Recommended Next Steps
        </h4>
        <ul className="text-sm text-primary-700 dark:text-primary-300 space-y-1 text-left">
          <li>• Start with a practice interview in your preferred format</li>
          <li>• Review your skill gaps and focus on improvement areas</li>
          <li>• Schedule regular practice sessions based on your timeline</li>
          <li>• Track your progress and adjust your goals as needed</li>
        </ul>
      </div>

      <div className="text-sm text-surface-500 dark:text-surface-500">
        This modal will close automatically in a few seconds...
      </div>
    </div>
  );

  return (
    <div
      className="modal-backdrop z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="modal-panel w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-surface-800/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-surface-200 dark:border-surface-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const MetaIcon = stepMeta[Math.min(step - 1, 4)]?.icon || User;
                return (
                  <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <MetaIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                );
              })()}
              <div>
                <h2
                  id="onboarding-title"
                  className="text-lg sm:text-xl font-semibold text-surface-900 dark:text-white"
                >
                  {stepMeta[Math.min(step - 1, 4)]?.title || "Welcome"}
                </h2>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Step {Math.min(step, 5)} of 5
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveProgress}
                disabled={loading}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  savedProgress
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-600"
                }`}
              >
                <Save className="h-4 w-4" />
                <span>{savedProgress ? "Saved" : "Save"}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-surface-500 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className="flex-1 flex items-center last:flex-none"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shadow-sm ${
                      s < step
                        ? "bg-primary-600 text-white"
                        : s === step
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200"
                        : "bg-surface-200 dark:bg-surface-700 text-surface-500"
                    }`}
                  >
                    {s < step ? "✓" : s}
                  </div>
                  {s < 5 && (
                    <div className="flex-1 h-1 mx-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          s < step
                            ? "bg-primary-500 w-full"
                            : s === step
                            ? "bg-primary-300 w-1/2"
                            : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="px-6 py-5 overflow-y-auto hover-scrollbar">
          <p className="mb-4 text-sm text-surface-600 dark:text-surface-400 hidden sm:block">
            {stepMeta[Math.min(step - 1, 4)]?.subtitle}
          </p>

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderSuccessStep()}

          {/* Profile strength */}
          <div className="mt-6 flex items-center justify-between text-xs">
            <span className="text-surface-600 dark:text-surface-400">
              Profile Strength
            </span>
            <div className="flex items-center gap-2">
              <div className="w-28 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-yellow-400 to-green-500 rounded-full"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
              <span className="text-surface-700 dark:text-surface-300 font-medium">
                {profileStrength}%
              </span>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 border-t border-surface-200 dark:border-surface-700 bg-white/90 dark:bg-surface-800/90 backdrop-blur px-6 py-4">
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className={`px-5 py-2 rounded-lg font-medium transition-all shadow-sm ${
                step === 1
                  ? "bg-surface-100 dark:bg-surface-700 text-surface-400 cursor-not-allowed"
                  : "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-600"
              }`}
            >
              Previous
            </button>

            {step < 5 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg font-semibold text-white shadow-sm bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-semibold text-white shadow-sm bg-green-600 hover:bg-green-700 disabled:opacity-60"
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
