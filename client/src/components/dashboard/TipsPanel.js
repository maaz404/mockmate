import React from "react";
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
        <h3 className="text-lg font-medium text-white">Pro Tips</h3>
        <p className="text-sm text-surface-400 mt-1">Improve faster</p>
      </div>
      <div className="p-6 space-y-4">
        {list.map((t, idx) => (
          <div key={idx} className="group">
            <h4 className="text-sm font-medium text-white group-hover:text-primary-300">
              {t.title}
            </h4>
            <p className="text-sm text-surface-400">{t.desc}</p>
            <Link
              to={t.href}
              className="text-primary-400 hover:text-primary-300 text-xs font-medium"
            >
              Explore →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
