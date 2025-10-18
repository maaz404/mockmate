import { useMemo } from "react";
import { apiService } from "../services/api";
import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext.jsx";

/**
 * Hook to retrieve subscription info from bootstrap then keep an in-memory shape.
 * Provides convenience booleans for gating UI features.
 */
export function useSubscription() {
  const [sub, setSub] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuthContext();

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Wait for auth to resolve to avoid fetching with stale/absent credentials
      if (authLoading) return;
      if (!user) {
        if (mounted) {
          setSub(null);
          setSubLoading(false);
        }
        return;
      }
      try {
        setSubLoading(true);
        const resp = await apiService.get("/bootstrap");
        if (mounted)
          setSub(resp.subscription || resp.data?.subscription || null);
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load subscription");
      } finally {
        if (mounted) setSubLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authLoading, user]);

  const derived = useMemo(() => {
    if (!sub) return { plan: "free", remaining: 0, unlimited: false };
    const remaining = sub.interviewsRemaining ?? null;
    return {
      plan: sub.plan || "free",
      remaining,
      unlimited: remaining === null,
      nextResetDate: sub.nextResetDate ? new Date(sub.nextResetDate) : null,
      isFree: (sub.plan || "free") === "free",
      isPremium: sub.plan === "premium" || sub.plan === "enterprise",
    };
  }, [sub]);

  return { subscription: derived, raw: sub, loading: subLoading, error };
}
