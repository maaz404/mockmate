import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CATEGORY_QUESTION_SETS,
  normalizeCategory,
} from "../data/questionBank";
import QuestionCard from "../components/ui/QuestionCard";
import Button from "../components/ui/Button";
import api from "../services/api";
import toast from "react-hot-toast";

// Reuse localStorage key for generated hybrid set if present
// We'll merge static + any generated questions for this category

const QuestionCategoryPage = () => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [generated, setGenerated] = useState([]); // all generated globally (same as bank)
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("original");
  const resultsRef = useRef(null);

  // Validate category
  const staticList = CATEGORY_QUESTION_SETS[categorySlug];
  useEffect(() => {
    if (!staticList) {
      toast.error("Unknown category");
      navigate("/questions", { replace: true });
    }
  }, [staticList, navigate]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("hybridGeneratedQuestions");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setGenerated(parsed);
      }
      const fav = localStorage.getItem("qb_favorites");
      if (fav) {
        const parsed = JSON.parse(fav);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch (_) {}
  }, []);

  const [remoteQuestions, setRemoteQuestions] = useState([]); // fetched from backend for category
  const [loadingRemote, setLoadingRemote] = useState(false);

  async function fetchCategorySet(force = false) {
    if (loadingRemote) return;
    if (!force && remoteQuestions.length > 0) return; // already have
    setLoadingRemote(true);
    try {
      const baseConfig = {
        jobRole: "software-engineer",
        experienceLevel: "intermediate",
        interviewType:
          categorySlug === "behavioral" ? "behavioral" : "technical",
        difficulty: "intermediate",
        questionCount: 10,
      };
      const { data: envelope } = await api.post(
        `/questions/generate/${categorySlug}`,
        { config: baseConfig }
      );
      if (envelope?.success) {
        setRemoteQuestions(envelope.data.questions || []);
      }
    } catch (_) {
      // silent; UX toast optional
    } finally {
      setLoadingRemote(false);
    }
  }

  useEffect(() => {
    // Auto-fetch if user has not generated in main bank and no local questions
    if (staticList && generated.length === 0) {
      fetchCategorySet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, staticList]);

  const mergedQuestions = useMemo(() => {
    if (!staticList) return [];
    const catGen = generated.filter(
      (q) => normalizeCategory(q.category || q.type || "") === categorySlug
    );
    // De-dupe by normalized text
    const seen = new Set();
    const add = (arr) =>
      arr.forEach((q) => {
        const key = (q.text || q.questionText || "").trim().toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
      });
    add(staticList);
    add(catGen);
    add(remoteQuestions);
    // Return combined preserving static first then generated
    return [
      ...staticList.map((q) => ({ ...q, source: q.source || "static" })),
      ...catGen.map((q) => ({ ...q, source: q.source || "generated" })),
      ...remoteQuestions.map((q) => ({ ...q, source: q.source || "remote" })),
    ].filter((q) => {
      if (!search.trim()) return true;
      return (q.text || "").toLowerCase().includes(search.toLowerCase());
    });
  }, [staticList, generated, categorySlug, search, remoteQuestions]);

  const sorted = useMemo(() => {
    const list = [...mergedQuestions];
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
    } else if (sortMode === "source") {
      const order = { static: 0, generated: 1 };
      list.sort((a, b) => (order[a.source] || 99) - (order[b.source] || 99));
    } else if (sortMode === "alphabetical") {
      list.sort((a, b) => (a.text || "").localeCompare(b.text || ""));
    }
    return list;
  }, [mergedQuestions, sortMode]);

  useEffect(() => {
    // Scroll to results when category loads
    if (sorted.length && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [sorted.length]);

  if (!staticList) return null;

  return (
    <div className="p-6 bg-surface-50 dark:bg-surface-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50 capitalize">
            {categorySlug.replace(/-/g, " ")} Questions
          </h1>
          <span className="text-xs px-2 py-1 rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700">
            {sorted.length} total (static + generated + remote)
          </span>
          <Link
            to="/questions"
            className="text-xs px-2 py-1 rounded-md bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200"
          >
            ← All Categories
          </Link>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-surface-600 dark:text-surface-400 mb-1">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="px-3 py-2 rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-surface-600 dark:text-surface-400 mb-1">
              Sort
            </label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="px-3 py-2 rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
            >
              <option value="original">Original Order</option>
              <option value="difficulty">Difficulty</option>
              <option value="source">Source</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {sorted.length === 0 && (
          <div className="border border-dashed rounded-lg p-6 text-center text-surface-600 dark:text-surface-400 text-sm space-y-3">
            <p>
              No questions yet. We can fetch a starter set for this category.
            </p>
            <Button
              size="sm"
              onClick={() => fetchCategorySet(true)}
              loading={loadingRemote}
            >
              {loadingRemote ? "Loading..." : "Fetch Category Set"}
            </Button>
          </div>
        )}

        <div ref={resultsRef} className="space-y-4">
          {sorted.map((q, i) => {
            const key = (q.text || "").toLowerCase();
            return (
              <QuestionCard
                key={key + i}
                question={q}
                index={i}
                total={sorted.length}
                showTags
                isFavorite={favorites.includes(key)}
                onToggleFavorite={() => {
                  setFavorites((prev) =>
                    prev.includes(key)
                      ? prev.filter((k) => k !== key)
                      : [...prev, key]
                  );
                  try {
                    const next = favorites.includes(key)
                      ? favorites.filter((k) => k !== key)
                      : [...favorites, key];
                    localStorage.setItem("qb_favorites", JSON.stringify(next));
                  } catch (_) {}
                }}
              />
            );
          })}
        </div>
        <div className="mt-10 flex gap-3 flex-wrap">
          <Button onClick={() => navigate("/questions")}>
            Back to Categories
          </Button>
          <Button
            variant="subtle"
            onClick={() => fetchCategorySet(true)}
            loading={loadingRemote}
          >
            {loadingRemote ? "Refreshing..." : "Refresh Category Questions"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCategoryPage;
