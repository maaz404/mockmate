import React, { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({
  children,
  defaultDuration = 4000,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { type = "info", duration = defaultDuration } = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        return next.slice(-maxToasts);
      });
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [defaultDuration, maxToasts, remove]
  );

  const api = { push, remove };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-50 top-4 right-4 w-80 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded shadow border text-sm font-medium animate-fadeIn relative group transition-colors
               ${
                 t.type === "success"
                   ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                   : ""
               }
               ${
                 t.type === "error"
                   ? "bg-red-50 border-red-300 text-red-700"
                   : ""
               }
               ${
                 t.type === "warning"
                   ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                   : ""
               }
               ${
                 t.type === "info"
                   ? "bg-surface-800 border-surface-600 text-surface-100"
                   : ""
               }`}
          >
            <button
              aria-label="Dismiss"
              onClick={() => remove(t.id)}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-surface-900/70 text-surface-100 text-xs opacity-0 group-hover:opacity-100 transition"
              style={{ fontSize: "0.65rem" }}
            >
              &times;
            </button>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
};

export default ToastContext;
