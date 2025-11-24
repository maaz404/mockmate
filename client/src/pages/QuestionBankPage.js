import React, { useState, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import HybridQuestionGenerator from "../components/ui/HybridQuestionGenerator";
import StyledSelect from "../components/ui/StyledSelect";
import QuestionCard from "../components/ui/QuestionCard";
import toast from "react-hot-toast";
import Modal from "../components/ui/Modal";
import TagPill from "../components/ui/TagPill";
import Button from "../components/ui/Button";
import { useNavigate, useLocation } from "react-router-dom";
import { CATEGORY_QUESTION_SETS } from "../data/questionBank";
import api from "../services/api";

const QuestionBankPage = () => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [appendMode, setAppendMode] = useState(false);
  const [favorites, setFavorites] = useState([]); // store normalized text keys
  const [lastGenerationInfo, setLastGenerationInfo] = useState(null); // {append:boolean,count:number,timestamp:number}
  const [highlightKeys, setHighlightKeys] = useState([]); // array of normalized text keys for temporary highlight
  const resultsRef = useRef(null);
  const navigate = useNavigate();
  const [tagFilter, setTagFilter] = useState("all");
  const [sortMode, setSortMode] = useState("original"); // original|difficulty|category
  // Category browsing (Behavioral / Technical / System Design)
  const [categoryFilter, setCategoryFilter] = useState("all"); // slug or 'all'
  const [searchQuery, setSearchQuery] = useState(""); // debounced value
  const [rawSearch, setRawSearch] = useState(""); // immediate input
  const [tagMode, setTagMode] = useState("single"); // single | multi
  const [multiTags, setMultiTags] = useState([]); // array of selected tags in multi mode
  const [tagLogic, setTagLogic] = useState("OR"); // OR | AND
  const [startingInterview, setStartingInterview] = useState(false);
  // Removed favorites-only, highlight style, export column customization
  const [showSmallFavModal, setShowSmallFavModal] = useState(false);
  const [pendingFavSubset, setPendingFavSubset] = useState(null);
  // Deprecated: role & experience selectors removed from UI; using defaults for interview config
  const selectedJobRole = "software-engineer";
  const selectedExperience = "intermediate";

  const location = useLocation();
  const { language } = useLanguage();

  // Helper to normalize category strings to slug form
  const normalizeCategory = (val) =>
    (val || "").trim().toLowerCase().replace(/\s+/g, "-");

  // Read category from query string (enables navigation via /questions?category=behavioral)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    if (cat) {
      setCategoryFilter(normalizeCategory(cat));
    }
  }, [location.search]);

  // Lightweight inline dropdown for grouping secondary copy/export actions
  const ActionMenu = ({ label, children }) => {
    const [open, setOpen] = React.useState(false);
    const btnRef = React.useRef(null);
    const panelRef = React.useRef(null);
    React.useEffect(() => {
      if (!open) return;
      const onKey = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      const onClick = (e) => {
        if (
          panelRef.current &&
          !panelRef.current.contains(e.target) &&
          !btnRef.current.contains(e.target)
        ) {
          setOpen(false);
        }
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("mousedown", onClick);
      return () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("mousedown", onClick);
      };
    }, [open]);
    React.useEffect(() => {
      if (open && panelRef.current) {
        const first = panelRef.current.querySelector('[role="menuitem"]');
        first && first.focus();
      }
    }, [open]);
    return (
      <div className="relative">
        <Button
          ref={btnRef}
          size="sm"
          variant="outline"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls="qb-actions-menu"
        >
          {label}
          <svg
            className={`w-3 h-3 ml-1 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M3 4l3 4 3-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
        {open && (
          <div
            id="qb-actions-menu"
            ref={panelRef}
            role="menu"
            className="absolute z-20 mt-1 w-52 rounded-md border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 shadow-lg py-1 text-sm focus:outline-none"
          >
            {React.Children.toArray(children).map((child) => {
              if (!React.isValidElement(child)) return null;
              return React.cloneElement(child, {
                role: "menuitem",
                tabIndex: 0,
                className: `w-full text-left px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-600/60 focus:bg-surface-100 dark:focus:bg-surface-600/60 cursor-pointer outline-none ${
                  child.props.className || ""
                }`,
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    child.props.onClick && child.props.onClick(e);
                  }
                },
              });
            })}
          </div>
        )}
      </div>
    );
  };

  const handleQuestionsGenerated = (questions, meta) => {
    if (Array.isArray(questions)) {
      setGeneratedQuestions((prev) => {
        const base = appendMode ? [...prev, ...questions] : [...questions];
        return dedupeQuestions(base);
      });
      // If a category filter is active but none of the new questions match it, auto-clear the filter
      try {
        if (categoryFilter !== "all") {
          const matchCount = questions.filter((q) => {
            const cNorm = normalizeCategory(q.category || q.type || "");
            return cNorm === categoryFilter;
          }).length;
          if (matchCount === 0) {
            setCategoryFilter("all");
            toast(
              (t) => (
                <span>
                  Category filter cleared (no generated questions matched).
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      setShowGenerator(true);
                    }}
                    className="ml-2 underline"
                  >
                    Regenerate
                  </button>
                </span>
              ),
              { icon: "🔄" }
            );
          }
        }
      } catch (_) {}
      // Track generation info
      setLastGenerationInfo({
        append: appendMode,
        count: questions.length,
        timestamp: Date.now(),
      });
      // Highlight newly appended questions only
      if (appendMode) {
        const newKeys = questions
          .map((q) => (q.text || q.questionText || "").trim().toLowerCase())
          .filter(Boolean);
        setHighlightKeys(newKeys);
        // Clear highlight after 4s
        setTimeout(() => setHighlightKeys([]), 4000);
      } else {
        setHighlightKeys([]);
      }
      // Persist temporarily (so user can navigate back without losing set)
      try {
        const toStore = dedupeQuestions(
          appendMode ? [...generatedQuestions, ...questions] : questions
        );
        localStorage.setItem(
          "hybridGeneratedQuestions",
          JSON.stringify(toStore)
        );
      } catch (_) {}
      // Scroll to results after render
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 50); // eslint-disable-line no-magic-numbers
      const baseMsg = `${appendMode ? "Appended" : "Generated"} ${
        questions.length
      } questions`;
      const fullMsg = meta?.totalQuestions
        ? `${baseMsg} (set size ${meta.totalQuestions})`
        : baseMsg;
      toast.success(fullMsg);
    }
  };

  // Rehydrate previously generated questions (optional UX nicety)
  // Only restore appendMode, tagFilter, sort, favorites, etc. Do NOT auto-load generated questions
  React.useEffect(() => {
    try {
      const storedAppend = localStorage.getItem("qb_appendMode");
      if (storedAppend === "1" || storedAppend === "true") {
        setAppendMode(true);
      }
      const storedFilter = localStorage.getItem("qb_tagFilter");
      if (storedFilter) setTagFilter(storedFilter);
      const storedSort = localStorage.getItem("qb_sortMode");
      if (storedSort) setSortMode(storedSort);
      const storedFavs = localStorage.getItem("qb_favorites");
      if (storedFavs) {
        try {
          const favParsed = JSON.parse(storedFavs);
          if (Array.isArray(favParsed)) setFavorites(favParsed);
        } catch (_) {}
      }
      const storedSearch = localStorage.getItem("qb_searchQuery");
      if (storedSearch) {
        setSearchQuery(storedSearch);
        setRawSearch(storedSearch);
      }
      // favorites-only removed
      const storedTagMode = localStorage.getItem("qb_tagMode");
      if (storedTagMode === "multi") setTagMode("multi");
      const storedMultiTags = localStorage.getItem("qb_multiTags");
      if (storedMultiTags) {
        try {
          const parsed = JSON.parse(storedMultiTags);
          if (Array.isArray(parsed)) setMultiTags(parsed);
        } catch (_) {}
      }
      const storedTagLogic = localStorage.getItem("qb_tagLogic");
      if (storedTagLogic === "AND") setTagLogic("AND");
      // highlight style & export columns customization removed
      // Clean up deprecated keys if they exist
      try {
        localStorage.removeItem("qb_jobRole");
        localStorage.removeItem("qb_experience");
      } catch (_) {}
    } catch (_) {}
  }, []);

  // Persist filters & sort & role/experience when changed
  React.useEffect(() => {
    try {
      localStorage.setItem("qb_tagFilter", tagFilter);
      localStorage.setItem("qb_sortMode", sortMode);
      localStorage.setItem("qb_favorites", JSON.stringify(favorites));
      localStorage.setItem("qb_appendMode", appendMode ? "1" : "0");
      localStorage.setItem("qb_searchQuery", rawSearch);
      localStorage.setItem("qb_categoryFilter", categoryFilter);
      // favorites-only persistence removed
      localStorage.setItem("qb_tagMode", tagMode);
      localStorage.setItem("qb_multiTags", JSON.stringify(multiTags));
      localStorage.setItem("qb_tagLogic", tagLogic);
      // highlight style & export columns persistence removed
    } catch (_) {}
  }, [
    tagFilter,
    sortMode,
    favorites,
    appendMode,
    rawSearch,
    categoryFilter,
    tagMode,
    multiTags,
    tagLogic,
  ]);

  // Debounce raw search into searchQuery
  React.useEffect(() => {
    const handle = setTimeout(() => setSearchQuery(rawSearch), 300);
    return () => clearTimeout(handle);
  }, [rawSearch]);

  // Utility: deduplicate by normalized text hash
  function dedupeQuestions(list) {
    const seen = new Set();
    return list.filter((q) => {
      const text = (q.text || q.questionText || "").trim().toLowerCase();
      if (!text) return false;
      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    });
  }

  const uniqueTags = React.useMemo(() => {
    const tagSet = new Set();
    generatedQuestions.forEach((q) =>
      (q.tags || []).forEach((t) => tagSet.add(t))
    );
    return Array.from(tagSet).sort();
  }, [generatedQuestions]);

  const filteredSortedQuestions = React.useMemo(() => {
    let list = [...generatedQuestions];
    // Category filtering (applies before tag/search filters)
    if (categoryFilter !== "all") {
      list = list.filter((q) => {
        const cNorm = normalizeCategory(q.category || q.type || "");
        return cNorm === categoryFilter;
      });
    }
    // Tag filtering
    if (tagMode === "single" && tagFilter !== "all") {
      list = list.filter((q) => (q.tags || []).includes(tagFilter));
    } else if (tagMode === "multi" && multiTags.length > 0) {
      list = list.filter((q) => {
        const tags = q.tags || [];
        if (tagLogic === "OR") return multiTags.some((t) => tags.includes(t));
        // AND logic
        return multiTags.every((t) => tags.includes(t));
      });
    }
    if (searchQuery.trim()) {
      const qLower = searchQuery.trim().toLowerCase();
      list = list.filter((q) =>
        (q.text || q.questionText || "").toLowerCase().includes(qLower)
      );
    }
    // favorites-only filtering removed
    if (sortMode === "difficulty") {
      const order = {
        beginner: 0,
        easy: 0,
        intermediate: 1,
        medium: 1,
        advanced: 2,
        hard: 2,
      };
      list.sort(
        (a, b) => (order[a.difficulty] || 99) - (order[b.difficulty] || 99)
      );
    } else if (sortMode === "category") {
      list.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    }
    return list;
  }, [
    generatedQuestions,
    tagFilter,
    sortMode,
    searchQuery,
    categoryFilter,
    tagMode,
    multiTags,
    tagLogic,
  ]);

  // Derived relative time for last generation

  function exportSubset(subset, format = "json", filenameBase = "questions") {
    try {
      if (!subset || subset.length === 0) {
        toast.error("No data to export");
        return;
      }
    } catch (_) {
      toast.error("Export failed");
      return;
    }
    let blob;
    const projected = subset.map((q, i) => {
      const base = {
        id: q.id || q._id || `q_${i}`,
        text: q.text || q.questionText || "",
        category: q.category || "",
        difficulty: q.difficulty || "",
        tags: (q.tags || []).join("|"),
        source: q.source || "",
      };
      const obj = {};
      const fixedCols = [
        "id",
        "text",
        "category",
        "difficulty",
        "tags",
        "source",
      ];
      fixedCols.forEach((col) => {
        if (base[col] !== undefined) obj[col] = base[col];
      });
      return obj;
    });
    if (format === "json") {
      blob = new Blob([JSON.stringify(projected, null, 2)], {
        type: "application/json",
      });
    } else {
      const headers = [
        "id",
        "text",
        "category",
        "difficulty",
        "tags",
        "source",
      ];
      const rows = projected.map((row) =>
        headers
          .map((h) => String(row[h] || "").replace(/"/g, '""'))
          .map((cell) => `"${cell}"`)
          .join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      blob = new Blob([csv], { type: "text/csv" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.${format === "json" ? "json" : "csv"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${subset.length} ${format.toUpperCase()} items`);
  }

  async function handleStartInterview() {
    if (startingInterview) return;
    if (generatedQuestions.length === 0) {
      toast.error("Generate questions first");
      return;
    }
    setStartingInterview(true);
    try {
      const first = generatedQuestions[0];
      const config = {
        jobRole: selectedJobRole,
        experienceLevel:
          selectedExperience || first.experienceLevel || "intermediate",
        interviewType: "mixed",
        difficulty: first.difficulty || "intermediate",
        duration: Math.min(60, Math.max(15, generatedQuestions.length * 5)),
        questionCount: generatedQuestions.length,
        adaptiveDifficulty: { enabled: false },
        language,
      };
      toast.loading("Creating interview...", { id: "start-int" });
      const payloadQuestions = generatedQuestions.map((q, i) => ({
        text: q.text || q.questionText || `Question ${i + 1}`,
        category: q.category || q.type || "general",
        difficulty: q.difficulty || config.difficulty,
        tags: q.tags || [],
        source: q.source || "generated",
        estimatedTime: q.estimatedTime || 120,
      }));
      const { data: envelope } = await api.post("/interviews", {
        config,
        questions: payloadQuestions,
        language,
      });
      if (!envelope?.success) {
        throw new Error(envelope?.message || "Create failed");
      }
      const interviewId = envelope.data._id || envelope.data.id;
      toast.loading("Starting interview...", { id: "start-int" });
      const { data: startEnv } = await api.put(
        `/interviews/${interviewId}/start`
      );
      if (!startEnv?.success) {
        throw new Error(startEnv?.message || "Start failed");
      }
      toast.success("Interview created and started", { id: "start-int" });
      navigate(`/interview/${interviewId}`);
    } catch (err) {
      const detail = err.code ? `${err.message} (${err.code})` : err.message;
      toast.error(detail || "Failed to start interview", {
        id: "start-int",
      });
    } finally {
      setStartingInterview(false);
    }
  }

  const questionCategories = React.useMemo(() => {
    const iconMap = {
      behavioral: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
          />
        </svg>
      ),
      technical: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      "system-design": (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    };
    const colorMap = {
      behavioral: "bg-primary-100 text-primary-600",
      technical: "bg-green-100 text-green-600",
      "system-design": "bg-purple-100 text-purple-600",
    };
    const friendly = {
      behavioral: "Behavioral Questions",
      technical: "Technical Questions",
      "system-design": "System Design",
    };
    return Object.entries(CATEGORY_QUESTION_SETS).map(([slug, list]) => {
      // dynamic counts from currently generated set
      const dynCount = generatedQuestions.filter(
        (q) => normalizeCategory(q.category || q.type || "") === slug
      ).length;
      return {
        slug,
        name: friendly[slug] || slug,
        description:
          slug === "behavioral"
            ? "Common behavioral interview questions"
            : slug === "technical"
            ? "Programming and technical questions"
            : "System design and architecture questions",
        color: colorMap[slug],
        icon: iconMap[slug],
        staticCount: list.length,
        dynamicCount: dynCount,
        totalCount: list.length + dynCount,
      };
    });
  }, [generatedQuestions]);

  // Human-friendly label for last generation time (relative minutes)
  const lastGeneratedLabel = React.useMemo(() => {
    if (!lastGenerationInfo?.timestamp) return null;
    const diffMs = Date.now() - lastGenerationInfo.timestamp;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins === 1) return "1 min ago";
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours === 1) return "1 hr ago";
    return `${hours} hrs ago`;
  }, [lastGenerationInfo]);

  return (
    <div className="p-6 bg-surface-50 dark:bg-surface-900 min-h-screen transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
            Question Bank
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Browse and practice with our comprehensive collection of interview
            questions.
          </p>
          {categoryFilter !== "all" && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700">
                Browsing category: {categoryFilter.replace(/-/g, " ")}
              </span>
              <button
                onClick={() => {
                  setCategoryFilter("all");
                  navigate("/questions", { replace: true });
                }}
                className="text-xs px-2 py-1 rounded-md bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200"
              >
                Clear
              </button>
              {generatedQuestions.length === 0 && (
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  Generate a set to view {categoryFilter.replace(/-/g, " ")}{" "}
                  questions.
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionCategories.map((category) => {
            const active = categoryFilter === category.slug;
            return (
              <div
                key={category.name}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setCategoryFilter(category.slug);
                  // Update URL with category query parameter
                  navigate(`/questions?category=${category.slug}`, {
                    replace: true,
                  });
                  // If user hasn't generated yet, prompt them & open generator
                  if (generatedQuestions.length === 0) {
                    setShowGenerator(true);
                    toast(
                      "Select config then Generate to browse this category",
                      {
                        icon: "💡",
                      }
                    );
                  } else {
                    // Smooth scroll to results
                    setTimeout(() => {
                      if (resultsRef.current) {
                        resultsRef.current.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 30);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
                className={`surface-elevated-soft dark:bg-surface-800/40 p-6 hover:shadow-md transition-shadow cursor-pointer border ${
                  active
                    ? "border-primary-300 dark:border-primary-600"
                    : "border-transparent"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4`}
                >
                  {category.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  {category.name}
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500 dark:text-surface-400">
                    {category.totalCount} questions
                  </span>
                  <span
                    className={`text-sm font-medium flex items-center gap-1 ${
                      active
                        ? "text-primary-700 dark:text-primary-300"
                        : "text-primary-600 hover:text-primary-700"
                    }`}
                  >
                    {active ? "Active" : "Browse →"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <div className="surface-elevated dark:bg-surface-800/60 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  Hybrid Question Generation
                </h3>
                <p className="text-surface-700 dark:text-surface-300">
                  Generate a mix of template-based and AI-created questions
                  tailored to your interview needs.
                </p>
              </div>
              <button
                onClick={() => setShowGenerator(!showGenerator)}
                className="btn-primary"
              >
                {showGenerator ? "Hide Generator" : "Generate Questions"}
              </button>
            </div>
          </div>
        </div>

        {/* Hybrid Question Generator */}
        {showGenerator && (
          <div className="mt-8">
            <HybridQuestionGenerator
              onQuestionsGenerated={handleQuestionsGenerated}
              showResults={false}
              appendMode={appendMode}
              onAppendModeChange={setAppendMode}
            />
          </div>
        )}

        {/* Generated Questions Persisted Section */}
        {showGenerator && generatedQuestions.length > 0 && (
          <>
            <div ref={resultsRef} className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-3">
                    Generated Questions ({filteredSortedQuestions.length})
                    {lastGenerationInfo && (
                      <span className="text-xs text-surface-500 dark:text-surface-400 font-normal">
                        {lastGeneratedLabel && `Last: ${lastGeneratedLabel}`}
                      </span>
                    )}
                  </h2>
                  {searchQuery && (
                    <p className="text-xs mt-1 text-surface-500 dark:text-surface-400">
                      Filtered by search: "{searchQuery}"
                    </p>
                  )}
                </div>
                {lastGenerationInfo && (
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full border tracking-wide ${
                        lastGenerationInfo.append
                          ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                          : "bg-surface-100 border-surface-300 text-surface-600 dark:bg-surface-700/50 dark:border-surface-600 dark:text-surface-300"
                      }`}
                    >
                      {lastGenerationInfo.append
                        ? `Appended +${lastGenerationInfo.count}`
                        : `Replaced (${lastGenerationInfo.count})`}
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ActionMenu label="Copy / Export">
                      <div
                        onClick={() => {
                          try {
                            const subset = filteredSortedQuestions.map((q) => ({
                              ...q,
                            }));
                            navigator.clipboard.writeText(
                              JSON.stringify(subset, null, 2)
                            );
                            toast.success(
                              `Copied ${subset.length} filtered questions`
                            );
                          } catch (e) {
                            toast.error("Copy failed");
                          }
                        }}
                      >
                        Copy Filtered
                      </div>
                      <div
                        onClick={() =>
                          exportSubset(
                            filteredSortedQuestions,
                            "json",
                            "filtered-questions"
                          )
                        }
                      >
                        Export JSON
                      </div>
                      <div
                        onClick={() =>
                          exportSubset(
                            filteredSortedQuestions,
                            "csv",
                            "filtered-questions"
                          )
                        }
                      >
                        Export CSV
                      </div>
                      {favorites.length > 0 && (
                        <div
                          onClick={async () => {
                            try {
                              const favQuestions =
                                filteredSortedQuestions.filter((q) => {
                                  const key = (q.text || q.questionText || "")
                                    .trim()
                                    .toLowerCase();
                                  return favorites.includes(key);
                                });
                              await navigator.clipboard.writeText(
                                JSON.stringify(favQuestions, null, 2)
                              );
                              toast.success(
                                `Copied ${favQuestions.length} favorites`
                              );
                            } catch (e) {
                              toast.error("Failed to copy favorites");
                            }
                          }}
                        >
                          Copy Favorites
                        </div>
                      )}
                    </ActionMenu>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setShowGenerator(true)}
                      aria-label={
                        showGenerator
                          ? "Update question generation configuration"
                          : "Regenerate questions"
                      }
                    >
                      {showGenerator ? "Update Config" : "Regenerate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleStartInterview}
                      loading={startingInterview}
                      disabled={
                        startingInterview || generatedQuestions.length === 0
                      }
                      aria-label="Start interview with generated questions"
                    >
                      {startingInterview ? "Starting..." : "Start Interview"}
                    </Button>
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => {
                        setGeneratedQuestions([]);
                        try {
                          localStorage.removeItem("hybridGeneratedQuestions");
                        } catch (_) {}
                        toast("Cleared generated questions");
                      }}
                      aria-label="Clear generated questions"
                      title="Clear generated questions"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
              {/* Difficulty distribution bar */}
              {filteredSortedQuestions.length > 0 && (
                <div className="mb-6">
                  {(() => {
                    const counts = {
                      beginner: 0,
                      intermediate: 0,
                      advanced: 0,
                    };
                    filteredSortedQuestions.forEach((q) => {
                      const d =
                        q.difficulty === "easy"
                          ? "beginner"
                          : q.difficulty === "medium"
                          ? "intermediate"
                          : q.difficulty;
                      if (counts[d] !== undefined) counts[d] += 1;
                    });
                    const total = filteredSortedQuestions.length || 1;
                    const pct = (n) => Math.round((n / total) * 100);
                    return (
                      <div>
                        <div className="flex w-full h-4 rounded overflow-hidden border border-surface-200 dark:border-surface-600">
                          <div
                            className="bg-green-400/70"
                            style={{ width: `${pct(counts.beginner)}%` }}
                            title={`Beginner ${counts.beginner}`}
                          ></div>
                          <div
                            className="bg-yellow-400/70"
                            style={{ width: `${pct(counts.intermediate)}%` }}
                            title={`Intermediate ${counts.intermediate}`}
                          ></div>
                          <div
                            className="bg-red-400/70"
                            style={{ width: `${pct(counts.advanced)}%` }}
                            title={`Advanced ${counts.advanced}`}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-surface-500 dark:text-surface-400">
                          <span>Beginner {counts.beginner}</span>
                          <span>Intermediate {counts.intermediate}</span>
                          <span>Advanced {counts.advanced}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-surface-600 dark:text-surface-300">
                    Tag:
                  </label>
                  {tagMode === "single" && (
                    <StyledSelect
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      size="sm"
                      ariaLabel="Tag filter"
                    >
                      <option value="all">All</option>
                      {uniqueTags.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </StyledSelect>
                  )}
                  {tagMode === "multi" && (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {uniqueTags.map((t) => {
                        const active = multiTags.includes(t);
                        return (
                          <TagPill
                            key={t}
                            label={t}
                            active={active}
                            onClick={() =>
                              setMultiTags((prev) =>
                                prev.includes(t)
                                  ? prev.filter((x) => x !== t)
                                  : [...prev, t]
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-surface-600 dark:text-surface-300">
                    Tag Mode:
                  </label>
                  <StyledSelect
                    value={tagMode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setTagMode(mode);
                      if (mode === "single") setMultiTags([]);
                    }}
                    size="sm"
                    ariaLabel="Tag mode"
                  >
                    <option value="single">Single</option>
                    <option value="multi">Multi</option>
                  </StyledSelect>
                  {tagMode === "multi" && (
                    <StyledSelect
                      value={tagLogic}
                      onChange={(e) => setTagLogic(e.target.value)}
                      size="sm"
                      ariaLabel="Tag logical mode"
                    >
                      <option value="OR">OR</option>
                      <option value="AND">AND</option>
                    </StyledSelect>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-surface-600 dark:text-surface-300">
                    Sort:
                  </label>
                  <StyledSelect
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value)}
                    size="sm"
                    fancy
                    ariaLabel="Sort mode"
                  >
                    <option value="original">Original Order</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="category">Category</option>
                  </StyledSelect>
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  {tagFilter !== "all" && `Filtered to tag: ${tagFilter}`}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-surface-600 dark:text-surface-300">
                    Search:
                  </label>
                  <input
                    type="text"
                    value={rawSearch}
                    onChange={(e) => setRawSearch(e.target.value)}
                    placeholder="Search text..."
                    aria-label="Search questions"
                    className="text-sm px-3 py-2 rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-500 outline-none"
                    style={{ minWidth: "170px" }}
                  />
                </div>
                {/* Export Columns UI removed */}
                {tagMode === "multi" && multiTags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2 items-center text-xs">
                    <span className="text-surface-500 dark:text-surface-400">
                      Active Tags ({tagLogic}):
                    </span>
                    {multiTags.map((t) => {
                      const count = filteredSortedQuestions.filter((q) =>
                        (q.tags || []).includes(t)
                      ).length;
                      return (
                        <TagPill
                          key={t}
                          label={t}
                          active
                          count={count}
                          onClick={() =>
                            setMultiTags((prev) => prev.filter((x) => x !== t))
                          }
                          onRemove={() =>
                            setMultiTags((prev) => prev.filter((x) => x !== t))
                          }
                        />
                      );
                    })}
                    <button
                      onClick={() => setMultiTags([])}
                      className="px-2 py-1 text-xs rounded-md bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-300 dark:hover:bg-surface-600 transition"
                    >
                      Clear All
                    </button>
                  </div>
                )}
                {/* Favorites Only & Highlight Style controls removed */}
              </div>
              {filteredSortedQuestions.length === 0 && (
                <div className="p-6 border border-dashed rounded-lg text-center text-sm text-surface-600 dark:text-surface-400 bg-surface-100/60 dark:bg-surface-800/40">
                  <p className="mb-2 font-medium">
                    No questions match your current filters.
                  </p>
                  <button
                    onClick={() => {
                      setTagFilter("all");
                      setSearchQuery("");
                      // favorites-only removed
                    }}
                    className="text-xs px-3 py-1 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
              <div className="space-y-4">
                {filteredSortedQuestions.map((q, i) => {
                  const normKey = (q.text || q.questionText || "")
                    .trim()
                    .toLowerCase();
                  const isHighlighted = highlightKeys.includes(normKey);
                  return (
                    <div
                      key={q.id || normKey || i}
                      className={`${
                        isHighlighted
                          ? "relative border-l-4 border-green-400 pl-2 rounded"
                          : ""
                      }`}
                    >
                      {q.category && (
                        <div className="mb-2 flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path d="M12 6l7 6-7 6-7-6 7-6z" />
                            </svg>
                            {q.category.charAt(0).toUpperCase() +
                              q.category.slice(1)}
                          </span>
                        </div>
                      )}
                      <QuestionCard
                        question={q}
                        index={i}
                        total={filteredSortedQuestions.length}
                        showTags={true}
                        isFavorite={favorites.includes(normKey)}
                        onToggleFavorite={(question) => {
                          const key = (
                            question.text ||
                            question.questionText ||
                            ""
                          )
                            .trim()
                            .toLowerCase();
                          setFavorites((prev) =>
                            prev.includes(key)
                              ? prev.filter((k) => k !== key)
                              : [...prev, key]
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* aria-live region for screen readers announcing generation events */}
              <span className="sr-only" aria-live="polite">
                {lastGenerationInfo &&
                  (lastGenerationInfo.append
                    ? `Appended ${lastGenerationInfo.count} questions`
                    : `Generated ${lastGenerationInfo.count} questions`)}
              </span>
            </div>
            <Modal
              isOpen={showSmallFavModal}
              onClose={() => {
                setShowSmallFavModal(false);
                setPendingFavSubset(null);
              }}
              title="Small Favorites Set"
              size="sm"
              footer={
                <>
                  <button
                    onClick={() => {
                      setShowSmallFavModal(false);
                      setPendingFavSubset(null);
                    }}
                    className="px-3 py-2 text-sm rounded-md bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-300 dark:hover:bg-surface-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const subset = pendingFavSubset || [];
                      setShowSmallFavModal(false);
                      setPendingFavSubset(null);
                      if (!subset.length) return;
                      const first = subset[0];
                      const questionIds = subset.map(
                        (q, i) =>
                          q.id || q._id || `hash_${(q.text || "").length}_${i}`
                      );
                      const config = {
                        jobRole: selectedJobRole,
                        experienceLevel:
                          selectedExperience ||
                          first.experienceLevel ||
                          "intermediate",
                        interviewType: "mixed",
                        difficulty: first.difficulty || "intermediate",
                        duration: Math.min(60, Math.max(15, subset.length * 5)),
                        questionCount: subset.length,
                        adaptiveDifficulty: { enabled: false },
                        questionIds,
                      };
                      (async () => {
                        try {
                          const { data: envelope } = await api.post(
                            "/interviews",
                            { config, questions: subset, questionIds }
                          );
                          if (!envelope?.success)
                            throw new Error(
                              envelope?.message || "Create failed"
                            );
                          const interviewId =
                            envelope.data._id || envelope.data.id;
                          const { data: startEnv } = await api.put(
                            `/interviews/${interviewId}/start`
                          );
                          if (!startEnv?.success)
                            throw new Error(
                              startEnv?.message || "Start failed"
                            );
                          toast.success("Interview (favorites subset) started");
                          navigate(`/interview/${interviewId}`);
                        } catch (err) {
                          toast.error(
                            err.message || "Failed to start interview"
                          );
                        }
                      })();
                    }}
                    className="px-3 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700"
                  >
                    Start
                  </button>
                </>
              }
            >
              <p className="text-sm text-surface-600 dark:text-surface-300">
                Only {pendingFavSubset?.length || 0} favorite question
                {(pendingFavSubset?.length || 0) === 1 ? "" : "s"}. Start
                interview anyway?
              </p>
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionBankPage;
