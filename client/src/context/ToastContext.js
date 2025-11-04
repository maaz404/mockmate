import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({
  children,
  defaultDuration = 4000,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState([]);

  // Push a new toast
  const push = useCallback(
    (message, options = {}) => {
      const id = Date.now() + Math.random();
      const toast = {
        id,
        message,
        type: options.type || "info", // success, error, warning, info
        duration: options.duration || defaultDuration,
        ...options,
      };

      setToasts((prev) => {
        const newToasts = [...prev, toast];
        // Limit to maxToasts
        return newToasts.slice(-maxToasts);
      });

      // Auto remove after duration
      if (toast.duration > 0) {
        setTimeout(() => {
          remove(id);
        }, toast.duration);
      }

      return id;
    },
    [defaultDuration, maxToasts]
  );

  // Remove a toast by id
  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Clear all toasts
  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (message, options = {}) => push(message, { ...options, type: "success" }),
    [push]
  );

  const error = useCallback(
    (message, options = {}) => push(message, { ...options, type: "error" }),
    [push]
  );

  const warning = useCallback(
    (message, options = {}) => push(message, { ...options, type: "warning" }),
    [push]
  );

  const info = useCallback(
    (message, options = {}) => push(message, { ...options, type: "info" }),
    [push]
  );

  const value = {
    toasts,
    push,
    remove,
    clear,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
