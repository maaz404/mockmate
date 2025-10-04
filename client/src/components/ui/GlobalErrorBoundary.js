import React from "react";

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("GlobalErrorBoundary caught", error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900 px-4">
        <div className="max-w-md w-full surface-elevated dark:bg-surface-800/60 p-8 text-center">
          <h1 className="text-xl font-semibold mb-3 text-red-600 dark:text-red-400">Something went wrong</h1>
          <p className="text-sm text-surface-600 dark:text-surface-300 mb-4">
            An unexpected error occurred while loading the app. Try refreshing the page. If the problem persists, please report the issue.
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre className="text-xs text-left whitespace-pre-wrap bg-surface-100 dark:bg-surface-900/40 p-3 rounded border border-surface-200 dark:border-surface-700 max-h-60 overflow-auto">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-5 btn-primary py-2 text-sm"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default GlobalErrorBoundary;