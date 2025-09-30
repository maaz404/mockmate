import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";
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

      // Fetch user profile
      const profileResponse = await apiService.get("/users/profile");
      setUserProfile(profileResponse.data || {});

      // Fetch analytics
      const analyticsResponse = await apiService.get("/users/analytics");
      setAnalytics(analyticsResponse.data || {});

      // Fetch recent interviews
      const interviewsResponse = await apiService.get("/interviews?limit=5");
      setRecentInterviews(interviewsResponse.data?.interviews || []);

      // Determine if follow-ups reviewed recently for hint
      try {
        const reviewed = (interviewsResponse.data?.interviews || []).some(
          (iv) => (iv.questions || []).some((q) => q.followUpsReviewed)
        );
        setFollowupsReviewedRecently(reviewed);
      } catch {}

      // Fetch scheduled (paginated)
      await loadScheduled(1);

      // Fetch goals
      try {
        const goalsRes = await apiService.get("/users/goals");
        setGoals(goalsRes.data || []);
      } catch (_e) {
        setGoals([]);
      }

      // Fetch dynamic tips
      try {
        const tipsRes = await apiService.get("/users/tips");
        setTips(tipsRes.data || []);
      } catch (_e) {
        setTips([]);
      }
    } catch (error) {
      setAnalytics(null);
      setUserProfile(null);
      setRecentInterviews([]);
    } finally {
      setLoading(false);
    }
  }, [loadScheduled]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user, fetchDashboardData]);

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

  if (!isLoaded || loading) {
    return <LoadingSpinner />;
  }

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
        {/* Header */}
        <div className="mb-8">
          <DashboardHeader
            user={user}
            userProfile={userProfile}
            onStartInterview={startQuickInterview}
          />
        </div>

        {/* Stats Grid */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
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
            <RecentInterviews
              interviews={recentInterviews}
              onViewAll={() => navigate("/interviews")}
              onOpen={(i) => navigate(`/interview/${i._id}`)}
              onResults={(i) => navigate(`/interview/${i._id}/results`)}
            />

            {/* Scheduled sessions directly under Interview History */}
            <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Scheduled</h4>
                <div className="flex items-center gap-2">
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
                <UpcomingList
                  sessions={scheduled}
                  pagination={schedPagination}
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
              </div>
            </div>
          </div>

          {/* Right column top: Progress and Goals/Tips */}
          <div className="lg:col-span-1 space-y-8">
            <ProgressChart analytics={analytics} />
            <GoalsPanel goals={goals} onToggle={toggleGoal} />
            {followupsReviewedRecently && (
              <div className="text-xs text-green-400">
                Nice work reviewing follow-ups recently—keep it up!
              </div>
            )}
            <TipsPanel tips={tips} />
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
    </div>
  );
};

export default DashboardPage;
