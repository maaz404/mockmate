// Design System Tokens (JS access) -------------------------------------------------
// These mirror Tailwind config & CSS custom properties, enabling JS-driven theming
// and consistency between styling decisions across components.

export const colors = {
  primary: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
  },
  secondary: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7c3aed",
    800: "#6b21a8",
    900: "#581c87",
  },
  surface: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
  success: { 500: "#22c55e" },
  warning: { 500: "#f59e0b" },
  error: { 500: "#ef4444" },
  accent: { 500: "#d946ef" },
};

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadow = {
  sm: "0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
  md: "0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)",
  lg: "0 10px 28px -6px rgba(0,0,0,0.18), 0 4px 10px -2px rgba(0,0,0,0.08)",
  glowPrimary: "0 0 0 3px rgba(20,184,166,0.35)",
};

export const spacingScale = (multiplier = 1) => 4 * multiplier; // base 4px

export const transitions = {
  fast: "120ms cubic-bezier(.2,.8,.2,1)",
  base: "200ms cubic-bezier(.2,.8,.2,1)",
  slow: "360ms cubic-bezier(.2,.8,.2,1)",
};

export const scoreBands = [
  { min: 80, tone: "success", text: "Excellent" },
  { min: 60, tone: "warning", text: "Competent" },
  { min: 0, tone: "error", text: "Needs Improvement" },
];

export const classifyScore = (value) => {
  const band =
    scoreBands.find((b) => value >= b.min) || scoreBands[scoreBands.length - 1];
  return band;
};

export const toneClasses = {
  success: {
    fg: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  warning: {
    fg: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  error: {
    fg: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
};

export const getScoreFg = (score) => toneClasses[classifyScore(score).tone].fg;
export const getScoreBg = (score) => toneClasses[classifyScore(score).tone].bg;

export const designTokens = {
  colors,
  radii,
  shadow,
  spacingScale,
  transitions,
};

export default designTokens;
