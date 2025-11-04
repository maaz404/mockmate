import React from "react";
import { useToast } from "../../context/ToastContext";

const Toast = () => {
  const { toasts, remove } = useToast();

  if (toasts.length === 0) return null;

  const getToastStyles = (type) => {
    const baseStyles =
      "shadow-lg rounded-lg p-4 flex items-start gap-3 min-w-[320px] max-w-md animate-slide-in";

    switch (type) {
      case "success":
        return `${baseStyles} bg-green-50 dark:bg-green-900 border-l-4 border-green-500`;
      case "error":
        return `${baseStyles} bg-red-50 dark:bg-red-900 border-l-4 border-red-500`;
      case "warning":
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500`;
      case "info":
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500`;
    }
  };

  const getIcon = (type) => {
    const iconClass = "w-6 h-6 flex-shrink-0";

    switch (type) {
      case "success":
        return (
          <svg
            className={`${iconClass} text-green-500`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className={`${iconClass} text-red-500`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className={`${iconClass} text-yellow-500`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "info":
      default:
        return (
          <svg
            className={`${iconClass} text-blue-500`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getTextColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-800 dark:text-green-100";
      case "error":
        return "text-red-800 dark:text-red-100";
      case "warning":
        return "text-yellow-800 dark:text-yellow-100";
      case "info":
      default:
        return "text-blue-800 dark:text-blue-100";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} pointer-events-auto`}
        >
          {getIcon(toast.type)}

          <div className="flex-1">
            <p className={`text-sm font-medium ${getTextColor(toast.type)}`}>
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => remove(toast.id)}
            className={`${getTextColor(
              toast.type
            )} hover:opacity-70 transition-opacity flex-shrink-0`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
