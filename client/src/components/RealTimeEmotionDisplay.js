import React, { useMemo } from "react";
import { Activity, TrendingUp, Brain } from "lucide-react";
import EmotionIcon from "./EmotionIcon";

const RealTimeEmotionDisplay = ({ emotionTimeline }) => {
  // Emotion color mapping
  const emotionConfig = {
    happy: {
      color: "#10B981",
      label: "Happy",
      gradient: "from-green-500 to-emerald-600",
    },
    neutral: {
      color: "#6B7280",
      label: "Neutral",
      gradient: "from-gray-500 to-slate-600",
    },
    sad: {
      color: "#3B82F6",
      label: "Sad",
      gradient: "from-blue-500 to-indigo-600",
    },
    confident: {
      color: "#14B8A6",
      label: "Confident",
      gradient: "from-teal-500 to-teal-600",
    },
    surprise: {
      color: "#F59E0B",
      label: "Surprise",
      gradient: "from-amber-500 to-yellow-600",
    },
    fear: {
      color: "#8B5CF6",
      label: "Fear",
      gradient: "from-purple-500 to-violet-600",
    },
    nervous: {
      color: "#F97316",
      label: "Nervous",
      gradient: "from-orange-500 to-orange-600",
    },
  };

  // Get current emotion (latest entry)
  const currentEmotion = useMemo(() => {
    if (!emotionTimeline || emotionTimeline.length === 0) return null;
    return emotionTimeline[emotionTimeline.length - 1];
  }, [emotionTimeline]);

  // Calculate emotion distribution for last 10 frames
  const recentDistribution = useMemo(() => {
    if (!emotionTimeline || emotionTimeline.length === 0) return {};

    const recentFrames = emotionTimeline.slice(-10);
    const counts = {};

    recentFrames.forEach((entry) => {
      counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
    });

    return counts;
  }, [emotionTimeline]);

  // Get top 3 emotions
  const topEmotions = useMemo(() => {
    return Object.entries(recentDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, count]) => ({
        emotion,
        percentage: (
          (count / Math.min(10, emotionTimeline.length)) *
          100
        ).toFixed(0),
      }));
  }, [recentDistribution, emotionTimeline]);

  if (!currentEmotion) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              Emotion Analysis
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              AI-powered detection
            </p>
          </div>
        </div>
        <div className="text-center py-8 text-surface-400 dark:text-surface-500 text-sm">
          <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          Waiting for emotion data...
        </div>
      </div>
    );
  }

  const config = emotionConfig[currentEmotion.emotion] || emotionConfig.neutral;

  // Derivation contributions (raw factor breakdown)
  const contributions = currentEmotion.contributions || null;
  const rawConfident =
    currentEmotion.rawEmotions?.confident ||
    currentEmotion.raw_emotions?.confident ||
    null;
  const rawNervous =
    currentEmotion.rawEmotions?.nervous ||
    currentEmotion.raw_emotions?.nervous ||
    null;
  const smoothedConfident = currentEmotion.emotions?.confident || null;
  const smoothedNervous = currentEmotion.emotions?.nervous || null;

  const renderContributionRow = (label, value, total, color) => {
    const pct = total && total > 0 ? ((value / total) * 100).toFixed(0) : "0";
    return (
      <div className="flex items-center justify-between text-xs py-1">
        <span className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          ></span>
          <span className="text-surface-600 dark:text-surface-400 capitalize">
            {label}
          </span>
        </span>
        <span className="font-medium text-surface-700 dark:text-surface-300">
          {pct}%
        </span>
      </div>
    );
  };

  return (
    <div className="card p-6 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-5`}
      ></div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
            >
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                Emotion Analysis
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Real-time AI detection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-700">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-surface-600 dark:text-surface-300">
              Live
            </span>
          </div>
        </div>

        {/* Current Emotion - Large Display */}
        <div className="mb-6 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0"
              style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.08))" }}
            >
              <EmotionIcon emotion={currentEmotion.emotion} size="2xl" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                Current State
              </div>
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: config.color }}
              >
                {config.label}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(currentEmotion.confidence * 100).toFixed(0)}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  {(currentEmotion.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trends */}
        {topEmotions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h4 className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                Recent Trends
              </h4>
            </div>
            <div className="space-y-2.5">
              {topEmotions.map(({ emotion, percentage }) => {
                const cfg = emotionConfig[emotion] || emotionConfig.neutral;
                return (
                  <div key={emotion} className="group">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="transition-transform group-hover:scale-110 flex-shrink-0">
                        <EmotionIcon emotion={emotion} size="md" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                            {cfg.label}
                          </span>
                          <span className="text-sm font-bold text-surface-600 dark:text-surface-400">
                            {percentage}%
                          </span>
                        </div>
                        <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: cfg.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Frames Counter */}
        <div className="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-surface-500 dark:text-surface-400">
              Frames Analyzed
            </span>
            <span className="font-semibold text-surface-700 dark:text-surface-300">
              {emotionTimeline.length}
            </span>
          </div>
        </div>

        {/* Derivation Explanation */}
        {contributions && (
          <div className="mt-6 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                How Scores Are Derived
              </h4>
              {currentEmotion.smoothing?.enabled && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400">
                  Smoothing Active (EMA {currentEmotion.smoothing.alpha}, window{" "}
                  {currentEmotion.smoothing.window})
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Confident breakdown */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <EmotionIcon emotion="confident" size="sm" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Confident Factors
                  </span>
                  {rawConfident !== null && smoothedConfident !== null && (
                    <span className="ml-auto text-[11px] text-surface-500 dark:text-surface-400">
                      Raw {Math.round(rawConfident * 100)}% → Smoothed{" "}
                      {Math.round(smoothedConfident * 100)}%
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {renderContributionRow(
                    "Assertiveness",
                    contributions.confident.assertiveness,
                    rawConfident || 1,
                    emotionConfig.confident.color
                  )}
                  {renderContributionRow(
                    "Calmness",
                    contributions.confident.calmness,
                    rawConfident || 1,
                    emotionConfig.neutral.color
                  )}
                  {renderContributionRow(
                    "Composure",
                    contributions.confident.composure,
                    rawConfident || 1,
                    emotionConfig.happy.color
                  )}
                  {renderContributionRow(
                    "Resilience",
                    contributions.confident.resilience,
                    rawConfident || 1,
                    emotionConfig.sad.color
                  )}
                </div>
              </div>
              {/* Nervous breakdown */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <EmotionIcon emotion="nervous" size="sm" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Nervous Factors
                  </span>
                  {rawNervous !== null && smoothedNervous !== null && (
                    <span className="ml-auto text-[11px] text-surface-500 dark:text-surface-400">
                      Raw {Math.round(rawNervous * 100)}% → Smoothed{" "}
                      {Math.round(smoothedNervous * 100)}%
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {renderContributionRow(
                    "Fear",
                    contributions.nervous.fear,
                    rawNervous || 1,
                    emotionConfig.fear.color
                  )}
                  {renderContributionRow(
                    "Worry",
                    contributions.nervous.worry,
                    rawNervous || 1,
                    emotionConfig.sad.color
                  )}
                  {renderContributionRow(
                    "Tension",
                    contributions.nervous.tension,
                    rawNervous || 1,
                    emotionConfig.neutral.color
                  )}
                  {renderContributionRow(
                    "Startle",
                    contributions.nervous.startle,
                    rawNervous || 1,
                    emotionConfig.surprise.color
                  )}
                </div>
              </div>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-surface-500 dark:text-surface-400">
              Confidence combines assertiveness, calmness, composure and
              resilience factors. Nervousness reflects elevated fear, worry,
              tension and startle reactions. Scores are smoothed over recent
              frames to reduce jitter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeEmotionDisplay;
