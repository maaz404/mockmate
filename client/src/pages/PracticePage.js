
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

const PracticePage = () => {
  return (
    <div className="min-h-screen bg-surface-100 flex">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-20 px-6 pb-8 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-surface-900">Practice Sessions</h1>
            <p className="mt-2 text-surface-500">
              Structured practice sessions to improve specific skills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Quick Practice</h3>
              <p className="text-surface-500 mb-6">5-10 minute sessions with immediate feedback</p>
              <button className="btn-primary w-full">Start Session</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Focused Practice</h3>
              <p className="text-surface-500 mb-6">Practice specific question types or skills</p>
              <button className="btn-primary w-full">Choose Focus</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Timed Practice</h3>
              <p className="text-surface-500 mb-6">Practice under time pressure like real interviews</p>
              <button className="btn-primary w-full">Set Timer</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PracticePage;
