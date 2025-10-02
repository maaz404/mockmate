import React, { useState, useEffect, useCallback, useRef } from "react";
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
import ProgressChart from "../components/dashboard/ProgressChart";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import GoalsPanel from "../components/dashboard/GoalsPanel";
import TipsPanel from "../components/dashboard/TipsPanel";
import UpcomingCard from "../components/dashboard/UpcomingCard";
import SchedulerModal from "../components/dashboard/SchedulerModal";
import UpcomingList from "../components/dashboard/UpcomingList";
import toast from "react-hot-toast";
import { apiService } from "../services/api";
import CommandPalette from "../components/ui/CommandPalette";
import { formatRelativeCountdown, isWithinNextMs } from "../utils/datetime";

const DashboardPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
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
  }, [loadScheduled, statusFilter]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user, fetchDashboardData]);

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

      if (response.success) {
        navigate(`/interview/${response.data._id}`);
      } else {
        alert("Failed to create interview. Please try again.");
      }
    } catch (error) {
      alert("Failed to create interview. Please try again.");
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
          title: "Interviews Left",
          value:
            analytics.subscription?.plan === "free"
              ? analytics.subscription?.interviewsRemaining || 0
              : "Unlimited",
          icon: "💎",
          change:
            analytics.subscription?.plan === "free" ? "Free plan" : "Premium",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        {/* Header */}
        <div className="mb-8">
          <DashboardHeader
            user={user}
            userProfile={userProfile}
            onStartInterview={startQuickInterview}
          />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>
          )
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
            {loading ? (
              <CardSkeleton lines={4} />
            ) : (
              <ProgressChart analytics={analytics} />
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
    </div>
  );
};

export default DashboardPage;
