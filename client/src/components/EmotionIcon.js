import React from "react";

/**
 * Modern, professional SVG emotion icons
 * Designed to work well in both light and dark themes
 * Clean, minimal, vector-based design suitable for professional applications
 */

const EmotionIcon = ({ emotion, size = "lg", className = "" }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-20 h-20",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.lg;

  // Emotion icon configurations with professional color schemes
  const emotionConfig = {
    happy: {
      color: "#10B981", // Green
      gradient: ["#10B981", "#059669"],
    },
    neutral: {
      color: "#6B7280", // Gray
      gradient: ["#6B7280", "#4B5563"],
    },
    sad: {
      color: "#3B82F6", // Blue
      gradient: ["#3B82F6", "#2563EB"],
    },
    confident: {
      color: "#14B8A6", // Teal
      gradient: ["#14B8A6", "#0D9488"],
    },
    surprise: {
      color: "#F59E0B", // Amber
      gradient: ["#F59E0B", "#D97706"],
    },
    fear: {
      color: "#8B5CF6", // Purple
      gradient: ["#8B5CF6", "#7C3AED"],
    },
    nervous: {
      color: "#F97316", // Orange
      gradient: ["#F97316", "#EA580C"],
    },
  };

  const config = emotionConfig[emotion] || emotionConfig.neutral;
  const gradientId = `gradient-${emotion}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  const renderIcon = () => {
    switch (emotion) {
      case "happy":
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
            {/* Face circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={`url(#${gradientId})`}
              opacity="0.15"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />

            {/* Eyes - happy closed eyes */}
            <path
              d="M 30 38 Q 35 42 40 38"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 60 38 Q 65 42 70 38"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Smile */}
            <path
              d="M 30 60 Q 50 75 70 60"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      case "neutral":
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
            {/* Face circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={`url(#${gradientId})`}
              opacity="0.15"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />

            {/* Eyes - simple dots */}
            <circle cx="35" cy="40" r="3.5" fill={`url(#${gradientId})`} />
            <circle cx="65" cy="40" r="3.5" fill={`url(#${gradientId})`} />

            {/* Neutral mouth - straight line */}
            <line
              x1="35"
              y1="65"
              x2="65"
              y2="65"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        );

      case "sad":
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
            {/* Face circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={`url(#${gradientId})`}
              opacity="0.15"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />

            {/* Eyes - sad/concerned */}
            <circle cx="35" cy="40" r="3.5" fill={`url(#${gradientId})`} />
            <circle cx="65" cy="40" r="3.5" fill={`url(#${gradientId})`} />

            {/* Sad eyebrows */}
            <path
              d="M 28 32 Q 35 28 42 32"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 58 32 Q 65 28 72 32"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Sad mouth - downward curve */}
            <path
              d="M 30 68 Q 50 60 70 68"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      case "surprise":
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
            {/* Face circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={`url(#${gradientId})`}
              opacity="0.15"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />

            {/* Eyes - wide open circles */}
            <circle
              cx="35"
              cy="40"
              r="5"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />
            <circle
              cx="65"
              cy="40"
              r="5"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />
            <circle cx="35" cy="40" r="2" fill={`url(#${gradientId})`} />
            <circle cx="65" cy="40" r="2" fill={`url(#${gradientId})`} />

            {/* Raised eyebrows */}
            <path
              d="M 25 28 Q 35 26 42 28"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 58 28 Q 65 26 75 28"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Open mouth - O shape */}
            <ellipse
              cx="50"
              cy="67"
              rx="10"
              ry="12"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />
          </svg>
        );

      case "fear":
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
            {/* Face circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={`url(#${gradientId})`}
              opacity="0.15"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />

            {/* Eyes - widened with concern */}
            <circle
              cx="35"
              cy="42"
              r="5.5"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />
            <circle
              cx="65"
              cy="42"
              r="5.5"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />
            <circle cx="35" cy="42" r="2.5" fill={`url(#${gradientId})`} />
            <circle cx="65" cy="42" r="2.5" fill={`url(#${gradientId})`} />

            {/* Worried eyebrows - curved up in middle */}
            <path
              d="M 25 30 Q 35 26 42 30"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 58 30 Q 65 26 75 30"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Worried mouth - wavy/uncertain */}
            <path
              d="M 35 66 Q 42 64 50 66 Q 58 68 65 66"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      case "nervous":
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
            {/* Face circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={`url(#${gradientId})`}
              opacity="0.15"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />

            {/* Eyes - slightly widened, showing tension */}
            <circle
              cx="35"
              cy="40"
              r="4.5"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              fill="none"
            />
            <circle
              cx="65"
              cy="40"
              r="4.5"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="35" cy="40" r="2" fill={`url(#${gradientId})`} />
            <circle cx="65" cy="40" r="2" fill={`url(#${gradientId})`} />

            {/* Tense eyebrows - slightly raised and curved */}
            <path
              d="M 25 30 Q 35 27 42 30"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 58 30 Q 65 27 75 30"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Tense mouth - slight grimace */}
            <path
              d="M 32 65 L 42 63 L 50 65 L 58 63 L 68 65"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Sweat drop to indicate nervousness */}
            <ellipse
              cx="72"
              cy="35"
              rx="3"
              ry="4"
              fill={`url(#${gradientId})`}
              opacity="0.5"
            />
          </svg>
        );

      case "confident":
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
            {/* Face circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={`url(#${gradientId})`}
              opacity="0.15"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill="none"
            />

            {/* Eyes - steady, focused gaze */}
            <circle cx="35" cy="40" r="4" fill={`url(#${gradientId})`} />
            <circle cx="65" cy="40" r="4" fill={`url(#${gradientId})`} />

            {/* Strong, level eyebrows */}
            <path
              d="M 25 32 L 42 32"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 58 32 L 75 32"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Slight smile - confident but not overly happy */}
            <path
              d="M 32 62 Q 50 70 68 62"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Strong chin line to suggest confidence */}
            <path
              d="M 35 75 Q 50 78 65 75"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
        );

      default:
        return renderIcon.call(this, { emotion: "neutral" });
    }
  };

  return renderIcon();
};

export default EmotionIcon;
