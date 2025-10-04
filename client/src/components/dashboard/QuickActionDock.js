import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const ActionBtn = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-surface-800/80 hover:bg-surface-700 border border-surface-600 text-surface-300 hover:text-white text-[11px] focus:outline-none focus:ring-2 focus:ring-primary-500"
  >
    <span className="text-lg leading-none">{icon}</span>
    <span className="leading-none">{label}</span>
  </button>
);

const QuickActionDock = ({
  onStart,
  onSchedule,
  onExport,
  onScrollTop,
  visible = true,
}) => {
  const reduce = useReducedMotion();
  if (!visible) return null;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-5 right-5 z-40 flex gap-3 bg-surface-900/70 backdrop-blur-md px-4 py-3 rounded-2xl border border-surface-600 shadow-surface-lg"
    >
      <ActionBtn icon="⚡" label="Start" onClick={() => onStart?.("mixed")} />
      <ActionBtn icon="📅" label="Schedule" onClick={onSchedule} />
      <ActionBtn icon="⬇️" label="Export" onClick={onExport} />
      <ActionBtn icon="↑" label="Top" onClick={onScrollTop} />
    </motion.div>
  );
};

export default QuickActionDock;
