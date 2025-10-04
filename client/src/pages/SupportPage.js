const SupportPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
          Help & Support
        </h1>
        <p className="mt-2 text-surface-500 dark:text-surface-400">
          Get help with MockMate and find answers to common questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card flex flex-col">
          <h3 className="font-heading text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3 flex-1">
            <div className="border-b border-surface-200 dark:border-surface-700 pb-3">
              <h4 className="font-heading font-medium text-surface-900 dark:text-surface-50">
                How do I start an interview?
              </h4>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Click "Create Interview" and follow the setup process...
              </p>
            </div>
            <div className="border-b border-surface-200 dark:border-surface-700 pb-3">
              <h4 className="font-heading font-medium text-surface-900 dark:text-surface-50">
                Can I practice specific question types?
              </h4>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Yes, use the Question Bank to filter by category...
              </p>
            </div>
          </div>
          <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mt-4 self-start">
            View All FAQs →
          </button>
        </div>

        <div className="card flex flex-col">
          <h3 className="font-heading text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
            Contact Support
          </h3>
          <p className="text-surface-500 dark:text-surface-400 mb-6">
            Need personalized help? Our support team is here to assist you.
          </p>
          <div className="space-y-3 flex-1">
            <button className="w-full text-left p-3 border border-surface-200 dark:border-surface-600 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-50">
              📧 Email Support
            </button>
            <button className="w-full text-left p-3 border border-surface-200 dark:border-surface-600 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-50">
              💬 Live Chat
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-8 border bg-gradient-to-r from-primary-50 via-white to-secondary-50 dark:from-surface-800 dark:via-surface-800 dark:to-surface-700 border-surface-200 dark:border-surface-700 transition-colors">
        <h3 className="font-heading text-xl font-semibold text-surface-900 dark:text-surface-50 mb-4">
          Feature Requests
        </h3>
        <p className="text-surface-500 dark:text-surface-400 mb-6">
          Have an idea for a new feature? We'd love to hear from you!
        </p>
        <button className="btn-primary">Submit Feedback</button>
      </div>
    </div>
  );
};

export default SupportPage;
