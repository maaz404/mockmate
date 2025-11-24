import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
// Tree-shaken ECharts core imports
import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import * as echarts from "echarts/core";

use([
  LineChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

const PerformanceEChart = ({ data = [], className = "", style = {} }) => {
  const labels = useMemo(() => data.map((d) => d.label || ""), [data]);
  const scores = useMemo(
    () => data.map((d) => (typeof d.score === "number" ? d.score : 0)),
    [data]
  );

  const avgScore = useMemo(() => {
    if (!scores.length) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [scores]);

  // Single consistent color based on average performance
  const lineColor =
    avgScore >= 70 ? "#22c55e" : avgScore >= 50 ? "#f59e0b" : "#ef4444";
  const shadowColor =
    avgScore >= 70
      ? "rgba(34,197,94,0.35)"
      : avgScore >= 50
      ? "rgba(245,158,11,0.35)"
      : "rgba(239,68,68,0.35)";

  const gradientColorStart =
    avgScore >= 70
      ? "rgba(34,197,94,0.9)"
      : avgScore >= 50
      ? "rgba(245,158,11,0.9)"
      : "rgba(239,68,68,0.9)";
  const gradientColorEnd =
    avgScore >= 70
      ? "rgba(34,197,94,0.0)"
      : avgScore >= 50
      ? "rgba(245,158,11,0.0)"
      : "rgba(239,68,68,0.0)";

  const option = useMemo(() => {
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: "rgba(148,163,184,0.3)",
            width: 1,
            type: "dashed",
          },
          lineStyle: {
            color: "rgba(148,163,184,0.3)",
            width: 1,
            type: "dashed",
          },
        },
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        extraCssText: "box-shadow:none;",
        formatter: (params) => {
          if (!params || !params.length) return "";
          const primary = params[0];
          const raw = primary.value;
          if (raw == null) return "";
          const color =
            raw >= 70 ? "#22c55e" : raw >= 50 ? "#f59e0b" : "#ef4444";
          return `\n<div style="padding:12px 16px;min-width:180px;border-radius:16px;background:linear-gradient(135deg,rgba(30,41,59,0.95),rgba(51,65,85,0.95));backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);font-family:inherit;box-shadow:0 8px 32px rgba(0,0,0,0.3);">\n  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">\n    <span style="font-size:11px;font-weight:600;letter-spacing:.8px;color:#cbd5e1;text-transform:uppercase;">Performance</span>\n    <span style="font-size:24px;font-weight:700;color:${color};text-shadow:0 2px 8px ${color}40">${raw}%</span>\n  </div>\n  <div style="font-size:12px;color:#e2e8f0;font-weight:500;margin-top:4px;">${
            primary.axisValueLabel
          }</div>\n  <div style="font-size:10px;color:#94a3b8;margin-top:6px;padding-top:6px;border-top:1px solid rgba(148,163,184,0.2);">${
            raw >= 70 ? "Excellent" : raw >= 50 ? "Good" : "Needs Work"
          }</div>\n</div>`;
        },
      },
      grid: {
        left: "8%",
        right: "6%",
        top: "15%",
        bottom: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: labels,
        axisLine: {
          show: true,
          lineStyle: {
            color: "rgba(148,163,184,0.15)",
            width: 1,
          },
        },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(148,163,184,0.8)",
          fontSize: 11,
          fontWeight: 500,
          margin: 12,
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        interval: 25,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(148,163,184,0.7)",
          fontSize: 11,
          fontWeight: 500,
          formatter: "{value}%",
        },
        splitLine: {
          lineStyle: {
            color: "rgba(148,163,184,0.1)",
            type: "dashed",
          },
        },
      },
      series: [
        {
          name: "Performance Score",
          type: "line",
          smooth: 0.4,
          showSymbol: true,
          symbol: "circle",
          symbolSize: 8,
          data: scores,
          lineStyle: {
            width: 3,
            color: lineColor,
            shadowColor,
            shadowBlur: 10,
            shadowOffsetY: 2,
          },
          itemStyle: {
            color: lineColor,
            borderWidth: 2,
            borderColor: "#fff",
            shadowColor,
            shadowBlur: 6,
          },
          emphasis: {
            focus: "series",
            scale: true,
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor,
            },
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: gradientColorStart },
              {
                offset: 0.4,
                color: gradientColorStart.replace(/0\.9/, "0.4"),
              },
              {
                offset: 0.7,
                color: gradientColorStart.replace(/0\.9/, "0.15"),
              },
              { offset: 1, color: gradientColorEnd },
            ]),
          },
        },
      ],
    };
  }, [
    labels,
    scores,
    lineColor,
    shadowColor,
    gradientColorStart,
    gradientColorEnd,
  ]);

  if (!data || !data.length) {
    return (
      <div
        className={`flex items-center justify-center h-full w-full ${className}`}
        style={style}
      >
        <div className="text-sm text-surface-500">
          No performance data available
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ height: "100%", width: "100%", ...style }}
    >
      <ReactECharts
        option={option}
        echarts={echarts}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
};

export default PerformanceEChart;
