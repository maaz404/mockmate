import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import {
  GridSkeleton,
  ListSkeleton,
  CardSkeleton,
} from "../components/dashboard/Skeletons";
import StatsCard from "../components/dashboard/StatsCard";
import RecentInterviews from "../components/dashboard/RecentInterviews";
import QuickActions from "../components/dashboard/QuickActions";
import DashboardHero from "../components/dashboard/DashboardHero";
import AnalyticsTabs from "../components/dashboard/AnalyticsTabs";
import QuickActionDock from "../components/dashboard/QuickActionDock";
import ProgressChart from "../components/dashboard/ProgressChart";
import GoalsPanel from "../components/dashboard/GoalsPanel";
import TipsPanel from "../components/dashboard/TipsPanel";
import UpcomingCard from "../components/dashboard/UpcomingCard";
import SchedulerModal from "../components/dashboard/SchedulerModal";
import UpcomingList from "../components/dashboard/UpcomingList";
import toast from "react-hot-toast";
import { apiService } from "../services/api";
import CommandPalette from "../components/ui/CommandPalette";
import { formatRelativeCountdown, isWithinNextMs } from "../utils/datetime";
import {
  getDashboardCache,
  isDashboardCacheFresh,
  setDashboardCache,
} from "../utils/dashboardCache";
// Lazy-loaded metric widgets used in analytics tabs
const SkillRadar = lazy(() => import("../components/dashboard/SkillRadar"));
const ActivityIndicator = lazy(() =>
  import("../components/dashboard/ActivityIndicator")
);
const CategoryCoverage = lazy(() =>
  import("../components/dashboard/CategoryCoverage")
);
const FollowUpsUsage = lazy(() =>
  import("../components/dashboard/FollowUpsUsage")
);
const StreakWidget = lazy(() => import("../components/dashboard/StreakStrip"));
const NextBestActionCard = lazy(() =>
  import("../components/dashboard/NextBestActionCard")
);

const DashboardPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [metrics, setMetrics] = useState(null); // enhanced time-series & coverage
  const [recommendation, setRecommendation] = useState(null); // next best action
  const [metricsFetchedAt, setMetricsFetchedAt] = useState(null); // timestamp for freshness indicator
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsHorizon, setMetricsHorizon] = useState(() => {
    try {
      const v = parseInt(
        localStorage.getItem("mm.dashboard.metricsHorizon"),
        10
      );
      return !isNaN(v) ? v : 8;
    } catch {
      return 8;
    }
  }); // 4-24 weeks
  const [benchmark, setBenchmark] = useState(() => {
    try {
      const v = parseInt(localStorage.getItem("mm.dashboard.benchmark"), 10);
      return !isNaN(v) ? v : 70;
    } catch {
      return 70;
    }
  }); // target score 0-100
  const prefSyncDebounceRef = useRef();
  const [scheduled, setScheduled] = useState([]);
  const [schedPage, setSchedPage] = useState(1);
  const [schedPagination, setSchedPagination] = useState(null);
  const [goals, setGoals] = useState([]);
  const [tips, setTips] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [statusFilter, setStatusFilter] = useState("scheduled");
  const [followupsReviewedRecently, setFollowupsReviewedRecently] =
    useState(false);
  const [sectionErrors, setSectionErrors] = useState([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem("mm.dashboard.collapsed");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("mm.dashboard.mode") || "full";
    } catch {
      return "full";
    }
  });
  const [statsMode, setStatsMode] = useState(() => {
    try {
      return localStorage.getItem("mm.dashboard.statsMode") || "regular";
    } catch {
      return "regular";
    }
  }); // 'regular' | 'mini'
  const [modeAnnounce, setModeAnnounce] = useState("");
  const [density, setDensity] = useState(() => {
    try {
      return localStorage.getItem("mm.dashboard.density") || "comfortable";
    } catch {
      return "comfortable";
    }
  }); // 'comfortable' | 'compact'
  const [upcomingView, setUpcomingView] = useState(() => {
    try {
      return localStorage.getItem("mm.dashboard.upcoming.view") || "list";
    } catch {
      return "list";
    }
  }); // 'list' | 'week'
  const [thisWeekOnly, setThisWeekOnly] = useState(() => {
    try {
      return localStorage.getItem("mm.dashboard.upcoming.weekOnly") === "1";
    } catch {
      return false;
    }
  });
  const savePrefDebounceRef = useRef();

  const loadScheduled = useCallback(
    async (page) => {
      try {
        const schedRes = await apiService.get(
          `/users/scheduled-sessions?limit=3&page=${page}&status=${statusFilter}`
        );
        setScheduled(schedRes.data || []);
        setSchedPagination(schedRes.pagination || null);
        setSchedPage(page);
      } catch {
        setScheduled([]);
        setSchedPagination(null);
      }
    },
    [statusFilter]
  );

  const fetchMetricsAndRecommendation = useCallback(
    async (h) => {
      const horizon = Math.min(24, Math.max(4, h || metricsHorizon));
      // Use cache if fresh
      if (isDashboardCacheFresh(horizon)) {
        const cache = getDashboardCache();
        setMetrics(cache.metrics || null);
        setRecommendation(cache.recommendation || null);
        return; // skip network
      }
      setMetricsLoading(true);
      let newMetrics = null;
      try {
        const metricsRes = await apiService.get(
          `/users/dashboard/metrics?horizon=${horizon}`
        );
        newMetrics = metricsRes.data || null;
        setMetrics(newMetrics);
      } catch (e) {
        setMetrics(null);
      } finally {
        setMetricsLoading(false);
      }
      let newReco = null;
      try {
        const recoRes = await apiService.get(
          `/users/dashboard/recommendation?horizon=${horizon}`
        );
        newReco = recoRes.data || null;
        setRecommendation(newReco);
      } catch (_er) {
        setRecommendation(null);
      }
      // Update cache after both fetch attempts
      setDashboardCache({
        metrics: newMetrics,
        recommendation: newReco,
        horizon,
      });
      setMetricsFetchedAt(Date.now());
    },
    [metricsHorizon]
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setSectionErrors([]);

      // Load backend preferences first (non-blocking for data)
      try {
        const prefRes = await apiService.get("/users/dashboard/preferences");
        const prefs = prefRes?.data || {};
        if (prefs.density) setDensity(prefs.density);
        if (prefs.upcomingView) {
          setUpcomingView(prefs.upcomingView);
          try {
            localStorage.setItem(
              "mm.dashboard.upcoming.view",
              prefs.upcomingView
            );
          } catch {}
        }
        if (typeof prefs.thisWeekOnly === "boolean") {
          setThisWeekOnly(prefs.thisWeekOnly);
          try {
            localStorage.setItem(
              "mm.dashboard.upcoming.weekOnly",
              prefs.thisWeekOnly ? "1" : "0"
            );
          } catch {}
        }
        if (prefs.metricsHorizon && !isNaN(prefs.metricsHorizon)) {
          setMetricsHorizon(prefs.metricsHorizon);
          try {
            localStorage.setItem(
              "mm.dashboard.metricsHorizon",
              prefs.metricsHorizon
            );
          } catch {}
        }
        if (prefs.benchmark && !isNaN(prefs.benchmark)) {
          setBenchmark(prefs.benchmark);
          try {
            localStorage.setItem("mm.dashboard.benchmark", prefs.benchmark);
          } catch {}
        }
      } catch {}

      // Use aggregated dashboard summary endpoint for faster, consistent loads
      const params = new URLSearchParams({
        interviewsLimit: 5,
        scheduledLimit: 3,
        scheduledStatus: statusFilter,
        includePast: "false",
      }).toString();
      const summary = await apiService.get(
        `/users/dashboard/summary?${params}`
      );

      const data = summary?.data || {};
      setUserProfile(data.profile || null);
      setAnalytics(data.analytics || null);
      setRecentInterviews(data.recentInterviews || []);

      // For hint about follow-up review
      try {
        const reviewed = (data.recentInterviews || []).some((iv) =>
          (iv.questions || []).some((q) => q.followUpsReviewed)
        );
        setFollowupsReviewedRecently(reviewed);
      } catch {}

      // Initialize scheduled from summary response
      if (data.scheduled) {
        setScheduled(data.scheduled.items || []);
        setSchedPagination(data.scheduled.pagination || null);
        setSchedPage(1);
      } else {
        // fallback to route for robustness
        await loadScheduled(1);
      }

      setGoals(data.goals || []);
      setTips(data.tips || []);
      setSectionErrors(
        Array.isArray(data.sectionsWithErrors) ? data.sectionsWithErrors : []
      );

      // Kick off initial metrics & recommendation fetch (separate to allow horizon changes without full dashboard refetch)
      fetchMetricsAndRecommendation(metricsHorizon);
    } catch (error) {
      // fallback: attempt old individual routes minimally
      try {
        const [profileResponse, analyticsResponse, interviewsResponse] =
          await Promise.all([
            apiService.get("/users/profile"),
            apiService.get("/users/analytics"),
            apiService.get("/interviews?limit=5"),
          ]);
        setUserProfile(profileResponse.data || {});
        setAnalytics(analyticsResponse.data || {});
        setRecentInterviews(interviewsResponse.data?.interviews || []);
        await loadScheduled(1);
      } catch (_e) {
        setAnalytics(null);
        setUserProfile(null);
        setRecentInterviews([]);
        setScheduled([]);
        setSchedPagination(null);
      }
    } finally {
      setLoading(false);
    }
  }, [
    loadScheduled,
    statusFilter,
    fetchMetricsAndRecommendation,
    metricsHorizon,
  ]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user, fetchDashboardData]);

  // (moved above)

  // Refetch when horizon changes (after initial load)
  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchMetricsAndRecommendation(metricsHorizon);
  }, [metricsHorizon, isLoaded, user, fetchMetricsAndRecommendation]);

  // Persist and sync metricsHorizon / benchmark preferences (debounced) and refetch recommendation when benchmark changes
  useEffect(() => {
    try {
      localStorage.setItem("mm.dashboard.metricsHorizon", metricsHorizon);
    } catch {}
    if (prefSyncDebounceRef.current) clearTimeout(prefSyncDebounceRef.current);
    prefSyncDebounceRef.current = setTimeout(async () => {
      try {
        await apiService.put("/users/dashboard/preferences", {
          metricsHorizon,
          benchmark,
        });
      } catch {}
    }, 450);
    return () =>
      prefSyncDebounceRef.current && clearTimeout(prefSyncDebounceRef.current);
  }, [metricsHorizon, benchmark]);

  useEffect(() => {
    try {
      localStorage.setItem("mm.dashboard.benchmark", benchmark);
    } catch {}
    if (prefSyncDebounceRef.current) clearTimeout(prefSyncDebounceRef.current);
    prefSyncDebounceRef.current = setTimeout(async () => {
      try {
        await apiService.put("/users/dashboard/preferences", {
          metricsHorizon,
          benchmark,
        });
      } catch {}
      // Only recommendation logic depends on benchmark (metrics unaffected), so refetch recommendation alone
      try {
        const recoRes = await apiService.get(
          `/users/dashboard/recommendation?horizon=${metricsHorizon}`
        );
        setRecommendation(recoRes.data || null);
      } catch {
        setRecommendation(null);
      }
    }, 450);
    return () =>
      prefSyncDebounceRef.current && clearTimeout(prefSyncDebounceRef.current);
  }, [benchmark, metricsHorizon]);

  // Persist density selection
  useEffect(() => {
    try {
      localStorage.setItem("mm.dashboard.density", density);
    } catch {}
    // Save to backend
    (async () => {
      try {
        await apiService.put("/users/dashboard/preferences", { density });
      } catch {}
    })();
  }, [density]);

  // Persist UpcomingList preferences (debounced)
  useEffect(() => {
    try {
      localStorage.setItem("mm.dashboard.upcoming.view", upcomingView);
    } catch {}
    if (savePrefDebounceRef.current) clearTimeout(savePrefDebounceRef.current);
    savePrefDebounceRef.current = setTimeout(async () => {
      try {
        await apiService.put("/users/dashboard/preferences", { upcomingView });
      } catch {}
    }, 400);
    return () =>
      savePrefDebounceRef.current && clearTimeout(savePrefDebounceRef.current);
  }, [upcomingView]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "mm.dashboard.upcoming.weekOnly",
        thisWeekOnly ? "1" : "0"
      );
    } catch {}
    if (savePrefDebounceRef.current) clearTimeout(savePrefDebounceRef.current);
    savePrefDebounceRef.current = setTimeout(async () => {
      try {
        await apiService.put("/users/dashboard/preferences", { thisWeekOnly });
      } catch {}
    }, 400);
    return () =>
      savePrefDebounceRef.current && clearTimeout(savePrefDebounceRef.current);
  }, [thisWeekOnly]);

  // Persist collapsed widgets
  useEffect(() => {
    try {
      localStorage.setItem("mm.dashboard.collapsed", JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);
  useEffect(() => {
    try {
      localStorage.setItem("mm.dashboard.mode", mode);
    } catch {}
    setModeAnnounce(
      `Dashboard mode set to ${
        mode === "full"
          ? "Full (all analytics visible)"
          : "Essential (advanced analytics hidden)"
      }`
    );
  }, [mode]);
  useEffect(() => {
    try {
      localStorage.setItem("mm.dashboard.statsMode", statsMode);
    } catch {}
  }, [statsMode]);

  const toggleCollapse = (key) =>
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  // Command palette keyboard shortcut
  useEffect(() => {
    const onKey = (e) => {
      const mKey = e.ctrlKey || e.metaKey;
      if (mKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      // Density toggle: Ctrl/Cmd + Shift + D
      if (mKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"));
      }
      // Focus Scheduled status filter: Ctrl/Cmd + Shift + F
      if (mKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const el = document.getElementById("upcoming-status-filter");
        if (el) {
          el.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Persist goal toggle
  const toggleGoal = async (index) => {
    const nextGoals = goals.map((g, i) =>
      i === index ? { ...g, done: !g.done } : g
    );
    setGoals(nextGoals);
    try {
      await apiService.put("/users/goals", { goals: nextGoals });
    } catch (_e) {
      // revert on error
      setGoals(goals);
    }
  };

  // CRUD for scheduled sessions
  // refresh handled via loadScheduled

  const saveSession = async (payload) => {
    try {
      if (payload.id) {
        await apiService.put(
          `/users/scheduled-sessions/${payload.id}`,
          payload
        );
      } else {
        await apiService.post("/users/scheduled-sessions", payload);
      }
      toast.success("Session saved");
      await loadScheduled(schedPage);
      setShowScheduler(false);
      setEditSession(null);
    } catch (_e) {}
  };

  const deleteSession = async (session) => {
    try {
      await apiService.delete(`/users/scheduled-sessions/${session._id}`);
      toast.success("Session deleted");
      await loadScheduled(schedPage);
      setShowScheduler(false);
      setEditSession(null);
    } catch (_e) {}
  };

  // Optimistic status change
  const handleStatusChange = async (session, newStatus) => {
    const prev = [...scheduled];
    setScheduled((cur) =>
      cur.map((s) => (s._id === session._id ? { ...s, status: newStatus } : s))
    );
    try {
      await apiService.put(`/users/scheduled-sessions/${session._id}`, {
        ...session,
        status: newStatus,
      });
      toast.success("Status updated");
    } catch (e) {
      setScheduled(prev);
      toast.error("Failed to update status");
    }
  };

  // Quick Schedule from QuickActions
  const handleQuickSchedule = (type) => {
    setEditSession({
      title: `${type[0].toUpperCase()}${type.slice(1)} Practice`,
      type,
      duration: 30,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1h
      notes: "",
    });
    setShowScheduler(true);
  };

  const handleCommand = (id) => {
    if (id.startsWith("start:")) {
      const type = id.split(":")[1];
      startQuickInterview(type);
    } else if (id === "schedule:quick") {
      handleQuickSchedule("mixed");
    } else if (id === "nav:interviews") {
      navigate("/interviews");
    } else if (id === "nav:new") {
      navigate("/interview/new");
    } else if (id === "nav:settings") {
      navigate("/settings");
    }
    setCmdOpen(false);
  };

  // Onboarding modal handled by Layout

  const startQuickInterview = async (type) => {
    try {
      // Map experience levels to match server expectations
      const experienceMapping = {
        entry: "entry",
        junior: "junior",
        mid: "mid",
        senior: "senior",
        lead: "lead",
        executive: "executive",
      };

      const interviewConfig = {
        jobRole:
          userProfile?.professionalInfo?.currentRole || "Software Developer",
        industry: userProfile?.professionalInfo?.industry || "Technology",
        experienceLevel:
          experienceMapping[userProfile?.professionalInfo?.experience] ||
          "junior",
        interviewType: type,
        difficulty: "intermediate", // Default to intermediate for quick interviews
        duration: 30,
        questionCount: 10,
      };

      const response = await apiService.post("/interviews", {
        config: interviewConfig,
      });
      if (response?.success && response?.data?._id) {
        const id = response.data._id;
        // Attempt auto-start (transition scheduled -> in-progress)
        try {
          const startResp = await apiService.put(`/interviews/${id}/start`);
          if (!startResp?.success) {
            // eslint-disable-next-line no-console
            // Warning: Cannot auto-start interview - not successful
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          // Warning: auto-start interview error
        }
        navigate(`/interview/${id}`);
        return;
      }
      const msg = response?.message || "Failed to create interview";
      toast.error(msg);
      // eslint-disable-next-line no-console
      // Error: create interview unexpected response
    } catch (error) {
      // eslint-disable-next-line no-console
      // Error: create interview error
      const detail =
        error?.message || error?.code || "Failed to create interview";
      const readable = /NO_QUESTIONS/.test(error?.code || detail)
        ? "Could not generate questions for this configuration. Try adjusting role, type, or difficulty."
        : detail;
      toast.error(
        readable.includes("Failed to create interview")
          ? readable
          : `Create interview failed: ${readable}`
      );
    }
  };

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  // Derive simple sparkline from recent completed interview scores (last 8)
  const scoreSparkline = (recentInterviews || [])
    .filter((i) => i.status === "completed" && i.results?.overallScore)
    .map((i) => i.results.overallScore)
    .slice(-8);

  // Derive subscription info robustly (prefer analytics.subscription if present, else from profile)
  const effectiveSubscription =
    (analytics && analytics.subscription) || userProfile?.subscription || null;
  const plan = effectiveSubscription?.plan || "free";
  const remaining =
    plan === "free" ? effectiveSubscription?.interviewsRemaining ?? 0 : null;

  const stats = analytics
    ? [
        {
          title: "Total Interviews",
          value: analytics.analytics?.totalInterviews || 0,
          icon: "📊",
          change: "+2 this week",
        },
        {
          title: "Average Score",
          value: `${analytics.analytics?.averageScore || 0}%`,
          icon: "🎯",
          change:
            (analytics.analytics?.averageScore || 0) >= 70
              ? "+5% improvement"
              : "Keep practicing!",
          trend:
            scoreSparkline.length >= 2 &&
            scoreSparkline[scoreSparkline.length - 1] >
              scoreSparkline[scoreSparkline.length - 2]
              ? "up"
              : scoreSparkline.length >= 2 &&
                scoreSparkline[scoreSparkline.length - 1] <
                  scoreSparkline[scoreSparkline.length - 2]
              ? "down"
              : "neutral",
          sparkline: scoreSparkline,
        },
        {
          title: "Current Streak",
          value: `${analytics.analytics?.streak?.current || 0} days`,
          icon: "🔥",
          change: `Best: ${analytics.analytics?.streak?.longest || 0} days`,
        },
        {
          title: plan === "free" ? "Interviews Left" : "Plan",
          value: plan === "free" ? remaining : "Unlimited",
          icon: "💎",
          change: plan === "free" ? "Free plan" : "Premium",
        },
      ]
    : [];

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    // Debug state information - isLoaded, hasUser, loading, analyticsLoaded, recentInterviews
  }
  return (
    <div className="relative min-h-screen bg-surface-50 dark:bg-gradient-to-br dark:from-surface-900 dark:via-surface-900 dark:to-surface-950 py-8 transition-colors duration-200">
      {/* Decorative grid overlay */}
      <div className="pointer-events-none absolute inset-0 dark:[mask-image:radial-gradient(circle_at_center,black,transparent)] opacity-[0.35]">
        <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sticky countdown banner for next session within 60 minutes */}
        {scheduled?.[0]?.scheduledAt &&
          isWithinNextMs(scheduled[0].scheduledAt, 60 * 60 * 1000) && (
            <div className="sticky top-2 z-10 mb-4 rounded-lg border border-primary-500/30 bg-primary-900/20 text-primary-200 px-4 py-2 flex items-center justify-between">
              <div className="text-sm">
                Next session starts in{" "}
                {formatRelativeCountdown(scheduled[0].scheduledAt)}
              </div>
              <button
                className="btn-outline btn-xs"
                onClick={() => {
                  setEditSession(scheduled[0]);
                  setShowScheduler(true);
                }}
              >
                Edit
              </button>
            </div>
          )}
        {/* Hero + KPI Ribbon + Original Header Controls */}
        <div className="space-y-6 mb-8">
          <DashboardHero
            user={user}
            profileCompleteness={
              userProfile?.analytics?.profileCompleteness ||
              userProfile?.profileCompleteness ||
              0
            }
            streak={
              userProfile?.streak?.current ||
              analytics?.analytics?.streak?.current ||
              0
            }
            onboardingCompleted={!!userProfile?.onboardingCompleted}
            onStart={startQuickInterview}
            onCreate={() => navigate("/interview/new")}
            nextSession={scheduled?.[0]?.scheduledAt}
            consistency={metrics?.consistencyScore}
            openGoals={(goals || []).filter((g) => !g.done).length}
          />
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px]">
            <div className="inline-flex items-center gap-2">
              <span className="text-surface-400">Dashboard Mode:</span>
              <div className="inline-flex rounded-md border border-surface-700 overflow-hidden">
                <button
                  className={`px-2 py-1 ${
                    mode === "essential"
                      ? "bg-surface-800 text-white"
                      : "text-surface-300 hover:bg-surface-800"
                  }`}
                  onClick={() => setMode("essential")}
                  aria-pressed={mode === "essential"}
                >
                  Essential
                </button>
                <button
                  className={`px-2 py-1 border-l border-surface-700 ${
                    mode === "full"
                      ? "bg-surface-800 text-white"
                      : "text-surface-300 hover:bg-surface-800"
                  }`}
                  onClick={() => setMode("full")}
                  aria-pressed={mode === "full"}
                >
                  Full
                </button>
              </div>
            </div>
            {mode === "essential" && (
              <span className="text-surface-500">
                Advanced analytics hidden (switch to Full to view)
              </span>
            )}
            {mode === "full" &&
              (() => {
                const anyCollapsed = Object.values(collapsed).some(Boolean);
                if (!anyCollapsed) return null;
                return (
                  <button
                    className="text-[11px] px-2 py-1 rounded-md border border-surface-700 hover:bg-surface-700/60 text-surface-300"
                    onClick={() => setCollapsed({})}
                  >
                    Show All
                  </button>
                );
              })()}
          </div>
          <div aria-live="polite" className="sr-only">
            {modeAnnounce}
          </div>
        </div>

        {/* Section errors banner (non-blocking) */}
        {sectionErrors.length > 0 && (
          <div className="mb-6 rounded-lg border border-yellow-600/30 bg-yellow-900/20 text-yellow-200 px-4 py-3">
            Some dashboard sections failed to load: {sectionErrors.join(", ")}.
            Data may be partial.
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <GridSkeleton />
        ) : (
          analytics && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-surface-500 dark:text-surface-300 tracking-wide uppercase flex items-center gap-2">
                Key Metrics
                {metricsFetchedAt && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      Date.now() - metricsFetchedAt < 30000
                        ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40"
                        : "bg-surface-700/40 text-surface-400 border-surface-600"
                    }`}
                  >
                    ●{" "}
                    <span>
                      {Math.round((Date.now() - metricsFetchedAt) / 1000)}s
                    </span>
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  className={`px-2 py-1 rounded-md border border-surface-600/40 dark:border-surface-600 ${
                    statsMode === "regular"
                      ? "bg-surface-800 text-white"
                      : "text-surface-400 hover:text-surface-200"
                  }`}
                  onClick={() => setStatsMode("regular")}
                  aria-pressed={statsMode === "regular"}
                >
                  Full
                </button>
                <button
                  className={`px-2 py-1 rounded-md border border-surface-600/40 dark:border-surface-600 ${
                    statsMode === "mini"
                      ? "bg-surface-800 text-white"
                      : "text-surface-400 hover:text-surface-200"
                  }`}
                  onClick={() => setStatsMode("mini")}
                  aria-pressed={statsMode === "mini"}
                >
                  Mini
                </button>
              </div>
            </div>
          )
        )}
        {!loading && analytics && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.07, delayChildren: 0.05 },
              },
            }}
            initial="hidden"
            animate="show"
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${
              statsMode === "mini" ? "items-stretch" : ""
            }`}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <StatsCard {...stat} compact={statsMode === "mini"} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Quick Actions */}
        <QuickActions
          onStartInterview={startQuickInterview}
          userProfile={userProfile}
          onQuickSchedule={handleQuickSchedule}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Recent Interviews */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <ListSkeleton items={3} />
            ) : (
              <RecentInterviews
                interviews={recentInterviews}
                onViewAll={() => navigate("/interviews")}
                onOpen={(i) => navigate(`/interview/${i._id}`)}
                onResults={(i) => navigate(`/interview/${i._id}/results`)}
              />
            )}

            {/* Scheduled sessions directly under Interview History */}
            <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Scheduled</h4>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center text-[11px] rounded-md border border-surface-700 overflow-hidden">
                    <button
                      className={`px-2 py-1 ${
                        density === "comfortable"
                          ? "bg-surface-800 text-white"
                          : "text-surface-300 hover:bg-surface-800"
                      }`}
                      onClick={() => setDensity("comfortable")}
                      aria-pressed={density === "comfortable"}
                    >
                      Comfy
                    </button>
                    <button
                      className={`px-2 py-1 border-l border-surface-700 ${
                        density === "compact"
                          ? "bg-surface-800 text-white"
                          : "text-surface-300 hover:bg-surface-800"
                      }`}
                      onClick={() => setDensity("compact")}
                      aria-pressed={density === "compact"}
                    >
                      Compact
                    </button>
                  </div>
                  <a
                    href="/scheduled"
                    className="text-xs text-surface-400 hover:text-surface-200"
                  >
                    View all
                  </a>
                  <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                    {schedPagination?.total ?? scheduled.length}
                  </span>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setEditSession(null);
                      setShowScheduler(true);
                    }}
                  >
                    New
                  </button>
                </div>
              </div>
              <UpcomingCard
                next={
                  scheduled[0]
                    ? {
                        title: scheduled[0].title,
                        when: new Date(
                          scheduled[0].scheduledAt
                        ).toLocaleString(),
                        scheduledAt: scheduled[0].scheduledAt,
                      }
                    : null
                }
              />
              {scheduled[0] && (
                <button
                  className="text-primary-400 hover:text-primary-300 text-xs"
                  onClick={() => {
                    setEditSession(scheduled[0]);
                    setShowScheduler(true);
                  }}
                >
                  Edit next
                </button>
              )}
              <div className="mt-3">
                {loading ? (
                  <ListSkeleton items={3} />
                ) : (
                  <UpcomingList
                    sessions={scheduled}
                    pagination={schedPagination}
                    density={density}
                    viewMode={upcomingView}
                    thisWeekOnly={thisWeekOnly}
                    onChangeViewMode={setUpcomingView}
                    onChangeThisWeekOnly={setThisWeekOnly}
                    onCreate={() => {
                      setEditSession(null);
                      setShowScheduler(true);
                    }}
                    onEdit={(s) => {
                      setEditSession(s);
                      setShowScheduler(true);
                    }}
                    onNextPage={() => loadScheduled(schedPage + 1)}
                    onPrevPage={() => loadScheduled(Math.max(1, schedPage - 1))}
                    onStatusChange={handleStatusChange}
                    statusFilter={statusFilter}
                    onFilterChange={(val) => {
                      setStatusFilter(val);
                      loadScheduled(1);
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right column top: Progress and Goals/Tips */}
          <div className="lg:col-span-1 space-y-8">
            <Suspense
              fallback={
                <div className="bg-surface-800/50 rounded-xl p-5 text-xs text-surface-400">
                  Loading recommendation...
                </div>
              }
            >
              <NextBestActionCard
                recommendation={recommendation}
                metrics={metrics}
                benchmark={benchmark}
                horizonWeeks={metricsHorizon}
                userProfile={userProfile}
                onStartTargeted={async (config) => {
                  try {
                    const response = await apiService.post("/interviews", {
                      config,
                    });
                    if (response.success) {
                      toast.success("Targeted session created");
                      navigate(`/interview/${response.data._id}`);
                    } else {
                      toast.error("Failed to create targeted session");
                    }
                  } catch {
                    toast.error("Failed to create targeted session");
                  }
                }}
              />
            </Suspense>
            <div className="h-px bg-gradient-to-r from-transparent via-surface-600/60 to-transparent my-4" />
            {/* Horizon & Benchmark Controls */}
            <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl border border-surface-700 p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-surface-400">
                    Analytics Scope
                  </p>
                  <h3 className="text-sm font-semibold text-white">
                    Horizon & Benchmark
                  </h3>
                </div>
                {metricsLoading && (
                  <span className="text-[10px] text-surface-500 animate-pulse">
                    Loading…
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-surface-400">
                    Horizon (weeks)
                  </span>
                  <select
                    className="bg-surface-900 border border-surface-600 rounded-md px-2 py-1 text-sm text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                    value={metricsHorizon}
                    onChange={(e) =>
                      setMetricsHorizon(parseInt(e.target.value, 10))
                    }
                  >
                    {[4, 8, 12, 24].map((w) => (
                      <option key={w} value={w}>
                        {w} weeks
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-surface-400 flex items-center justify-between">
                    Benchmark{" "}
                    <span className="text-surface-500">{benchmark}%</span>
                  </span>
                  <input
                    type="range"
                    min={40}
                    max={95}
                    step={1}
                    value={benchmark}
                    aria-valuemin={40}
                    aria-valuemax={95}
                    aria-valuenow={benchmark}
                    onChange={(e) => setBenchmark(parseInt(e.target.value, 10))}
                    className="w-full accent-primary-500 cursor-pointer"
                  />
                </label>
              </div>
              <p className="text-[10px] text-surface-500 leading-snug">
                Horizon shapes trend & coverage analysis; benchmark influences
                readiness and warm-up recommendations.
              </p>
            </div>
            {loading || metricsLoading ? (
              <div className="relative rounded-xl border border-surface-700/70 bg-surface-800/40 backdrop-blur-sm p-6 overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.06)_40%,rgba(255,255,255,0)_80%)] bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
                <div className="h-5 w-40 bg-surface-700/60 rounded mb-4" />
                <div className="h-48 w-full rounded bg-surface-700/40" />
                <style>{`@keyframes shimmer {0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
              </div>
            ) : (
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.97 },
                  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
                }}
                initial="hidden"
                animate="show"
                className="relative rounded-xl border border-surface-700/70 bg-surface-800/50 backdrop-blur-sm p-4 overflow-hidden"
              >
                <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 bg-primary-600/10 blur-3xl rounded-full" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-fuchsia-600/10 blur-3xl rounded-full" />
                <ProgressChart analytics={analytics} metrics={metrics} />
              </motion.div>
            )}
            {loading ? (
              <CardSkeleton lines={4} />
            ) : (
              <GoalsPanel goals={goals} onToggle={toggleGoal} />
            )}
            {followupsReviewedRecently && (
              <div className="text-xs text-green-400">
                Nice work reviewing follow-ups recently—keep it up!
              </div>
            )}
            {loading ? <CardSkeleton lines={4} /> : <TipsPanel tips={tips} />}
            {mode === "full" && (
              <Suspense fallback={<CardSkeleton lines={5} />}>
                <AnalyticsTabs
                  loading={loading || metricsLoading}
                  components={{
                    radar: metrics?.skillDimensions?.length ? (
                      <SkillRadar skills={metrics.skillDimensions} />
                    ) : (
                      <div className="text-xs text-surface-500">
                        No skill data yet.
                      </div>
                    ),
                    tags: metrics?.tagCoverage ? (
                      <div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {metrics.tagCoverage.top.map((t) => (
                            <span
                              key={t.tag}
                              className="px-2 py-0.5 rounded-full bg-surface-700 text-[11px] text-surface-300 border border-surface-600"
                            >
                              {t.tag}
                              <span className="ml-1 text-surface-500">
                                {t.count}
                              </span>
                            </span>
                          ))}
                        </div>
                        {metrics.tagCoverage.missingSuggestions?.length > 0 && (
                          <div className="text-[11px] text-surface-400">
                            Try:{" "}
                            {metrics.tagCoverage.missingSuggestions
                              .slice(0, 4)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-surface-500">
                        No tag data yet.
                      </div>
                    ),
                    coverage: metrics?.categoryCoverage?.length ? (
                      <CategoryCoverage coverage={metrics.categoryCoverage} />
                    ) : (
                      <div className="text-xs text-surface-500">
                        No coverage data yet.
                      </div>
                    ),
                    consistency:
                      metrics?.consistencyScore != null ? (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-surface-400 mb-1">
                            Practice Consistency
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">
                              {metrics.consistencyScore}%
                            </span>
                            <span className="text-[10px] text-surface-500">
                              Last {metricsHorizon}w
                            </span>
                          </div>
                          <div className="mt-1 h-2 rounded bg-surface-700 overflow-hidden">
                            <div
                              className="h-full bg-primary-500"
                              style={{ width: `${metrics.consistencyScore}%` }}
                            />
                          </div>
                          <p className="mt-2 text-[11px] text-surface-400">
                            {metrics.consistencyScore < 40
                              ? "Build a daily micro-practice habit."
                              : metrics.consistencyScore < 70
                              ? "Solid cadence—push for more active days."
                              : "Great consistency—maintain momentum!"}
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-surface-500">
                          No consistency data yet.
                        </div>
                      ),
                    activity: metrics?.lastPracticeAt ? (
                      <ActivityIndicator
                        lastPracticeAt={metrics.lastPracticeAt}
                      />
                    ) : (
                      <div className="text-xs text-surface-500">
                        No activity yet.
                      </div>
                    ),
                    followups: metrics?.followUps ? (
                      <FollowUpsUsage followUps={metrics.followUps} />
                    ) : (
                      <div className="text-xs text-surface-500">
                        No follow-ups yet.
                      </div>
                    ),
                    streak: metrics?.streakDays ? (
                      <StreakWidget days={metrics.streakDays} />
                    ) : (
                      <div className="text-xs text-surface-500">
                        No streak yet.
                      </div>
                    ),
                  }}
                />
              </Suspense>
            )}
            {mode === "full" && (
              <Suspense fallback={<CardSkeleton lines={3} />}>
                {!loading && metrics && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                        Follow-ups
                      </h4>
                      <button
                        className="text-[10px] text-surface-500 hover:text-surface-300"
                        onClick={() => toggleCollapse("followups")}
                      >
                        {collapsed.followups ? "Expand" : "Collapse"}
                      </button>
                    </div>
                    {!collapsed.followups && (
                      <FollowUpsUsage followUps={metrics.followUps} />
                    )}
                  </div>
                )}
              </Suspense>
            )}
            {mode === "full" && (
              <Suspense fallback={<CardSkeleton lines={3} />}>
                {!loading && metrics?.streakDays && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                        Streak
                      </h4>
                      <button
                        className="text-[10px] text-surface-500 hover:text-surface-300"
                        onClick={() => toggleCollapse("streak")}
                      >
                        {collapsed.streak ? "Expand" : "Collapse"}
                      </button>
                    </div>
                    {!collapsed.streak && (
                      <React.Suspense fallback={<CardSkeleton lines={2} />}>
                        {/* Lazy import inline to avoid top-level bundle impact */}
                        <StreakWidget days={metrics.streakDays} />
                      </React.Suspense>
                    )}
                  </div>
                )}
              </Suspense>
            )}
          </div>
        </div>

        {/* Removed old lower section for Scheduled; moved above under Interview History */}

        {/* Onboarding modal is rendered by Layout when required */}
      </div>

      <SchedulerModal
        open={showScheduler}
        onClose={() => {
          setShowScheduler(false);
          setEditSession(null);
        }}
        onSave={saveSession}
        onDelete={deleteSession}
        initial={editSession}
      />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAction={handleCommand}
      />
      <QuickActionDock
        onStart={startQuickInterview}
        onSchedule={() => {
          setEditSession(null);
          setShowScheduler(true);
        }}
        onExport={() => {
          try {
            const blob = new Blob(
              [
                JSON.stringify(
                  {
                    generatedAt: new Date().toISOString(),
                    metrics,
                    recommendation,
                    horizon: metricsHorizon,
                    benchmark,
                  },
                  null,
                  2
                ),
              ],
              { type: "application/json" }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "dashboard-insights.json";
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Insights exported");
          } catch {
            toast.error("Export failed");
          }
        }}
        onScrollTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </div>
  );
};

export default DashboardPage;
