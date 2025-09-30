import React from "react";

const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  description = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative z-[1001] w-full max-w-sm mx-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-2xl">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">
              {description}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 text-surface-800 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
