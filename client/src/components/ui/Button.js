import React, { forwardRef } from "react";
import { cn } from "../../utils/cn";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

/*
 * Enhanced Button Component
 * Features:
 *  - Variants: primary, secondary, outline, ghost, destructive, subtle
 *  - Sizes: xs, sm, md, lg, xl
 *  - Polymorphic via `as` prop (defaults to button)
 *  - Loading state with spinner + accessible aria-busy & aria-live region
 *  - Optional ripple effect (disabled when prefers-reduced-motion)
 *  - Icon positioning left/right and icon-only mode (aria-label required)
 */

const Button = forwardRef(
  (
    {
      as: Comp = "button",
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      className = "",
      icon: Icon,
      iconPosition = "left",
      ripple = true,
      type = "button",
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const isDisabled = disabled || loading;

    const baseClasses =
      "relative overflow-hidden inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";
    const variants = {
      primary:
        "bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 text-white shadow hover:shadow-lg hover:brightness-[1.05] focus:ring-primary-500 active:brightness-95",
      secondary:
        "bg-surface-800 text-white hover:bg-surface-700 focus:ring-surface-500",
      outline:
        "border border-primary-500 text-primary-600 hover:bg-primary-600/10 focus:ring-primary-500",
      ghost:
        "text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 focus:ring-primary-500",
      subtle:
        "bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 focus:ring-surface-400",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };
    const sizes = {
      xs: "px-2.5 py-1.5 text-xs",
      sm: "px-3.5 py-2 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
      xl: "px-8 py-4 text-lg",
    };

    function handleRipple(e) {
      if (!ripple || prefersReducedMotion || isDisabled) return;
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const span = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      span.style.width = span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;
      span.className =
        "absolute rounded-full bg-white/30 dark:bg-white/20 animate-ripple pointer-events-none";
      target.appendChild(span);
      span.addEventListener("animationend", () => span.remove());
    }

    const content = (
      <>
        {loading && (
          <span
            className="inline-flex items-center gap-2"
            aria-live="polite"
            aria-busy="true"
          >
            <svg
              className="animate-spin w-4 h-4 text-current"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                fill="currentColor"
              />
            </svg>
            <span className="text-xs tracking-wide uppercase">Loading</span>
          </span>
        )}
        {!loading && Icon && iconPosition === "left" && (
          <Icon size={16} className="mr-2" aria-hidden="true" />
        )}
        {!loading && children}
        {!loading && Icon && iconPosition === "right" && (
          <Icon size={16} className="ml-2" aria-hidden="true" />
        )}
      </>
    );

    return (
      <Comp
        ref={ref}
        type={Comp === "button" ? type : undefined}
        disabled={Comp === "button" ? isDisabled : undefined}
        aria-disabled={isDisabled && Comp !== "button" ? true : undefined}
        aria-label={Icon && !children ? ariaLabel : undefined}
        className={cn(
          baseClasses,
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          isDisabled && "cursor-not-allowed opacity-60",
          loading && "relative",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          className
        )}
        onClick={(e) => {
          handleRipple(e);
          props.onClick && props.onClick(e);
        }}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);

Button.displayName = "Button";
export default Button;
