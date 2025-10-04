import React from "react";
import { motion, useReducedMotion } from "framer-motion";

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
  compact = false,
}) => {
  const reduceMotion = useReducedMotion();
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
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative overflow-hidden group rounded-xl p-[1px] bg-gradient-to-br from-primary-500/30 via-fuchsia-500/20 to-transparent dark:from-primary-500/30 dark:via-fuchsia-500/15 shadow-surface-lg hover:shadow-primary-500/20 transition-shadow duration-300"
    >
      <div
        className={`rounded-[11px] h-full w-full bg-white/60 dark:bg-surface-800/60 backdrop-blur-md border border-surface-300/60 dark:border-surface-700/70 ${
          compact ? "p-3" : "p-5"
        } hover:dark:bg-surface-800/80 hover:bg-white/70 transition-colors duration-200`}
      >
        <div
          className={`flex ${
            compact
              ? "items-center justify-between gap-2"
              : "items-start justify-between"
          }`}
        >
          <div className={compact ? "flex items-center gap-2" : ""}>
            <p
              className={`uppercase tracking-wide ${
                compact ? "text-[10px]" : "text-[13px]"
              } font-medium text-surface-500 dark:text-surface-400 group-hover:dark:text-surface-300 group-hover:text-surface-600 transition-colors`}
            >
              {title}
            </p>
            {compact && sparkline && <Sparkline points={sparkline} />}
            {!compact && (
              <p className="mt-1.5 text-3xl font-extrabold text-surface-900 dark:text-white group-hover:dark:text-primary-300 group-hover:text-primary-600 transition-colors">
                {value}
              </p>
            )}
          </div>
          <div className={`flex items-center ${compact ? "gap-1" : "gap-3"}`}>
            {!compact && sparkline && <Sparkline points={sparkline} />}
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.12 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className={`${
                compact ? "text-xl" : "text-3xl"
              } filter group-hover:brightness-110 transition-all duration-200`}
              aria-hidden
            >
              {icon}
            </motion.div>
          </div>
        </div>
        {compact && (
          <p className="text-xl font-bold text-surface-900 dark:text-white group-hover:dark:text-primary-300 group-hover:text-primary-600 transition-colors mt-1">
            {value}
          </p>
        )}
        {change && !compact && (
          <div className="mt-3">
            <p className={`text-sm ${getTrendColor()} transition-colors`}>
              {change}
            </p>
          </div>
        )}
        {change && compact && (
          <p
            className={`text-[11px] mt-1 ${getTrendColor()} transition-colors`}
          >
            {change}
          </p>
        )}
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 bg-primary-500/10 dark:bg-primary-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
};

export default StatsCard;
