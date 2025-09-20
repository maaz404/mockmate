import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

const ReportsPage = () => {
  return (
    <div className="min-h-screen bg-surface-100 flex">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-20 px-6 pb-8 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-surface-900">
              Reports & Analytics
            </h1>
            <p className="mt-2 text-surface-500">
              Track your progress and analyze your interview performance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-surface-900 mb-2">
                Overall Score
              </h3>
              <div className="text-3xl font-bold text-orange-600">85%</div>
              <p className="text-surface-500">Average performance</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-surface-900 mb-2">
                Interviews Completed
              </h3>
              <div className="text-3xl font-bold text-blue-600">12</div>
              <p className="text-surface-500">This month</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-surface-900 mb-2">
                Improvement
              </h3>
              <div className="text-3xl font-bold text-green-600">+15%</div>
              <p className="text-surface-500">From last month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-xl font-semibold text-surface-900 mb-4">
              Detailed Analytics Coming Soon
            </h3>
            <p className="text-surface-500">
              We're working on comprehensive analytics to help you track your
              progress in detail.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;
