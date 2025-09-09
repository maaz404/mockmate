import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ProgressChart = ({ analytics }) => {
  // Mock data for demonstration - in real app, this would come from API
  const mockProgressData = [
    { name: "Week 1", score: 45 },
    { name: "Week 2", score: 52 },
    { name: "Week 3", score: 58 },
    { name: "Week 4", score: 65 },
    { name: "Week 5", score: 72 },
    { name: "Week 6", score: analytics?.analytics?.averageScore || 75 },
  ];

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

  return (
    <div className="space-y-6">
      {/* Progress Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Performance Trend
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3B82F6"
                strokeWidth="3"
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strong Areas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Strong Areas</h3>
        <div className="space-y-2">
          {strongAreas.map((area, index) => (
            <div key={index} className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">{area}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Areas for Improvement */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Focus Areas</h3>
        <div className="space-y-2">
          {improvementAreas.map((area, index) => (
            <div key={index} className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">{area}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
            Practice these areas →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
