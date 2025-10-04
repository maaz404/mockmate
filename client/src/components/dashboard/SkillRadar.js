import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const SkillRadar = ({ skills }) => {
  if (!skills || !skills.length) return null;
  const data = skills.map((s) => ({
    subject: s.dimension,
    score: s.score || 0,
    prev: s.prevScore ?? null,
  }));
  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl border border-surface-700 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-surface-400">
            Dimensions
          </p>
          <h3 className="text-lg font-semibold text-white">Skill Profile</h3>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#475569" />
            <PolarAngleAxis
              dataKey="subject"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <PolarRadiusAxis
              stroke="#475569"
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <Tooltip
              formatter={(value, name) => [
                `${value}%`,
                name === "score" ? "Current" : "Previous",
              ]}
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#f8fafc",
              }}
            />
            {data.some((d) => d.prev != null) && (
              <Radar
                name="Prev"
                dataKey="prev"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.25}
              />
            )}
            <Radar
              name="Current"
              dataKey="score"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.45}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SkillRadar;
