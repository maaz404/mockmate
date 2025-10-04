import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";

const InterviewHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.get("/interviews");
      if (!res.success)
        throw new Error(res.message || "Failed to load history");
      setItems(res.data?.interviews || []);
    } catch (e) {
      setError(e.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  return (
    <div className="p-6 bg-surface-50 dark:bg-surface-900 min-h-screen transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
            Interview History
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            View and manage your past mock interviews and their results.
          </p>
        </div>

  <div className="surface-elevated p-0 overflow-hidden dark:bg-surface-800/50">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between bg-white/40 dark:bg-transparent backdrop-blur-sm">
            <h3 className="text-base font-semibold text-surface-700 dark:text-surface-200 tracking-wide">Your Interviews</h3>
            <button onClick={fetchInterviews} className="btn-ghost">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-surface-500 dark:text-surface-400">
              Loading…
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-surface-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                No Interviews Yet
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                You haven't completed any mock interviews yet. Start your first
                interview to see your history here.
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate("/interview/new")}
              >
                Start Your First Interview
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto hover-scrollbar">
              <table className="table-base">
                <thead className="table-head">
                  <tr>
                    <th className="px-6 py-3">Job Role</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3">Completed</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i._id} className="table-row">
                      <td className="px-6 py-4 font-medium">
                        {i.config?.jobRole}
                      </td>
                      <td className="px-6 py-4 capitalize">
                        {i.config?.interviewType}
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            i.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : i.status === "in-progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-surface-200 text-surface-700"
                          }`}
                        >
                          {i.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                        {new Date(i.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                        {i.timing?.completedAt
                          ? new Date(i.timing.completedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn-ghost"
                            onClick={() => navigate(`/interview/${i._id}`)}
                          >
                            Open
                          </button>
                          {i.status === "completed" && (
                            <button
                              className="btn-ghost"
                              onClick={() =>
                                navigate(`/interview/${i._id}/results`)
                              }
                            >
                              Results
                            </button>
                          )}
                          {i.status === "completed" && (
                            <button
                              className="btn-ghost"
                              onClick={() =>
                                navigate(`/session-summary/${i._id}`)
                              }
                            >
                              Summary
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewHistoryPage;
