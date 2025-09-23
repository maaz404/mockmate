import React from "react";

const StatsCard = ({ title, value, icon, change, trend = "neutral" }) => {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-400";
      case "down":
        return "text-red-400";
      default:
        return "text-surface-400";
    }
  };

  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 p-6 hover:shadow-glow hover:bg-surface-800/70 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-surface-400 group-hover:text-surface-300 transition-colors">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white group-hover:text-primary-300 transition-colors">{value}</p>
        </div>
        <div className="text-3xl filter group-hover:brightness-110 transition-all duration-300">{icon}</div>
      </div>

      {change && (
        <div className="mt-4">
          <p className={`text-sm ${getTrendColor()} transition-colors`}>{change}</p>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
