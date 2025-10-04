import React from "react";
import clsx from "clsx";

/*
  Reusable gradient header / hero band.
  Props:
    - title: string | node
    - subtitle?: string | node
    - left?: custom React node (replaces title/subtitle block)
    - right?: React node (e.g., actions/buttons)
    - size?: 'sm' | 'md' | 'lg'
    - gradient?: 'teal' | 'primary' | 'bluePurple'
    - className?: extra outer classes
*/
const sizeMap = {
  sm: "p-4 rounded-lg",
  md: "p-6 rounded-xl",
  lg: "p-8 rounded-2xl",
};

const gradientMap = {
  teal: "bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-700 dark:to-cyan-700",
  primary:
    "bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-700 dark:to-secondary-700",
  bluePurple:
    "bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700",
};

export default function GradientHeader({
  title,
  subtitle,
  left,
  right,
  size = "md",
  gradient = "primary",
  className,
}) {
  return (
    <div
      className={clsx(
        "text-white relative overflow-hidden transition-colors flex items-center justify-between gap-6",
        gradientMap[gradient],
        sizeMap[size],
        className
      )}
    >
      {left ? (
        left
      ) : (
        <div className="flex-1 min-w-0">
          {title && (
            <h1
              className={clsx("font-bold tracking-tight", {
                "text-2xl": size === "sm",
                "text-3xl": size === "md",
                "text-4xl": size === "lg",
              })}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-white/80 text-sm md:text-base leading-relaxed line-clamp-3">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {right && <div className="shrink-0 flex items-center gap-3">{right}</div>}
    </div>
  );
}
