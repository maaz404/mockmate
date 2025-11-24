import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useTheme } from "../context/ThemeContext";

/**
 * EmotionRadarChart - ECharts-based radar visualization for facial emotion metrics
 * Adapts to light/dark mode automatically
 * Based on AQI radar chart example with professional styling
 */
const EmotionRadarChart = ({ facialMetrics }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!chartRef.current || !facialMetrics) return;

    // Initialize chart instance if not exists
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const chart = chartInstanceRef.current;

    // Extract facial metrics with fallbacks
    const metrics = {
      eyeContact: facialMetrics.eyeContactScore || 0,
      confidence: facialMetrics.confidenceScore || 0,
      smile: facialMetrics.smilePercentage || 0,
      steadiness: facialMetrics.headSteadiness || 0,
      engagement: 100 - (facialMetrics.offScreenPercentage || 0),
      environment: facialMetrics.environmentQuality || 0,
    };

    // Define theme-aware colors
    const colors = isDarkMode
      ? {
          background: "transparent",
          text: "#E5E7EB",
          axisLine: "#4B5563",
          splitLine: "#374151",
          splitArea1: "rgba(59, 130, 246, 0.05)",
          splitArea2: "rgba(59, 130, 246, 0.02)",
          radarFill: "rgba(59, 130, 246, 0.3)",
          radarStroke: "#60A5FA",
          labelColor: "#9CA3AF",
        }
      : {
          background: "transparent",
          text: "#1F2937",
          axisLine: "#D1D5DB",
          splitLine: "#E5E7EB",
          splitArea1: "rgba(59, 130, 246, 0.08)",
          splitArea2: "rgba(59, 130, 246, 0.03)",
          radarFill: "rgba(59, 130, 246, 0.4)",
          radarStroke: "#3B82F6",
          labelColor: "#6B7280",
        };

    // Configure chart option
    const option = {
      backgroundColor: colors.background,
      title: {
        text: "Performance Metrics",
        left: "center",
        top: 10,
        textStyle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: isDarkMode
          ? "rgba(31, 41, 55, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
        borderWidth: 1,
        textStyle: {
          color: colors.text,
          fontSize: 13,
        },
        formatter: (params) => {
          const data = params.data.value;
          const labels = [
            "Eye Contact",
            "Confidence",
            "Smile",
            "Steadiness",
            "Engagement",
            "Environment",
          ];
          let html = `<div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: ${colors.text};">
              ${params.name}
            </div>`;

          data.forEach((val, idx) => {
            const color =
              val >= 80 ? "#10B981" : val >= 60 ? "#F59E0B" : "#EF4444";
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
                <span style="color: ${colors.labelColor};">${
              labels[idx]
            }:</span>
                <span style="font-weight: 600; margin-left: 12px; color: ${color};">
                  ${Math.round(val)}%
                </span>
              </div>`;
          });

          html += "</div>";
          return html;
        },
      },
      radar: {
        center: ["50%", "55%"],
        radius: "65%",
        startAngle: 90,
        splitNumber: 4,
        shape: "circle",
        axisName: {
          formatter: (value) => value,
          color: colors.text,
          fontSize: 13,
          fontWeight: 500,
        },
        splitLine: {
          lineStyle: {
            color: colors.splitLine,
            width: 1,
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: [colors.splitArea1, colors.splitArea2],
          },
        },
        axisLine: {
          lineStyle: {
            color: colors.axisLine,
            width: 1.5,
          },
        },
        indicator: [
          { name: "Eye Contact", max: 100 },
          { name: "Confidence", max: 100 },
          { name: "Smile", max: 100 },
          { name: "Steadiness", max: 100 },
          { name: "Engagement", max: 100 },
          { name: "Environment", max: 100 },
        ],
      },
      series: [
        {
          name: "Facial Metrics",
          type: "radar",
          symbol: "circle",
          symbolSize: 6,
          emphasis: {
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              borderWidth: 2,
            },
          },
          data: [
            {
              value: [
                metrics.eyeContact,
                metrics.confidence,
                metrics.smile,
                metrics.steadiness,
                metrics.engagement,
                metrics.environment,
              ],
              name: "Your Performance",
              lineStyle: {
                color: colors.radarStroke,
                width: 2,
              },
              itemStyle: {
                color: colors.radarStroke,
                borderColor: colors.radarStroke,
                borderWidth: 2,
              },
              areaStyle: {
                color: colors.radarFill,
              },
            },
          ],
        },
      ],
    };

    chart.setOption(option, true);

    // Handle resize
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [facialMetrics, isDarkMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  if (!facialMetrics) {
    return (
      <div className="flex items-center justify-center h-96 text-surface-500 dark:text-surface-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No facial metrics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={chartRef}
        className="w-full h-96 transition-colors duration-200"
        style={{ minHeight: "384px" }}
      />
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <MetricBadge
          label="Eye Contact"
          value={facialMetrics.eyeContactScore || 0}
        />
        <MetricBadge
          label="Confidence"
          value={facialMetrics.confidenceScore || 0}
        />
        <MetricBadge label="Smile" value={facialMetrics.smilePercentage || 0} />
        <MetricBadge
          label="Steadiness"
          value={facialMetrics.headSteadiness || 0}
        />
        <MetricBadge
          label="Engagement"
          value={100 - (facialMetrics.offScreenPercentage || 0)}
        />
        <MetricBadge
          label="Environment"
          value={facialMetrics.environmentQuality || 0}
        />
      </div>
    </div>
  );
};

// Helper component for metric badges
const MetricBadge = ({ label, value }) => {
  const roundedValue = Math.round(value);
  const colorClass =
    roundedValue >= 80
      ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
      : roundedValue >= 60
      ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
      : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg border ${colorClass} transition-colors duration-200`}
    >
      <span className="font-medium">{label}</span>
      <span className="font-bold tabular-nums">{roundedValue}%</span>
    </div>
  );
};

export default EmotionRadarChart;
