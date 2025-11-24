import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../context/LanguageContext";

const EmotionTimelineChart = ({ emotionTimeline }) => {
  const { t } = useLanguage();

  // Emotion color mapping
  const emotionColors = {
    happy: "#10B981", // Green
    neutral: "#6B7280", // Gray
    sad: "#3B82F6", // Blue
    confident: "#14B8A6", // Teal
    surprise: "#F59E0B", // Amber
    fear: "#8B5CF6", // Purple
    nervous: "#F97316", // Orange
  };

  // Transform timeline data for Recharts
  const chartData = useMemo(() => {
    if (!emotionTimeline || emotionTimeline.length === 0) {
      return [];
    }

    return emotionTimeline.map((entry, index) => {
      // Convert timestamp to minutes:seconds
      const totalSeconds = Math.floor(entry.timestamp / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      return {
        index,
        time: timeLabel,
        timestamp: entry.timestamp,
        // Include all emotion scores (0-1 range, convert to percentage)
        happy: ((entry.emotions?.happy || 0) * 100).toFixed(1),
        neutral: ((entry.emotions?.neutral || 0) * 100).toFixed(1),
        sad: ((entry.emotions?.sad || 0) * 100).toFixed(1),
        confident: ((entry.emotions?.confident || 0) * 100).toFixed(1),
        surprise: ((entry.emotions?.surprise || 0) * 100).toFixed(1),
        fear: ((entry.emotions?.fear || 0) * 100).toFixed(1),
        nervous: ((entry.emotions?.nervous || 0) * 100).toFixed(1),
        dominant: entry.emotion,
      };
    });
  }, [emotionTimeline]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-surface-800 border border-surface-600 rounded-lg p-3 shadow-lg">
        <p className="text-surface-200 text-sm font-semibold mb-2">
          {t("time")}: {data.time}
        </p>
        <p className="text-white text-xs font-bold mb-2">
          {t("dominant_emotion")}: {data.dominant}
        </p>
        <div className="space-y-1">
          {payload.map((entry) => (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-surface-300 text-xs">
                {t(entry.dataKey)}: {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="text-center py-8 text-surface-400">
        {t("no_emotion_data")}
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#9CA3AF" }}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#9CA3AF" }}
            label={{
              value: t("emotion_intensity"),
              angle: -90,
              position: "insideLeft",
              style: { fill: "#9CA3AF", fontSize: "12px" },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            iconType="line"
            formatter={(value) => t(value)}
          />

          {/* Lines for each emotion */}
          <Line
            type="monotone"
            dataKey="happy"
            stroke={emotionColors.happy}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="neutral"
            stroke={emotionColors.neutral}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="sad"
            stroke={emotionColors.sad}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="confident"
            stroke={emotionColors.confident}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="surprise"
            stroke={emotionColors.surprise}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="fear"
            stroke={emotionColors.fear}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="nervous"
            stroke={emotionColors.nervous}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmotionTimelineChart;
