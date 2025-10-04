import React, { useEffect, useRef } from 'react';

/**
 * Accessible Modal component (lightweight, no external deps).
 * Props:
 * - isOpen (bool)
 * - onClose (fn)
 * - title (string | node)
 * - children (node)
 * - footer (node) optional custom footer actions
 * - size (sm|md|lg) for width constraint
 */
const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl'
};

export default function Modal({ isOpen, onClose, title, children, footer, size = 'sm', initialFocusRef }) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
      if (e.key === 'Tab') {
        // crude focus trap
        const focusable = panelRef.current?.querySelectorAll(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || !focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [isOpen, onClose]);

  // Manage focus enter/restore
  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement;
      const toFocus = initialFocusRef?.current || panelRef.current?.querySelector('[data-autofocus]') || panelRef.current;
      setTimeout(() => toFocus?.focus(), 10);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previouslyFocused.current?.focus?.();
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        className={`relative w-full ${sizeClasses[size] || sizeClasses.sm} mx-auto bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-lg p-6 focus:outline-none`}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 pr-6">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-surface-700 dark:text-surface-300 space-y-4">{children}</div>
        {(footer !== undefined) ? (
          <div className="mt-6 pt-4 flex justify-end gap-2 border-t border-surface-200 dark:border-surface-700">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
