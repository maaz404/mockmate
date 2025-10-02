import React from "react";

const PracticePage = () => {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-200">
      <main className="px-6 py-8 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
            Practice Sessions
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Structured practice sessions to improve specific skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card flex flex-col">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Quick Practice
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              5-10 minute sessions with immediate feedback
            </p>
            <button className="btn-primary w-full">Start Session</button>
          </div>

          <div className="card flex flex-col">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Focused Practice
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Practice specific question types or skills
            </p>
            <button className="btn-primary w-full">Choose Focus</button>
          </div>

          <div className="card flex flex-col">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Timed Practice
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Practice under time pressure like real interviews
            </p>
            <button className="btn-primary w-full">Set Timer</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PracticePage;
