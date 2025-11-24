import React, { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

// Emotion color mapping (consistent with original)
const EMOTION_COLORS = {
  happy: "#10B981",
  neutral: "#6B7280",
  sad: "#3B82F6",
  confident: "#14B8A6",
  surprise: "#F59E0B",
  fear: "#8B5CF6",
  nervous: "#F97316",
};

/**
 * EmotionRadarAQIChart - ECharts-based AQI-style radar visualization for emotion timeline data
 * Replaces the line chart with a comprehensive radar view showing emotion distribution
 */
const EmotionRadarAQIChart = ({ emotionTimeline, emotionAnalytics }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  // Calculate aggregate emotion metrics from timeline
  const emotionMetrics = useMemo(() => {
    // Prefer analytics smoothAverages if available (already averaged & smoothed)
    if (emotionAnalytics?.smoothAverages) {
      const source = emotionAnalytics.smoothAverages;
      // Convert to percentage 0-100
      const mapped = {};
      [
        "happy",
        "neutral",
        "sad",
        "confident",
        "surprise",
        "fear",
        "nervous",
      ].forEach((k) => {
        if (source[k] != null) mapped[k] = Math.round(source[k] * 100);
        else mapped[k] = 0;
      });
      return mapped;
    }
    if (!emotionTimeline || emotionTimeline.length === 0) return null;
    const totals = {
      happy: 0,
      neutral: 0,
      sad: 0,
      confident: 0,
      surprise: 0,
      fear: 0,
      nervous: 0,
    };
    let frames = 0;
    emotionTimeline.forEach((entry) => {
      if (entry.emotions) {
        frames++;
        Object.keys(totals).forEach((e) => {
          totals[e] += entry.emotions[e] || 0;
        });
      }
    });
    if (frames === 0) return null;
    Object.keys(totals).forEach((e) => {
      totals[e] = Math.round((totals[e] / frames) * 100);
    });
    return totals;
  }, [emotionTimeline, emotionAnalytics]);

  useEffect(() => {
    if (!chartRef.current || !emotionMetrics) return;

    // Initialize chart instance if not exists
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const chart = chartInstanceRef.current;

    // Define theme-aware colors
    const colors = isDarkMode
      ? {
          background: "transparent",
          text: "#E5E7EB",
          subText: "#9CA3AF",
          axisLine: "#4B5563",
          splitLine: "#374151",
          splitArea1: "rgba(75, 85, 99, 0.05)",
          splitArea2: "rgba(75, 85, 99, 0.02)",
          tooltipBg: "rgba(31, 41, 55, 0.95)",
          tooltipBorder: "#4B5563",
        }
      : {
          background: "transparent",
          text: "#1F2937",
          subText: "#6B7280",
          axisLine: "#D1D5DB",
          splitLine: "#E5E7EB",
          splitArea1: "rgba(229, 231, 235, 0.3)",
          splitArea2: "rgba(229, 231, 235, 0.15)",
          tooltipBg: "rgba(255, 255, 255, 0.95)",
          tooltipBorder: "#E5E7EB",
        };

    // Prepare data in the order for radar chart
    const emotionOrder = [
      "happy",
      "confident",
      "surprise",
      "neutral",
      "nervous",
      "fear",
      "sad",
    ];

    const emotionData = emotionOrder.map((emotion) => emotionMetrics[emotion]);

    // Get dominant emotion for gradient
    const dominantEmotion = emotionOrder.reduce((prev, current) =>
      emotionMetrics[current] > emotionMetrics[prev] ? current : prev
    );
    const dominantColor = EMOTION_COLORS[dominantEmotion];

    // Configure chart option with enhanced visuals
    const option = {
      backgroundColor: colors.background,
      title: {
        text: t("emotion_timeline") || "Emotion Profile",
        left: "center",
        top: 20,
        textStyle: {
          color: colors.text,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 0.5,
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        textStyle: {
          color: colors.text,
          fontSize: 13,
        },
        formatter: (params) => {
          const data = params.data.value;
          const labels = emotionOrder.map((e) => {
            const name = t(e) || e;
            return name.charAt(0).toUpperCase() + name.slice(1);
          });
          let html = `<div style="padding: 4px;">
            <div style="font-weight: 700; margin-bottom: 10px; color: ${colors.text}; font-size: 14px;">
              Emotion Analysis
            </div>`;

          data.forEach((val, idx) => {
            const emotionName = emotionOrder[idx];
            const color = EMOTION_COLORS[emotionName];
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0;">
                <span style="display: flex; align-items: center;">
                  <span style="display: inline-block; width: 12px; height: 12px; border-radius: 3px; background: linear-gradient(135deg, ${color}, ${color}DD); margin-right: 10px; box-shadow: 0 2px 4px ${color}44;"></span>
                  <span style="color: ${colors.text}; font-weight: 500;">${
              labels[idx]
            }</span>
                </span>
                <span style="font-weight: 700; margin-left: 20px; color: ${color}; font-size: 14px;">
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
          formatter: (value) => {
            const name = t(value) || value;
            return name.charAt(0).toUpperCase() + name.slice(1);
          },
          color: EMOTION_COLORS,
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 3,
          padding: [3, 6],
          backgroundColor: isDarkMode
            ? "rgba(0,0,0,0.3)"
            : "rgba(255,255,255,0.8)",
        },
        splitLine: {
          lineStyle: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.08)",
            width: 2,
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: isDarkMode
              ? ["rgba(255, 255, 255, 0.02)", "rgba(255, 255, 255, 0.04)"]
              : ["rgba(0, 0, 0, 0.02)", "rgba(0, 0, 0, 0.04)"],
          },
        },
        axisLine: {
          lineStyle: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.15)"
              : "rgba(0, 0, 0, 0.15)",
            width: 2,
          },
        },
        indicator: emotionOrder.map((emotion) => ({
          name: emotion,
          max: 100,
          color: EMOTION_COLORS[emotion],
        })),
      },
      series: [
        {
          name: "Emotion Intensity",
          type: "radar",
          symbol: "circle",
          symbolSize: 0,
          lineStyle: {
            width: 3,
            type: "solid",
            shadowBlur: 10,
            shadowColor: `${dominantColor}66`,
          },
          itemStyle: {
            color: dominantColor,
            borderWidth: 0,
          },
          areaStyle: {
            color: {
              type: "radial",
              x: 0.5,
              y: 0.5,
              r: 0.5,
              colorStops: [
                {
                  offset: 0,
                  color: `${dominantColor}80`,
                },
                {
                  offset: 0.5,
                  color: `${dominantColor}50`,
                },
                {
                  offset: 1,
                  color: `${dominantColor}20`,
                },
              ],
            },
          },
          emphasis: {
            lineStyle: {
              width: 4,
              shadowBlur: 15,
            },
          },
          data: [
            {
              value: emotionData,
              name: "Emotion Profile",
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
  }, [emotionMetrics, isDarkMode, t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  if (!emotionMetrics) {
    return (
      <div className="flex items-center justify-center h-96 text-surface-500 dark:text-surface-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>{t("no_emotion_data") || "No emotion data available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={chartRef}
        className="w-full transition-colors duration-200"
        style={{ height: "480px", minHeight: "480px" }}
      />

      {/* Simplified Emotion Stats Grid */}
      <div className="mt-8 grid grid-cols-3 md:grid-cols-7 gap-2">
        {Object.entries(emotionMetrics)
          .sort(([, a], [, b]) => b - a)
          .map(([emotion, value]) => {
            return (
              <div
                key={emotion}
                className="group relative bg-surface-50 dark:bg-surface-800/30 rounded-xl p-4 border border-surface-200 dark:border-surface-700/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  borderTop: `3px solid ${EMOTION_COLORS[emotion]}`,
                }}
              >
                <div className="text-center">
                  <div
                    className="text-2xl font-bold mb-1 transition-colors"
                    style={{ color: EMOTION_COLORS[emotion] }}
                  >
                    {value}%
                  </div>
                  <div className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wide">
                    {t(emotion) || emotion}
                  </div>
                </div>

                {/* Hover effect bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${EMOTION_COLORS[emotion]}, transparent)`,
                  }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default EmotionRadarAQIChart;
