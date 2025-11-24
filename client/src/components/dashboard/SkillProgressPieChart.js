import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { use } from "echarts/core";
import { PieChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import * as echarts from "echarts/core";

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

const palette = [
  "#14B8A6", // teal
  "#0EA5E9", // sky
  "#6366F1", // indigo
  "#F59E0B", // amber
  "#10B981", // emerald
  "#8B5CF6", // violet
];

const SkillProgressPieChart = ({
  data = [],
  className = "",
  style = {},
  mode = "percentage", // 'percentage' | 'count'
  onSliceClick,
}) => {
  const slugify = (str = "") =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const seriesData = useMemo(() => {
    return (data || []).map((d, i) => {
      const value =
        mode === "count"
          ? typeof d.count === "number"
            ? d.count
            : typeof d.progress === "number"
            ? d.progress
            : 0
          : typeof d.progress === "number"
          ? d.progress
          : 0;
      return {
        value,
        name: d.name || `Skill ${i + 1}`,
        rawProgress: typeof d.progress === "number" ? d.progress : 0,
        rawCount: typeof d.count === "number" ? d.count : null,
        itemStyle: {
          color: palette[i % palette.length],
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
      };
    });
  }, [data, mode]);

  const total = useMemo(
    () => seriesData.reduce((sum, s) => sum + (s.value || 0), 0),
    [seriesData]
  );

  const avg = seriesData.length ? Math.round(total / seriesData.length) : 0;

  // Dynamic sizing: more skills = larger chart
  const skillCount = seriesData.length;
  const outerRadius = skillCount > 4 ? "70%" : skillCount > 2 ? "68%" : "65%";
  const innerRadius = skillCount > 4 ? "46%" : skillCount > 2 ? "44%" : "42%";
  const avgRadius = skillCount > 4 ? "38%" : skillCount > 2 ? "36%" : "34%";

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "transparent",
      borderWidth: 0,
      padding: 0,
      extraCssText: "box-shadow:none;",
      formatter: (p) => {
        const color = p.color;
        const unit = mode === "count" && p.data.rawCount != null ? "" : "%";
        return `\n<div style="padding:10px 14px;min-width:160px;border-radius:16px;background:linear-gradient(135deg,rgba(30,41,59,0.92),rgba(51,65,85,0.92));backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);font-family:inherit;">\n  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">\n    <span style="font-size:11px;font-weight:600;letter-spacing:.5px;color:#cbd5e1;text-transform:uppercase;">${p.name}</span>\n    <span style="font-size:22px;font-weight:700;color:${color}">${p.value}${unit}</span>\n  </div>\n</div>`;
      },
    },
    legend: {
      orient: "horizontal",
      bottom: 5,
      left: "center",
      textStyle: {
        color: "var(--surface-600,#334155)",
        fontSize: 12,
        fontWeight: 500,
      },
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 16,
      padding: [8, 8, 8, 8],
      formatter: (name) => {
        const item = seriesData.find((s) => s.name === name);
        if (!item) return name;
        const suffix = mode === "count" && item.rawCount != null ? "" : "%";
        return `${name}  ${item.value}${suffix}`;
      },
    },
    series: [
      {
        name: "Skills",
        type: "pie",
        radius: [innerRadius, outerRadius],
        center: ["50%", "36%"],
        avoidLabelOverlap: true,
        data: seriesData,
        roundCap: true,
        padAngle: 1.5,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: { show: false },
        animation: true,
        animationType: "scale",
        animationEasing: "elasticOut",
        animationDuration: 1200,
        animationDelay: (idx) => idx * 100,
        emphasis: {
          scale: true,
          itemStyle: { shadowBlur: 15, shadowColor: "rgba(0,0,0,0.3)" },
        },
      },
      // Inner ring for average value
      {
        name: "Average",
        type: "pie",
        radius: [0, avgRadius],
        center: ["50%", "36%"],
        silent: true,
        label: { show: false },
        tooltip: { show: false },
        itemStyle: { color: "transparent" },
        animation: true,
        animationType: "expansion",
        animationEasing: "cubicOut",
        animationDuration: 1600,
        animationDelay: 300,
        data: [
          {
            value: 1,
            name: "center",
            label: {
              show: true,
              position: "center",
              formatter: () =>
                mode === "count"
                  ? `{val|${avg}}\n{txt|Avg}`
                  : `{val|${avg}%}\n{txt|Avg}`,
              rich: {
                val: {
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#0f766e",
                  lineHeight: 30,
                },
                txt: {
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  letterSpacing: 0.5,
                  padding: [4, 0, 0, 0],
                },
              },
            },
          },
        ],
      },
    ],
  };

  if (!seriesData.length) {
    return (
      <div
        className={`flex items-center justify-center h-full w-full ${className}`}
        style={style}
      >
        <div className="text-center py-8 text-surface-500 dark:text-surface-400">
          <p className="text-sm font-medium">
            Complete interviews to track your skills
          </p>
        </div>
      </div>
    );
  }

  const onEvents = {
    click: (params) => {
      if (onSliceClick && params && params.name) {
        onSliceClick({ name: params.name, slug: slugify(params.name) });
      }
    },
  };

  return (
    <div
      className={className}
      style={{ height: "100%", width: "100%", ...style }}
    >
      <ReactECharts
        option={option}
        echarts={echarts}
        onEvents={onEvents}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
};

export default SkillProgressPieChart;
