import { useMemo } from "react";
import { apiService } from "../services/api";
import { useEffect, useState } from "react";

/**
 * Hook to retrieve subscription info from bootstrap then keep an in-memory shape.
 * Provides convenience booleans for gating UI features.
 */
export function useSubscription() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await apiService.get("/bootstrap");
        if (mounted)
          setSub(resp.subscription || resp.data?.subscription || null);
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load subscription");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  return { subscription: derived, raw: sub, loading, error };
}
