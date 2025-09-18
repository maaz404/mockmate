import React from "react";

const ResourcesPage = () => {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Learning Resources
          </h1>
          <p className="mt-2 text-gray-600">
            Guides, tips, and materials to help you succeed in interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Interview Tips
            </h3>
            <p className="text-gray-600 mb-6">
              Essential tips for acing your interviews
            </p>
            <button className="text-orange-600 hover:text-orange-700 font-medium">
              Learn More →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Common Questions
            </h3>
            <p className="text-gray-600 mb-6">
              Most frequently asked interview questions
            </p>
            <button className="text-orange-600 hover:text-orange-700 font-medium">
              View Questions →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Career Guides
            </h3>
            <p className="text-gray-600 mb-6">
              Role-specific interview preparation guides
            </p>
            <button className="text-orange-600 hover:text-orange-700 font-medium">
              Browse Guides →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
