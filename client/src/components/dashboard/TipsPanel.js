import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function TipsPanel({ tips = [] }) {
  const fallback = [
    {
      title: "Tighten STAR responses",
      desc: "Focus on Situation, Task, Action, Result with measurable impact.",
      href: "/resources",
    },
    {
      title: "Warm up with 2 coding katas",
      desc: "Daily 15-min consistency beats weekend marathons.",
      href: "/practice",
    },
    {
      title: "Revisit last feedback",
      desc: "Address flagged areas from your previous sessions.",
      href: "/interviews",
    },
  ];
  const list = tips.length ? tips : fallback;

  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl shadow-surface-lg border border-surface-700">
      <div className="p-6 border-b border-surface-700">
        <p className="text-[11px] uppercase tracking-wide text-surface-400">
          Guidance
        </p>
        <h3 className="text-lg font-semibold text-white">Pro Tips</h3>
      </div>
      <div className="p-6 space-y-4">
        {list.map((t, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="group"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-white group-hover:text-primary-300">
                {t.title}
              </h4>
              <span className="text-[10px] text-surface-400 border border-surface-700 rounded-full px-2 py-0.5">
                relevant
              </span>
            </div>
            <p className="text-sm text-surface-400">{t.desc}</p>
            <Link
              to={t.href}
              className="text-primary-400 hover:text-primary-300 text-xs font-medium"
            >
              Explore →
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
