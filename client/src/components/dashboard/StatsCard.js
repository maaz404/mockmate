import React from "react";

const StatsCard = ({ title, value, icon, change, trend = "neutral" }) => {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>

      {change && (
        <div className="mt-4">
          <p className={`text-sm ${getTrendColor()}`}>{change}</p>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
