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

const OnboardingModal = ({ isOpen, onClose }) => {
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

    if (!professionalInfo.industry) {
      toast.error("Please select your industry");
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
        setStep(6); // Show success step
        setTimeout(() => {
          onClose();
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
            <option value="entry">Entry Level (0-1 years)</option>
            <option value="junior">Junior (2-3 years)</option>
            <option value="mid">Mid Level (4-6 years)</option>
            <option value="senior">Senior (7-10 years)</option>
            <option value="lead">Lead/Principal (10+ years)</option>
            <option value="executive">Executive (15+ years)</option>
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
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Skills Assessment
          </h3>
          <p className="text-gray-600 dark:text-surface-400">
            Select your skills and rate your confidence level
          </p>
        </div>

        <div className="space-y-4">
          {/* Skill Search and Add */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
              Add Skills
            </label>
            <input
              type="text"
              value={skillInput}
              onChange={(e) => handleSkillInputChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Search for skills (e.g., React, Python, SQL)"
            />
            {filteredSkills.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface-700 border border-gray-300 dark:border-surface-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredSkills.map((skill) => (
                  <button
                    key={`${skill.category}-${skill.name}`}
                    onClick={() => {
                      handleSkillAdd(skill.name, skill.category);
                      setSkillInput("");
                      setFilteredSkills([]);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-surface-600 text-gray-900 dark:text-white text-sm"
                  >
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-gray-500 dark:text-surface-400 ml-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                Your Skills & Confidence Levels
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.professionalInfo.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-surface-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSkillRemove(skill.name)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {skill.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-surface-400 bg-gray-200 dark:bg-surface-600 px-2 py-1 rounded">
                        {skill.category}
                      </span>
                    </div>
                    <select
                      value={skill.confidence}
                      onChange={(e) =>
                        handleSkillConfidenceChange(skill.name, e.target.value)
                      }
                      className="text-sm border border-gray-300 dark:border-surface-600 rounded px-2 py-1 bg-white dark:bg-surface-700 text-gray-900 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
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
                  className="rounded border-gray-300 dark:border-surface-600 text-primary-600 bg-white dark:bg-surface-700 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-surface-300">
                  {type.label}
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
                key={area.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.preferences.focusAreas.includes(area.value)}
                  onChange={() =>
                    handleArrayToggle("preferences", "focusAreas", area.value)
                  }
                  className="rounded border-gray-300 dark:border-surface-600 text-primary-600 bg-white dark:bg-surface-700 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-surface-300">
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

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Target className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Interview Goals & Timeline
        </h3>
        <p className="text-gray-600 dark:text-surface-400">
          Set your interview preparation goals
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
            Primary Interview Goal
          </label>
          <select
            value={formData.interviewGoals.primaryGoal}
            onChange={(e) =>
              handleInputChange("interviewGoals", "primaryGoal", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="e.g., Google, Meta, Amazon, Netflix"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
            Interview Timeline
          </label>
          <select
            value={formData.interviewGoals.timeline}
            onChange={(e) =>
              handleInputChange("interviewGoals", "timeline", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
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
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Welcome to MockMate! 🎉
        </h3>
        <p className="text-gray-600 dark:text-surface-400">
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

      <div className="text-sm text-gray-500 dark:text-surface-500">
        This modal will close automatically in a few seconds...
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
                Step {step} of 5
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveProgress}
                disabled={loading}
                className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                  savedProgress
                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "bg-gray-100 dark:bg-surface-700 text-gray-700 dark:text-surface-300 hover:bg-gray-200 dark:hover:bg-surface-600"
                }`}
              >
                <Save className="h-4 w-4" />
                <span>{savedProgress ? "Saved!" : "Save Progress"}</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-surface-500 hover:text-gray-600 dark:hover:text-surface-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
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
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Profile Strength Meter */}
          <div className="flex items-center justify-between text-sm mb-6">
            <span className="text-gray-600 dark:text-surface-400">
              Profile Strength
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-gray-200 dark:bg-surface-600 rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-yellow-400 to-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
              <span className="text-gray-700 dark:text-surface-300 font-medium">
                {profileStrength}%
              </span>
            </div>
          </div>

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderSuccessStep()}

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

            {step < 5 ? (
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
