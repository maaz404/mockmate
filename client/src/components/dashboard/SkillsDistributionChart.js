import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const SkillsDistributionChart = ({ skillsData = [] }) => {
  // Normalize incoming data to { name, value } and provide a dummy fallback
  const normalizeData = (data) => {
    if (!Array.isArray(data)) return [];
    return data
      .map((d, i) => {
        const name =
          d?.name ||
          d?.skill ||
          d?.category ||
          d?.label ||
          d?._id ||
          `Skill ${i + 1}`;
        const valueRaw =
          typeof d?.value === "number"
            ? d.value
            : typeof d?.count === "number"
            ? d.count
            : typeof d?.total === "number"
            ? d.total
            : typeof d?.frequency === "number"
            ? d.frequency
            : 0;
        const value = Number.isFinite(valueRaw) ? valueRaw : 0;
        return { name: String(name), value };
      })
      .filter((x) => x.value > 0);
  };

  const normalized = normalizeData(skillsData);
  const chartData =
    normalized.length > 0
      ? normalized
      : [
          { name: "Frontend", value: 4 },
          { name: "Backend", value: 2 },
          { name: "DevOps", value: 1 },
          { name: "Mobile", value: 1 },
          { name: "Full Stack", value: 2 },
        ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-surface-800 p-3 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700">
          <p className="text-sm font-medium text-surface-900 dark:text-white">
            {label}: {payload[0].value} interviews
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
          Skills Distribution
        </h3>
        <div className="flex items-center justify-center h-64 text-center">
          <div className="text-surface-500 dark:text-surface-400">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-sm">No skills data yet</p>
            <p className="text-xs mt-1">
              Complete interviews to see your skill distribution
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
        Skills Distribution
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "currentColor" }}
              className="text-surface-600 dark:text-surface-300"
            />
            <YAxis
              tick={{ fontSize: 12, fill: "currentColor" }}
              className="text-surface-600 dark:text-surface-300"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#8B5CF6"
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SkillsDistributionChart;
