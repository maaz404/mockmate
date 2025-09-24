const ReportsPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
          Reports & Analytics
        </h1>
        <p className="mt-2 text-surface-500 dark:text-surface-400">
          Track your progress and analyze your interview performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-gray-200 dark:border-surface-700 p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Overall Score
          </h3>
          <div className="text-3xl font-bold text-primary-600">85%</div>
          <p className="text-surface-500 dark:text-surface-400">
            Average performance
          </p>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-gray-200 dark:border-surface-700 p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Interviews Completed
          </h3>
          <div className="text-3xl font-bold text-blue-600">12</div>
          <p className="text-surface-500 dark:text-surface-400">This month</p>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-gray-200 dark:border-surface-700 p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Improvement
          </h3>
          <div className="text-3xl font-bold text-green-600">+15%</div>
          <p className="text-surface-500 dark:text-surface-400">
            From last month
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-gray-200 dark:border-surface-700 p-8 text-center">
        <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-4">
          Detailed Analytics Coming Soon
        </h3>
        <p className="text-surface-500 dark:text-surface-400">
          We're working on comprehensive analytics to help you track your
          progress in detail.
        </p>
      </div>
    </div>
  );
};

export default ReportsPage;
