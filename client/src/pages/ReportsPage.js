import React from "react";

const ReportsPage = () => {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Track your progress and analyze your interview performance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Overall Score
            </h3>
            <div className="text-3xl font-bold text-orange-600">85%</div>
            <p className="text-gray-600">Average performance</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Interviews Completed
            </h3>
            <div className="text-3xl font-bold text-blue-600">12</div>
            <p className="text-gray-600">This month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Improvement
            </h3>
            <div className="text-3xl font-bold text-green-600">+15%</div>
            <p className="text-gray-600">From last month</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Detailed Analytics Coming Soon
          </h3>
          <p className="text-gray-600">
            We're working on comprehensive analytics to help you track your
            progress in detail.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
