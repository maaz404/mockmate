import React from "react";

export const CardSkeleton = ({ lines = 3, className = "" }) => (
  <div
    className={`bg-surface-800/50 rounded-xl border border-surface-700 p-6 ${className}`}
  >
    <div className="h-5 w-40 bg-surface-700/60 rounded mb-4" />
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-surface-700/40 rounded ${i ? "mt-2" : ""}`}
      />
    ))}
  </div>
);

export const GridSkeleton = ({ cards = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: cards }).map((_, i) => (
      <div
        key={i}
        className="bg-surface-800/50 rounded-xl border border-surface-700 p-4"
      >
        <div className="h-4 w-24 bg-surface-700/60 rounded mb-2" />
        <div className="h-8 w-20 bg-surface-700/40 rounded" />
      </div>
    ))}
  </div>
);

export const ListSkeleton = ({ items = 3 }) => (
  <div className="bg-surface-800/50 rounded-xl border border-surface-700 divide-y divide-surface-700">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="p-6">
        <div className="h-4 w-48 bg-surface-700/60 rounded mb-2" />
        <div className="h-3 w-64 bg-surface-700/40 rounded" />
      </div>
    ))}
  </div>
);

const Skeletons = { CardSkeleton, GridSkeleton, ListSkeleton };
export default Skeletons;
