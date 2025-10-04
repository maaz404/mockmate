import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ProgressChart = ({ analytics, metrics }) => {
  const [range, setRange] = useState(() => {
    try {
      return localStorage.getItem("mm.dashboard.progress.range") || "6w";
    } catch {
      return "6w";
    }
  });

  const progressData = useMemo(() => {
    // Prefer real metrics if available
    if (metrics?.weekly?.weeks?.length) {
      const { weeks, avgScore } = metrics.weekly;
      // weeks already chronological (oldest -> newest)
      const sliceLen = range === "12w" ? 12 : 6;
      const tailWeeks = weeks.slice(-sliceLen);
      const tailScores = avgScore.slice(-sliceLen);
      const tailInterviews = metrics.weekly.interviews.slice(-sliceLen);
      return tailWeeks.map((wk, i) => ({
        name: wk.split("-")[1], // show Wxx part
        score: tailScores[i] == null ? 0 : tailScores[i],
        hasData: tailScores[i] != null,
        interviews: tailInterviews[i] ?? 0,
      }));
    }
    // Fallback to synthetic if metrics missing
    const base = [45, 52, 58, 65, 72, analytics?.analytics?.averageScore || 75];
    const labels =
      range === "12w"
        ? [
            "W1",
            "W2",
            "W3",
            "W4",
            "W5",
            "W6",
            "W7",
            "W8",
            "W9",
            "W10",
            "W11",
            "W12",
          ]
        : ["W1", "W2", "W3", "W4", "W5", "W6"];
    const values = range === "12w" ? [...base, 68, 74, 76, 79, 81, 83] : base;
    return labels.map((name, i) => ({ name, score: values[i], hasData: true, interviews: Math.max(1, Math.round(Math.random()*2)) }));
  }, [analytics, metrics, range]);

  const improvementAreas = analytics?.analytics?.improvementAreas || [
    "Technical Communication",
    "Problem Solving",
    "System Design",
  ];

  const strongAreas = analytics?.analytics?.strongAreas || [
    "JavaScript",
    "React",
    "Teamwork",
  ];

  const coachTip = (() => {
    const avg = analytics?.analytics?.averageScore || 0;
    if (avg < 60)
      return "Focus on fundamentals this week to lift your baseline.";
    if (avg < 80)
      return "You're improving—add concrete examples for extra points.";
    return "Great momentum! Try a harder session to stretch your skills.";
  })();

  return (
    <div className="space-y-6">
      {/* Progress Chart */}
      <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wide text-surface-400">
            Progress
          </p>
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-surface-400">Range</div>
            <div className="inline-flex rounded-md border border-surface-700 overflow-hidden">
              <button
                className={`px-2 py-1 text-[11px] ${
                  range === "6w"
                    ? "bg-surface-800 text-white"
                    : "text-surface-300 hover:bg-surface-800"
                }`}
                onClick={() => {
                  setRange("6w");
                  try {
                    localStorage.setItem("mm.dashboard.progress.range", "6w");
                  } catch {}
                }}
                aria-pressed={range === "6w"}
              >
                6w
              </button>
              <button
                className={`px-2 py-1 text-[11px] border-l border-surface-700 ${
                  range === "12w"
                    ? "bg-surface-800 text-white"
                    : "text-surface-300 hover:bg-surface-800"
                }`}
                onClick={() => {
                  setRange("12w");
                  try {
                    localStorage.setItem("mm.dashboard.progress.range", "12w");
                  } catch {}
                }}
                aria-pressed={range === "12w"}
              >
                12w
              </button>
            </div>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis yAxisId="left" domain={[0, 100]} stroke="#94a3b8" />
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                stroke="#94a3b8"
              />
              <Tooltip
                formatter={(value, key, p) => {
                  if (key === "score")
                    return [
                      `${value}%${p?.payload?.hasData ? "" : " (no data)"}`,
                      "Avg Score",
                    ];
                  if (key === "interviews")
                    return [value, "Interviews"];
                  return [value, key];
                }}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  color: "#f8fafc",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) => (
                  <span className="text-surface-300">{v}</span>
                )}
              />
              <Bar
                yAxisId="right"
                dataKey="interviews"
                barSize={18}
                fill="#6366F1"
                radius={[4, 4, 0, 0]}
                opacity={0.6}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="score"
                name="Avg Score"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={() => 70}
                name="Benchmark"
                stroke="#10B981"
                strokeDasharray="6 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strong Areas */}
      <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 p-6">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-wide text-surface-400">
            Insights
          </p>
          <h3 className="text-lg font-semibold text-white">Strong Areas</h3>
        </div>
        <div className="space-y-2">
          {strongAreas.map((area, index) => (
            <div key={index} className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span className="text-sm text-surface-300">{area}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Areas for Improvement */}
      <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 p-6">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-wide text-surface-400">
            Recommendations
          </p>
          <h3 className="text-lg font-semibold text-white">Focus Areas</h3>
        </div>
        <div className="space-y-2">
          {improvementAreas.map((area, index) => (
            <div key={index} className="flex items-center">
              <div className="w-2 h-2 bg-accent-400 rounded-full mr-3"></div>
              <span className="text-sm text-surface-300">{area}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Practice these areas →
          </button>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-surface-400"
          >
            Coach tip: {coachTip}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
