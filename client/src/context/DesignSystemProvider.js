import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * DesignSystemProvider
 * Centralizes density + motion preferences + theme tokens extension point.
 */
const DesignSystemContext = createContext(null);

export const DesignSystemProvider = ({ children }) => {
  const [density, setDensity] = useState(() => localStorage.getItem("ds_density") || "comfortable");
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("ds_motion") === "reduced");

  useEffect(() => {
    localStorage.setItem("ds_density", density);
    document.documentElement.classList.toggle("density-compact", density === "compact");
  }, [density]);

  useEffect(() => {
    localStorage.setItem("ds_motion", reducedMotion ? "reduced" : "normal");
    document.documentElement.classList.toggle("motion-reduced", reducedMotion);
  }, [reducedMotion]);

  const value = {
    density,
    reducedMotion,
    setDensity,
    toggleDensity: () => setDensity((d) => (d === "compact" ? "comfortable" : "compact")),
    toggleMotion: () => setReducedMotion((m) => !m),
  };

  return (
    <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>
  );
};

export function useDesignSystem() {
  const ctx = useContext(DesignSystemContext);
  if (!ctx) throw new Error("useDesignSystem must be used within DesignSystemProvider");
  return ctx;
}

export default DesignSystemProvider;