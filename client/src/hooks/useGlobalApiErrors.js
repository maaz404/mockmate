import { useEffect } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

// Simple subscriber pattern: we push handlers into an array and call them from interceptor
const listeners = [];
export function addApiErrorListener(fn) {
  if (typeof fn === "function") listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// Enhance existing interceptor by attaching a dispatcher once
let interceptorAttached = false;
export function attachGlobalErrorDispatcher() {
  if (interceptorAttached) return;
  interceptorAttached = true;
  api.interceptors.response.use(
    (r) => r,
    (error) => {
      const normalized = error; // Already normalized by base interceptor
      listeners.forEach((l) => {
        try {
          l(normalized);
        } catch (_) {
          /* swallow */
        }
      });
      return Promise.reject(normalized);
    }
  );
}

// Hook: call inside App root
export default function useGlobalApiErrors() {
  useEffect(() => {
    attachGlobalErrorDispatcher();

    const off = addApiErrorListener((err) => {
      // Ignore cancellations
      if (err?.code === "ERR_CANCELED") return;

      // Map specific codes to friendly toasts / flows
      switch (err.code) {
        case "INTERVIEW_LIMIT":
          toast.error("Interview limit reached — upgrade to continue.");
          break;
        case "NO_QUESTIONS":
          toast.error(
            "No questions available for that configuration. Try different filters."
          );
          break;
        case "FOLLOWUP_GEN_FAILED":
          toast("Could not generate follow-up; using fallback.", {
            icon: "⚠️",
          });
          break;
        case "DB_NOT_CONNECTED":
          toast.error("Service temporarily unavailable (DB).");
          break;
        case "UNAUTHORIZED":
          // Let redirect happen from base interceptor, optionally show toast
          toast.error("Please log in again.");
          break;
        default:
          // Only show generic error if not a handled success=false envelope consumed locally
          if (err.status >= 500) {
            toast.error(err.message || "Server error");
          } else if (err.status >= 400 && !err.code) {
            toast.error(err.message || "Request failed");
          }
          break;
      }
    });

    return () => off();
  }, []);
}
