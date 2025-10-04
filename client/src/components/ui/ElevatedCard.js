import React from "react";
import clsx from "clsx";

/*
 * Unified elevated card component.
 */
const ElevatedCard = ({
  as: Comp = "div",
  interactive = false,
  tinted = false,
  className = "",
  children,
  onClick,
  ...rest
}) => {
  return (
    <Comp
      onClick={onClick}
      className={clsx(
        "relative rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm",
        tinted &&
          "bg-gradient-to-br from-white via-surface-50 to-primary-50/40 dark:from-surface-800 dark:via-surface-800 dark:to-primary-900/10",
        interactive &&
          "transition-all hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-primary-500 cursor-pointer",
        className
      )}
      {...rest}
    >
      {children}
      {interactive && (
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-0 focus:rounded-2xl" />
      )}
    </Comp>
  );
};

export default ElevatedCard;
