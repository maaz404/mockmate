import React from "react";

const SupportPage = () => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="mt-2 text-gray-600">
            Get help with MockMate and find answers to common questions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              <div className="border-b border-gray-200 pb-3">
                <h4 className="font-medium text-gray-900">
                  How do I start an interview?
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Click "Create Interview" and follow the setup process...
                </p>
              </div>
              <div className="border-b border-gray-200 pb-3">
                <h4 className="font-medium text-gray-900">
                  Can I practice specific question types?
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Yes, use the Question Bank to filter by category...
                </p>
              </div>
            </div>
            <button className="text-orange-600 hover:text-orange-700 font-medium mt-4">
              View All FAQs →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Support
            </h3>
            <p className="text-gray-600 mb-6">
              Need personalized help? Our support team is here to assist you.
            </p>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                📧 Email Support
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                💬 Live Chat
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Feature Requests
          </h3>
          <p className="text-gray-600 mb-6">
            Have an idea for a new feature? We'd love to hear from you!
          </p>
          <button className="btn-primary">Submit Feedback</button>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
