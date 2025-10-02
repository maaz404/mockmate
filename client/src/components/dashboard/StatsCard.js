import React from "react";
import { motion } from "framer-motion";

const Sparkline = ({ points = [] }) => {
  if (!points || points.length < 2) return null;
  const width = 80;
  const height = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const delta = last - prev;
  const lastX = (points.length - 1) * step;
  const lastY = height - ((last - min) / range) * height;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="2"
        style={{
          strokeDasharray: 200,
          strokeDashoffset: 200,
          animation: "dash 1.2s ease forwards",
        }}
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill="#2dd4bf" />
      <title>{`Last: ${last}%  •  Δ ${delta >= 0 ? "+" : ""}${delta}%`}</title>
      <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
};

const StatsCard = ({
  title,
  value,
  icon,
  change,
  trend = "neutral",
  sparkline,
}) => {
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
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700 p-5 hover:shadow-glow hover:bg-surface-800/70 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-surface-400 group-hover:text-surface-300 transition-colors tracking-wide uppercase">
            {title}
          </p>
          <p className="mt-1.5 text-3xl font-extrabold text-white group-hover:text-primary-300 transition-colors">
            {value}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sparkline && <Sparkline points={sparkline} />}
          <div
            className="text-3xl filter group-hover:brightness-110 transition-all duration-200"
            aria-hidden
          >
            {icon}
          </div>
        </div>
      </div>

      {change && (
        <div className="mt-3">
          <p className={`text-sm ${getTrendColor()} transition-colors`}>
            {change}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;
