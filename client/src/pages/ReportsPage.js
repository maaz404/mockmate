import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { reportService } from "../services/mockmate";

const ReportsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0,
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getReports();
      if (!res.success)
        throw new Error(res.message || "Failed to load reports");
      setReports(res.data?.reports || []);
      setPagination(
        res.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalReports: (res.data?.reports || []).length,
        }
      );
    } catch (e) {
      setError(e.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const stats = useMemo(() => {
    if (!reports.length) return { avg: 0, count: 0, improvement: 0 };
    const scores = reports.map((r) => r.overallScore || 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const improvement =
      scores.length > 1 ? scores[0] - scores[scores.length - 1] : 0; // assuming sorted desc by completedAt
    return {
      avg,
      count: pagination.totalReports || reports.length,
      improvement,
    };
  }, [reports, pagination]);

  const handleGenerateReport = async (interviewId) => {
    try {
      const res = await reportService.generateReport(
        interviewId,
        "comprehensive"
      );
      if (res.success) {
        toast.success("Report generated");
      } else {
        throw new Error(res.message || "Failed to generate report");
      }
    } catch (e) {
      toast.error(e.message || "Failed to generate report");
    }
  };

  const handleDownload = async (interviewId, format = "json") => {
    try {
      const base = api.defaults.baseURL || "/api";
      const url =
        format === "pdf"
          ? `${base}/reports/${interviewId}/export-pdf`
          : `${base}/reports/${interviewId}/export?format=${format}`;
      window.open(url, "_blank");
    } catch (e) {
      toast.error("Download failed");
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-surface-500 dark:text-surface-400">
            Track your progress and analyze your interview performance.
          </p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card flex flex-col items-center">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
              Average Score
            </h3>
            <div className="text-3xl font-bold text-primary-600">
              {stats.avg}%
            </div>
            <p className="text-surface-500 dark:text-surface-400">
              Across {stats.count} interview{stats.count === 1 ? "" : "s"}
            </p>
          </div>

          <div className="card flex flex-col items-center">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
              Interviews Completed
            </h3>
            <div className="text-3xl font-bold text-blue-600">
              {stats.count}
            </div>
            <p className="text-surface-500 dark:text-surface-400">
              Total completed
            </p>
          </div>

          <div className="card flex flex-col items-center">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
              Improvement
            </h3>
            <div
              className={`text-3xl font-bold ${
                stats.improvement >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.improvement >= 0 ? "+" : ""}
              {stats.improvement}%
            </div>
            <p className="text-surface-500 dark:text-surface-400">
              Change (latest − oldest)
            </p>
          </div>
        </div>

        {/* Reports list */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Reports</h3>
            <button onClick={() => fetchReports()} className="btn-ghost">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-surface-500 dark:text-surface-400">
              Loading reports…
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : reports.length === 0 ? (
            <div className="p-6 text-center text-surface-500 dark:text-surface-400">
              No completed interviews yet.
            </div>
          ) : (
            <div className="overflow-x-auto hover-scrollbar">
              <table className="table-base">
                <thead className="table-head">
                  <tr>
                    <th className="px-6 py-3">Job Role</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Completed</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.reportId} className="table-row">
                      <td className="px-6 py-4 font-medium">{r.jobRole}</td>
                      <td className="px-6 py-4 capitalize">
                        {r.interviewType}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-sm font-semibold ${
                            (r.overallScore ?? 0) >= 80
                              ? "bg-green-100 text-green-800"
                              : (r.overallScore ?? 0) >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {r.overallScore ?? 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                        {r.completedAt
                          ? new Date(r.completedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn-ghost"
                            onClick={() =>
                              navigate(`/interview/${r.interviewId}/results`)
                            }
                          >
                            View Results
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => handleGenerateReport(r.interviewId)}
                          >
                            Generate Report
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() =>
                              navigate(`/session-summary/${r.interviewId}`)
                            }
                          >
                            Session Summary
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() =>
                              handleDownload(r.interviewId, "json")
                            }
                          >
                            Download JSON
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => handleDownload(r.interviewId, "pdf")}
                          >
                            Export PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination (simple placeholder using totals) */}
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between text-sm">
            <div className="text-surface-600 dark:text-surface-400">
              {pagination.totalReports} total
            </div>
            {/* Server supports pagination params; current fetch uses defaults. Extend when needed. */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
