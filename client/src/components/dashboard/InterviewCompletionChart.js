import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const InterviewCompletionChart = ({ interviews = [] }) => {
  // Calculate completion data from interviews
  let completionData = [
    {
      name: "Completed",
      value: interviews.filter((i) => i.status === "completed").length,
      color: "#10B981",
    },
    {
      name: "In Progress",
      value: interviews.filter((i) => i.status === "in-progress").length,
      color: "#F59E0B",
    },
    {
      name: "Scheduled",
      value: interviews.filter((i) => i.status === "scheduled").length,
      color: "#3B82F6",
    },
  ].filter((item) => item.value > 0);

  // If no real data, show dummy chart
  if (completionData.length === 0) {
    completionData = [
      { name: "Completed", value: 3, color: "#10B981" },
      { name: "In Progress", value: 1, color: "#F59E0B" },
      { name: "Scheduled", value: 2, color: "#3B82F6" },
    ];
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-surface-800 p-3 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700">
          <p className="text-sm font-medium text-surface-900 dark:text-white">
            {data.name}: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex justify-center space-x-6 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-surface-600 dark:text-surface-300">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (completionData.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
          Interview Completion Rate
        </h3>
        <div className="flex items-center justify-center h-64 text-center">
          <div className="text-surface-500 dark:text-surface-400">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">No interview data yet</p>
            <p className="text-xs mt-1">
              Start your first interview to see completion stats
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
        Interview Completion Rate
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={completionData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {completionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InterviewCompletionChart;
