import React from "react";

const ResourcesPage = () => {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-200">
      <main className="px-6 py-8 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
            Learning Resources
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Guides, tips, and materials to help you succeed in interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card flex flex-col">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Interview Tips
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Essential tips for acing your interviews
            </p>
            <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium self-start">
              Learn More →
            </button>
          </div>

          <div className="card flex flex-col">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Common Questions
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Most frequently asked interview questions
            </p>
            <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium self-start">
              View Questions →
            </button>
          </div>

          <div className="card flex flex-col">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Career Guides
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Role-specific interview preparation guides
            </p>
            <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium self-start">
              Browse Guides →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResourcesPage;
