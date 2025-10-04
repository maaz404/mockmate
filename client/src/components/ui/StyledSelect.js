import React, { forwardRef, useMemo } from "react";
import clsx from "clsx";

/*
 * Unified select component with custom chevron, truncation, and dark mode support.
 * Props:
 *  - value, onChange, children (option elements)
 *  - size: 'sm' | 'md' (default 'md')
 *  - className: extra classes to merge
 *  - title: optional tooltip; if not provided we derive current option label
 *  - disabled, name, id, aria-label, etc. forwarded
 */
const StyledSelect = forwardRef(
  (
    {
      value,
      onChange,
      children,
      size = "md",
      className = "",
      title,
      disabled = false,
      name,
      id,
      ariaLabel,
      ...rest
    },
    ref
  ) => {
    const derivedTitle = useMemo(() => {
      if (title) return title;
      try {
        const arr = React.Children.toArray(children);
        const match = arr.find(
          (c) => React.isValidElement(c) && c.props.value === value
        );
        if (match && match.props && match.props.children) {
          return typeof match.props.children === "string"
            ? match.props.children
            : undefined;
        }
      } catch (_) {}
      return undefined;
    }, [children, title, value]);

    const sizeClasses =
      size === "sm"
        ? "px-3 py-2 text-xs rounded-md"
        : "px-4 py-3 text-sm rounded-lg";

    const baseClasses = clsx(
      "appearance-none w-full font-medium bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-10 truncate shadow-sm [&::-ms-expand]:hidden group-hover:border-surface-400 dark:group-hover:border-surface-500 group-focus-within:border-primary-500",
      sizeClasses,
      disabled &&
        "opacity-60 cursor-not-allowed bg-surface-100 dark:bg-surface-700 text-surface-400 dark:text-surface-500",
      className
    );

    // Inline style fallback to hide native arrow in Firefox (by forcing '-moz-appearance: none')
    const inlineStyle = {
      MozAppearance: "none",
      WebkitAppearance: "none",
    };

    return (
      <div
        className={clsx(
          "relative group transition-colors",
          size === "sm" ? "min-w-[6rem]" : ""
        )}
      >
        <select
          ref={ref}
          name={name}
          id={id}
          /* eslint-disable-next-line jsx-a11y/no-onchange */
          onChange={onChange}
          value={value}
          disabled={disabled}
          className={baseClasses}
          style={inlineStyle}
          title={derivedTitle}
          aria-label={ariaLabel}
          {...rest}
        >
          {children}
        </select>
        <svg
          className={clsx(
            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
            disabled
              ? "text-surface-400"
              : "text-surface-500 group-hover:text-surface-700 dark:text-surface-400 dark:group-hover:text-surface-300"
          )}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 7l5 6 5-6" />
        </svg>
      </div>
    );
  }
);

StyledSelect.displayName = "StyledSelect";
export default StyledSelect;
