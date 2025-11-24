import React from "react";

/**
 * Professional SVG icons for coaching categories
 * Modern, minimal design suitable for professional applications
 */

const CategoryIcon = ({ category, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Category color mapping
  const categoryConfig = {
    meditation: {
      color: "#8B5CF6", // Purple
      gradient: ["#8B5CF6", "#7C3AED"],
    },
    energy: {
      color: "#F59E0B", // Amber
      gradient: ["#F59E0B", "#D97706"],
    },
    target: {
      color: "#EF4444", // Red
      gradient: ["#EF4444", "#DC2626"],
    },
    positivity: {
      color: "#10B981", // Green
      gradient: ["#10B981", "#059669"],
    },
    analytics: {
      color: "#F59E0B", // Amber
      gradient: ["#F59E0B", "#D97706"],
    },
    theater: {
      color: "#EC4899", // Pink
      gradient: ["#EC4899", "#DB2777"],
    },
    growth: {
      color: "#10B981", // Green
      gradient: ["#10B981", "#059669"],
    },
    briefcase: {
      color: "#6B7280", // Gray
      gradient: ["#6B7280", "#4B5563"],
    },
    insights: {
      color: "#F59E0B", // Amber
      gradient: ["#F59E0B", "#D97706"],
    },
    coaching: {
      color: "#3B82F6", // Blue
      gradient: ["#3B82F6", "#2563EB"],
    },
  };

  const config = categoryConfig[category] || categoryConfig.briefcase;
  const gradientId = `gradient-cat-${category}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  const renderIcon = () => {
    switch (category) {
      case "meditation":
        // Relaxed person in meditation pose
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            {/* Person silhouette */}
            <circle cx="50" cy="30" r="12" fill={`url(#${gradientId})`} />
            {/* Body in meditation pose */}
            <path
              d="M 50 42 L 50 55 M 50 55 L 35 65 M 50 55 L 65 65 M 35 65 L 30 75 M 65 65 L 70 75"
              stroke={`url(#${gradientId})`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Meditation wave lines */}
            <path
              d="M 20 25 Q 25 20 30 25"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M 70 25 Q 75 20 80 25"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        );

      case "energy":
        // Lightning bolt
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            <path
              d="M 55 15 L 35 50 L 50 50 L 45 85 L 70 45 L 55 45 Z"
              fill={`url(#${gradientId})`}
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "target":
        // Target/bullseye
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="35"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="25"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="15"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
            <circle cx="50" cy="50" r="6" fill={`url(#${gradientId})`} />
          </svg>
        );

      case "positivity":
        // Smiling face (simplified)
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
            />
            <circle cx="37" cy="42" r="4" fill={`url(#${gradientId})`} />
            <circle cx="63" cy="42" r="4" fill={`url(#${gradientId})`} />
            <path
              d="M 32 58 Q 50 72 68 58"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        );

      case "analytics":
        // Bar chart
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            <rect
              x="20"
              y="45"
              width="15"
              height="35"
              rx="2"
              fill={`url(#${gradientId})`}
            />
            <rect
              x="42.5"
              y="30"
              width="15"
              height="50"
              rx="2"
              fill={`url(#${gradientId})`}
            />
            <rect
              x="65"
              y="20"
              width="15"
              height="60"
              rx="2"
              fill={`url(#${gradientId})`}
            />
            <line
              x1="15"
              y1="85"
              x2="85"
              y2="85"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        );

      case "theater":
        // Theater masks
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            {/* Happy mask */}
            <path
              d="M 25 35 Q 25 25 35 25 Q 45 25 45 35 Q 45 55 35 55 Q 25 55 25 35"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
            <circle cx="32" cy="38" r="2" fill={`url(#${gradientId})`} />
            <circle cx="38" cy="38" r="2" fill={`url(#${gradientId})`} />
            <path
              d="M 30 45 Q 35 48 40 45"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Sad mask */}
            <path
              d="M 55 45 Q 55 35 65 35 Q 75 35 75 45 Q 75 65 65 65 Q 55 65 55 45"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
            <circle cx="62" cy="48" r="2" fill={`url(#${gradientId})`} />
            <circle cx="68" cy="48" r="2" fill={`url(#${gradientId})`} />
            <path
              d="M 60 57 Q 65 54 70 57"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );

      case "growth":
        // Upward trending arrow
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            <path
              d="M 20 70 L 35 55 L 50 60 L 65 40 L 80 25"
              stroke={`url(#${gradientId})`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Arrow head */}
            <path
              d="M 80 25 L 70 28 M 80 25 L 77 35"
              stroke={`url(#${gradientId})`}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        );

      case "briefcase":
        // Briefcase
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            <rect
              x="20"
              y="40"
              width="60"
              height="35"
              rx="4"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
            <path
              d="M 35 40 L 35 32 Q 35 28 39 28 L 61 28 Q 65 28 65 32 L 65 40"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />
            <line
              x1="20"
              y1="55"
              x2="80"
              y2="55"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
          </svg>
        );

      case "insights":
        // Light bulb
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            {/* Bulb */}
            <path
              d="M 50 20 Q 35 20 30 35 Q 30 50 40 58 L 40 65 Q 40 68 43 68 L 57 68 Q 60 68 60 65 L 60 58 Q 70 50 70 35 Q 65 20 50 20"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />
            {/* Base */}
            <line
              x1="43"
              y1="68"
              x2="57"
              y2="68"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
            <line
              x1="45"
              y1="72"
              x2="55"
              y2="72"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
            <line
              x1="46"
              y1="76"
              x2="54"
              y2="76"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
            />
          </svg>
        );

      case "coaching":
        // Whistle or megaphone
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClass} ${className}`}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} />
                <stop offset="100%" stopColor={config.gradient[1]} />
              </linearGradient>
            </defs>
            {/* Megaphone */}
            <path
              d="M 25 45 L 45 35 L 45 65 L 25 55 Z"
              fill={`url(#${gradientId})`}
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
            />
            <path
              d="M 45 40 L 75 30 Q 80 30 80 35 L 80 65 Q 80 70 75 70 L 45 60"
              fill={`url(#${gradientId})`}
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
            />
            {/* Sound waves */}
            <path
              d="M 85 35 Q 90 40 90 50 Q 90 60 85 65"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      default:
        return renderIcon.call(this, { category: "briefcase" });
    }
  };

  return renderIcon();
};

export default CategoryIcon;
