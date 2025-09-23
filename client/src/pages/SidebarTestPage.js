import React from 'react';

const SidebarTestPage = () => {
  return (
    <div className="p-8 bg-surface-50 dark:bg-surface-900 min-h-screen transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-6">
          Sidebar Test Page
        </h1>
        
        <div className="bg-white dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-4">
            Final Round AI Theme Integration
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-4">
            This page demonstrates the integrated Final Round AI theme with:
          </p>
          <ul className="space-y-2 text-surface-600 dark:text-surface-400">
            <li>• ✅ Final Round AI orange branding (#f97316) as primary color</li>
            <li>• ✅ Dark/Light mode toggle with persistence</li>
            <li>• ✅ Left sidebar navigation (visible on this page)</li>
            <li>• ✅ Consistent color palette across all components</li>
            <li>• ✅ Modern dark SaaS aesthetic matching Final Round AI</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3">
              Primary Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                Final Round AI Orange Button
              </button>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Secondary Blue Button
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-3">
              Theme Features
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-primary-600 rounded"></div>
                <span className="text-surface-600 dark:text-surface-400">Primary Orange (#f97316)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-surface-800 dark:bg-surface-200 rounded"></div>
                <span className="text-surface-600 dark:text-surface-400">Surface Colors</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-accent-600 rounded"></div>
                <span className="text-surface-600 dark:text-surface-400">Accent Purple</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarTestPage;