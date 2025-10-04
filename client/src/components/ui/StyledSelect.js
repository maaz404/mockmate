import React, { forwardRef, useMemo, useState, useEffect, useRef } from "react";
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
      fancy = false, // when true, use custom styled popover instead of native select
      maxHeight = 260, // max height for fancy list (px)
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

    // Fancy mode hooks declared unconditionally (safe order) -----------------
    const optionElements = React.Children.toArray(children).filter((c) =>
      React.isValidElement(c)
    );
    const options = optionElements.map((el) => ({
      value: el.props.value,
      label: el.props.children,
      disabled: el.props.disabled,
    }));
    const selectedIndex = options.findIndex((o) => o.value === value);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(
      selectedIndex >= 0 ? selectedIndex : 0
    );
    const menuRef = useRef(null);
    const internalBtnRef = useRef(null);
    const buttonRef = ref || internalBtnRef;

    // Effects guard internally by fancy flag
    useEffect(() => {
      if (!fancy || !open) return;
      const handleClick = (e) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(e.target) &&
          !(buttonRef.current && buttonRef.current.contains(e.target))
        ) {
          setOpen(false);
        }
      };
      const handleKey = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKey);
      return () => {
        window.removeEventListener("mousedown", handleClick);
        window.removeEventListener("keydown", handleKey);
      };
    }, [open, fancy, buttonRef]);

    useEffect(() => {
      if (!fancy || !open) return;
      const el = menuRef.current?.querySelector(
        `[data-index='${activeIndex}']`
      );
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ block: "nearest" });
      }
    }, [activeIndex, open, fancy]);

    function commitSelection(idx) {
      if (!fancy) return; // safety
      const opt = options[idx];
      if (!opt || opt.disabled) return;
      const synthetic = { target: { value: opt.value } };
      onChange && onChange(synthetic);
      setOpen(false);
      setTimeout(() => {
        if (buttonRef.current && buttonRef.current.focus)
          buttonRef.current.focus();
      }, 0);
    }

    function handleButtonKey(e) {
      if (!fancy) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(
          e.key === "ArrowDown"
            ? Math.max(0, selectedIndex)
            : Math.max(0, selectedIndex)
        );
      }
    }

    function handleMenuKey(e) {
      if (!fancy) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setActiveIndex(options.length - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        commitSelection(activeIndex);
      }
    }

    const displayLabel =
      selectedIndex >= 0 ? options[selectedIndex].label : "Select";

    if (!fancy) {
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

    return (
      <div
        className={clsx(
          "relative inline-block text-left",
          size === "sm" ? "min-w-[6rem]" : "min-w-[8rem]"
        )}
      >
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={handleButtonKey}
          className={clsx(
            baseClasses,
            "justify-between text-left flex items-center pr-9"
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-label={ariaLabel}
        >
          <span className="truncate font-medium">{displayLabel}</span>
          <svg
            className={clsx(
              "absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-transform",
              open ? "rotate-180" : "",
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
        </button>
        {open && (
          <ul
            ref={menuRef}
            role="listbox"
            id={id ? `${id}-listbox` : undefined}
            tabIndex={-1}
            onKeyDown={handleMenuKey}
            className={clsx(
              "absolute z-30 mt-1 w-full rounded-lg border border-surface-200 dark:border-surface-600 shadow-lg bg-white dark:bg-surface-800 ring-1 ring-black/5 focus:outline-none p-1 space-y-0 overflow-auto animate-fade-in"
            )}
            style={{ maxHeight }}
          >
            {options.map((opt, idx) => {
              const active = idx === activeIndex;
              const selected = value === opt.value;
              return (
                <li
                  key={opt.value}
                  data-index={idx}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commitSelection(idx)}
                  className={clsx(
                    "px-3 py-2 rounded-md cursor-pointer text-sm flex items-center gap-2",
                    opt.disabled && "opacity-50 cursor-not-allowed",
                    !opt.disabled &&
                      (active
                        ? "bg-primary-600 text-white shadow-sm"
                        : selected
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200"
                        : "hover:bg-surface-100 dark:hover:bg-surface-700/60")
                  )}
                >
                  {selected && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500" />
                  )}
                  <span className="truncate">{opt.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
);

StyledSelect.displayName = "StyledSelect";
export default StyledSelect;
