
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

const ResourcesPage = () => {
  return (
    <div className="min-h-screen bg-surface-100 flex">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-20 px-6 pb-8 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-surface-900">Learning Resources</h1>
            <p className="mt-2 text-surface-500">
              Guides, tips, and materials to help you succeed in interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Interview Tips</h3>
              <p className="text-surface-500 mb-6">Essential tips for acing your interviews</p>
              <button className="text-orange-600 hover:text-orange-700 font-medium self-start">Learn More →</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Common Questions</h3>
              <p className="text-surface-500 mb-6">Most frequently asked interview questions</p>
              <button className="text-orange-600 hover:text-orange-700 font-medium self-start">View Questions →</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Career Guides</h3>
              <p className="text-surface-500 mb-6">Role-specific interview preparation guides</p>
              <button className="text-orange-600 hover:text-orange-700 font-medium self-start">Browse Guides →</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResourcesPage;
