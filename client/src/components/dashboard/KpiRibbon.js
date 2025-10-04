import React from "react";
import { formatRelativeCountdown } from "../../utils/datetime";

const Pill = ({ label, value, tone = "neutral" }) => {
  const toneClasses = {
    neutral: "bg-surface-700/60 text-surface-300 border-surface-600",
    success: "bg-emerald-600/20 text-emerald-300 border-emerald-500/40",
    warn: "bg-amber-600/20 text-amber-300 border-amber-500/40",
    info: "bg-primary-600/20 text-primary-300 border-primary-500/40",
  }[tone];
  return (
    <div
      className={`text-[11px] px-3 py-1 rounded-full border flex items-center gap-1 ${toneClasses}`}
    >
      {label}: <span className="font-medium">{value}</span>
    </div>
  );
};

const KpiRibbon = ({ nextSession, consistency, openGoals }) => {
  return (
    <div className="flex flex-wrap gap-3 items-center mt-6">
      <Pill
        label="Next"
        value={nextSession ? formatRelativeCountdown(nextSession) : "—"}
        tone={nextSession ? "info" : "neutral"}
      />
      <Pill
        label="Consistency"
        value={consistency != null ? `${consistency}%` : "—"}
        tone={
          consistency >= 70 ? "success" : consistency >= 40 ? "info" : "warn"
        }
      />
      <Pill
        label="Goals Left"
        value={openGoals}
        tone={openGoals === 0 ? "success" : "info"}
      />
    </div>
  );
};

export default KpiRibbon;
