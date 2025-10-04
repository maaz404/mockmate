import React, { useState, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Map recommendation meta to a quick session config (Phase G simplified)
export function buildTargetedConfig(recommendation, userProfile) {
  const base = {
    jobRole: userProfile?.professionalInfo?.currentRole || "Software Developer",
    industry: userProfile?.professionalInfo?.industry || "Technology",
    experienceLevel: userProfile?.professionalInfo?.experience || "junior",
    interviewType: "mixed",
    difficulty: "intermediate",
    duration: 30,
    questionCount: 10,
  };
  if (!recommendation?.meta) return base;
  const { meta } = recommendation;
  if (meta.type === "dimension" && meta.dimension) {
    base.focusAreas = [meta.dimension.toLowerCase()];
  } else if (meta.type === "tag" && meta.tag) {
    base.tags = [meta.tag];
  } else if (meta.type === "consistency") {
    base.duration = 15;
    base.questionCount = 5;
  } else if (meta.type === "upcoming") {
    base.duration = 15;
    base.difficulty = "mixed";
  }
  return base;
}

// Generate secondary suggestions client-side (Phase F simplified)
function generateSecondarySuggestions(metrics, primary) {
  if (!metrics) return [];
  const list = [];
  // Dimension recovery
  const dims = metrics.skillDimensions || [];
  const drops = dims.filter(
    (d) =>
      typeof d.prev === "number" &&
      typeof d.curr === "number" &&
      d.curr - d.prev <= -5
  );
  drops.sort((a, b) => a.curr - a.prev - (b.curr - b.prev));
  for (const d of drops) {
    if (primary?.meta?.dimension === d.dimension) continue;
    list.push({
      title: `Rebuild ${d.dimension}`,
      reason: `${d.dimension} slipped ${Math.abs(
        d.curr - d.prev
      )} points; focused set can stabilize it.`,
      actions: [
        {
          label: `Target ${d.dimension}`,
          href: `/interview/new?focus=${encodeURIComponent(
            d.dimension.toLowerCase()
          )}`,
        },
      ],
      meta: { type: "dimension-secondary", dimension: d.dimension },
    });
    break;
  }
  // Coverage suggestion
  if (metrics.tagCoverage?.missingSuggestions?.length) {
    const tag = metrics.tagCoverage.missingSuggestions[0];
    if (primary?.meta?.tag !== tag) {
      list.push({
        title: `Add Tag: ${tag}`,
        reason: `You haven't practiced "${tag}" recently—broadening coverage improves adaptability.`,
        actions: [
          {
            label: "Drill This Tag",
            href: `/interview/new?tags=${encodeURIComponent(tag)}`,
          },
        ],
        meta: { type: "tag-secondary", tag },
      });
    }
  }
  // Consistency nudge
  if (
    metrics.consistencyScore != null &&
    metrics.consistencyScore < 60 &&
    primary?.meta?.type !== "consistency"
  ) {
    list.push({
      title: "Daily Micro Habit",
      reason: "Short 10–15 minute practice windows compound over the week.",
      actions: [
        { label: "Start 10-min Drill", href: "/interview/new?duration=10" },
      ],
      meta: {
        type: "consistency-secondary",
        consistencyScore: metrics.consistencyScore,
      },
    });
  }
  return list.slice(0, 2);
}

// Build explanatory bullets (Phase D simplified) from meta only
function buildWhy(primary) {
  if (!primary?.meta) return [];
  const m = primary.meta;
  const out = [];
  if (m.type === "consistency" && typeof m.consistencyScore === "number") {
    out.push(`Consistency score at ${m.consistencyScore}% (< 50% threshold).`);
  }
  if (m.type === "dimension" && typeof m.delta === "number") {
    out.push(
      `${m.dimension} delta ${m.delta > 0 ? "+" : ""}${
        m.delta
      } vs previous segment.`
    );
  }
  if (m.type === "tag" && m.tag) {
    out.push(`Tag "${m.tag}" underrepresented (count ${m.count}).`);
  }
  if (m.type === "upcoming" && typeof m.hoursToNext === "number") {
    out.push(
      `Upcoming session in ${Math.round(
        m.hoursToNext
      )}h and score below benchmark.`
    );
  }
  if (!out.length) out.push("General steady progression suggestion.");
  return out;
}

const downloadObject = (obj, filename) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const NextBestActionCard = ({
  recommendation,
  metrics,
  benchmark,
  horizonWeeks,
  onStartTargeted,
  userProfile,
}) => {
  const [whyOpen, setWhyOpen] = useState(false);
  const [altIndex, setAltIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const secondary = useMemo(
    () => generateSecondarySuggestions(metrics, recommendation),
    [metrics, recommendation]
  );
  const active =
    secondary.length && altIndex > 0
      ? secondary[(altIndex - 1) % secondary.length]
      : recommendation;
  const whyBullets = useMemo(() => buildWhy(active), [active]);

  return (
    <div className="dashboard-card p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary-500/10 blur-2xl pointer-events-none" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-primary-300/70 mb-1">
            Next Best Action
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h3
              key={active?.title || "empty"}
              initial={
                reduceMotion ? false : { opacity: 0, y: 8, filter: "blur(4px)" }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -6, filter: "blur(3px)" }
              }
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 24,
                duration: 0.5,
              }}
              className="text-sm font-semibold text-white mb-1"
            >
              {active?.title || "—"}
            </motion.h3>
          </AnimatePresence>
        </div>
        {secondary.length > 0 && (
          <button
            className="text-[10px] text-primary-300 hover:text-primary-100 border border-primary-700/50 px-2 py-0.5 rounded-md"
            onClick={() => setAltIndex((i) => (i + 1) % (secondary.length + 1))}
          >
            {altIndex === 0 ? "More" : "Primary"}
          </button>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={active?.reason || "reason-empty"}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: 0.28 }}
          className="text-[11px] text-surface-300 leading-relaxed mb-3"
        >
          {active?.reason}
        </motion.p>
      </AnimatePresence>
      <div className="flex flex-wrap gap-2 mb-3">
        <AnimatePresence initial={false}>
          {active?.actions?.slice(0, 3).map((a, idx) => (
            <motion.a
              layout
              key={a.href + idx}
              whileHover={reduceMotion ? undefined : { scale: 1.05 }}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              className="text-[11px] px-2 py-1 rounded-md bg-primary-600/20 text-primary-200 hover:bg-primary-600/30 border border-primary-600/40 transition-colors"
              href={a.href}
            >
              {a.label}
            </motion.a>
          ))}
        </AnimatePresence>
        {onStartTargeted && (
          <motion.button
            whileHover={reduceMotion ? undefined : { scale: 1.05 }}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            onClick={() =>
              onStartTargeted(buildTargetedConfig(active, userProfile))
            }
            className="text-[11px] px-2 py-1 rounded-md bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/30 border border-emerald-600/40"
          >
            Start Targeted Session
          </motion.button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          className="text-[10px] text-surface-400 hover:text-surface-200 underline"
          onClick={() => setWhyOpen((o) => !o)}
          aria-expanded={whyOpen}
        >
          Why?
        </button>
        <button
          className="text-[10px] text-surface-400 hover:text-surface-200 underline"
          onClick={() =>
            downloadObject(
              {
                version: 1,
                generatedAt: new Date().toISOString(),
                horizonWeeks,
                benchmark,
                recommendation: active,
                metrics: metrics
                  ? {
                      consistencyScore: metrics.consistencyScore,
                      weeks: metrics.weeks?.length,
                      lastPracticeAt: metrics.lastPracticeAt,
                    }
                  : null,
              },
              "mockmate-insights.json"
            )
          }
        >
          Download Insights
        </button>
      </div>
      <AnimatePresence initial={false}>
        {whyOpen && (
          <motion.ul
            key="why"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 pl-4 list-disc text-[10px] text-surface-400 space-y-1"
          >
            {whyBullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <div className="mt-3 flex items-center justify-between text-[9px] text-surface-500">
        <span>
          Horizon: {horizonWeeks}w • Benchmark: {benchmark}%
        </span>
        {secondary.length > 0 && (
          <span>
            {altIndex === 0
              ? "Primary"
              : `Alt ${((altIndex - 1) % secondary.length) + 1}/${
                  secondary.length
                }`}
          </span>
        )}
      </div>
    </div>
  );
};

export default NextBestActionCard;
