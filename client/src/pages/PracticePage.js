import React from "react";

const PracticePage = () => {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Practice Sessions
          </h1>
          <p className="mt-2 text-gray-600">
            Structured practice sessions to improve specific skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Practice
            </h3>
            <p className="text-gray-600 mb-6">
              5-10 minute sessions with immediate feedback
            </p>
            <button className="btn-primary w-full">Start Session</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Focused Practice
            </h3>
            <p className="text-gray-600 mb-6">
              Practice specific question types or skills
            </p>
            <button className="btn-primary w-full">Choose Focus</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Timed Practice
            </h3>
            <p className="text-gray-600 mb-6">
              Practice under time pressure like real interviews
            </p>
            <button className="btn-primary w-full">Set Timer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticePage;
