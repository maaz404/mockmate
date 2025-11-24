import React, { useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import EmotionIcon from "./EmotionIcon";
import CategoryIcon from "./CategoryIcon";

const EmotionSummary = ({ emotionTimeline, emotionAnalytics }) => {
  const { t } = useLanguage();

  // Emotion color mapping (matching chart colors)
  const emotionColors = {
    happy: "#10B981",
    neutral: "#6B7280",
    sad: "#3B82F6",
    confident: "#14B8A6",
    surprise: "#F59E0B",
    fear: "#8B5CF6",
    nervous: "#F97316",
  };

  // Calculate emotion summary (counts + intensity)
  const summary = useMemo(() => {
    if (!emotionTimeline || emotionTimeline.length === 0) return null;

    // Occurrence-based counts (dominant emotion per frame)
    const emotionCounts = {};
    emotionTimeline.forEach((entry) => {
      if (!entry || !entry.emotion) return;
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });
    const totalFrames = emotionTimeline.length;
    const countDistribution = {};
    Object.keys(emotionCounts).forEach((emotion) => {
      countDistribution[emotion] = (
        (emotionCounts[emotion] / totalFrames) *
        100
      ).toFixed(1);
    });

    // Intensity averages (smoothed preferred)
    let intensityAverages = {};
    if (emotionAnalytics?.smoothAverages) {
      intensityAverages = emotionAnalytics.smoothAverages;
    } else {
      const totals = {
        happy: 0,
        neutral: 0,
        sad: 0,
        confident: 0,
        surprise: 0,
        fear: 0,
        nervous: 0,
      };
      let framesWithIntensities = 0;
      emotionTimeline.forEach((entry) => {
        if (entry?.emotions) {
          framesWithIntensities++;
          Object.keys(totals).forEach((e) => {
            totals[e] += entry.emotions[e] || 0;
          });
        }
      });
      if (framesWithIntensities > 0) {
        Object.keys(totals).forEach((e) => {
          intensityAverages[e] = totals[e] / framesWithIntensities;
        });
      }
    }
    const intensitySum = Object.values(intensityAverages).reduce(
      (a, b) => a + b,
      0
    );
    const intensityDistribution = {};
    Object.keys(intensityAverages).forEach((e) => {
      intensityDistribution[e] = (
        intensitySum > 0 ? (intensityAverages[e] / intensitySum) * 100 : 0
      ).toFixed(1);
    });

    // Dominant emotion (by occurrence)
    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    // Top emotions (occurrence)
    const topEmotions = Object.entries(countDistribution)
      .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))
      .slice(0, 3)
      .map(([emotion, percentage]) => ({
        emotion,
        percentage: parseFloat(percentage),
      }));

    // Average confidence
    const avgConfidence =
      emotionTimeline.reduce((sum, entry) => sum + (entry.confidence || 0), 0) /
      totalFrames;

    // Change rate
    let changes = 0;
    for (let i = 1; i < emotionTimeline.length; i++) {
      if (emotionTimeline[i].emotion !== emotionTimeline[i - 1].emotion)
        changes++;
    }
    const changeRate = (changes / totalFrames) * 100;

    // Insights
    const insights = [];
    if (countDistribution[dominantEmotion] >= 60) {
      insights.push(
        t("emotion_insight_dominant", {
          emotion: t(dominantEmotion),
          percentage: countDistribution[dominantEmotion],
        })
      );
    }
    if (changeRate < 20) insights.push(t("emotion_insight_stable"));
    else if (changeRate > 50) insights.push(t("emotion_insight_variable"));

    const positivePercentage =
      (parseFloat(countDistribution.happy || 0) +
        parseFloat(countDistribution.surprise || 0)) /
      2;
    if (positivePercentage > 30) insights.push(t("emotion_insight_positive"));
    if (avgConfidence >= 0.8)
      insights.push(t("emotion_insight_high_confidence"));

    // Coaching suggestions based on counts
    const suggestions = generateCoachingSuggestions(
      countDistribution,
      changeRate,
      emotionTimeline
    );

    return {
      dominantEmotion,
      dominantPercentage: countDistribution[dominantEmotion],
      topEmotions,
      totalFrames,
      changeRate: changeRate.toFixed(1),
      avgConfidence: (avgConfidence * 100).toFixed(1),
      insights,
      suggestions,
      countDistribution,
      intensityDistribution,
      intensityAverages,
    };
  }, [emotionTimeline, emotionAnalytics, t]);

  // Generate coaching suggestions
  function generateCoachingSuggestions(distribution, changeRate, timeline) {
    const suggestions = [];

    // High nervousness (interview-specific)
    const nervousPercent = parseFloat(distribution.nervous || 0);
    if (nervousPercent > 30) {
      suggestions.push({
        category: "Interview Anxiety Management",
        iconType: "meditation",
        color: "#F97316",
        tips: [
          "Practice mock interviews to build familiarity and reduce nervousness",
          "Use the 4-7-8 breathing technique before and during interviews",
          "Prepare thoroughly - confidence comes from competence",
          "Reframe anxiety as excitement about the opportunity",
          "Remember: slight nervousness shows you care about the role",
        ],
      });
    }

    // Low confidence
    const confidentPercent = parseFloat(distribution.confident || 0);
    if (confidentPercent < 20) {
      suggestions.push({
        category: "Building Interview Confidence",
        iconType: "growth",
        color: "#14B8A6",
        tips: [
          "Review your achievements and practice articulating them clearly",
          "Use power poses for 2 minutes before interviews to boost confidence",
          "Prepare STAR method responses for common behavioral questions",
          "Focus on what you bring to the role, not what you lack",
          "Practice positive self-talk and affirmations before interviews",
        ],
      });
    }

    // High fear/nervousness (legacy support)
    const fearPercent = parseFloat(distribution.fear || 0);
    if (fearPercent > 30) {
      suggestions.push({
        category: "Stress Management",
        iconType: "meditation",
        color: "#8B5CF6",
        tips: [
          "Practice deep breathing exercises before interviews",
          "Use positive visualization techniques to build confidence",
          "Prepare thoroughly to reduce anxiety about unknowns",
          "Remember that nervousness is normal and shows you care",
        ],
      });
    }

    // High sad/low energy
    const sadPercent = parseFloat(distribution.sad || 0);
    if (sadPercent > 25) {
      suggestions.push({
        category: "Energy & Enthusiasm",
        iconType: "energy",
        color: "#3B82F6",
        tips: [
          "Work on projecting enthusiasm through vocal variety",
          "Practice power poses before interviews to boost confidence",
          "Focus on topics you're passionate about to naturally elevate mood",
          "Consider recording yourself to identify monotone patterns",
        ],
      });
    }

    // Low positive emotions (happy + surprise)
    const positivePercent =
      parseFloat(distribution.happy || 0) +
      parseFloat(distribution.surprise || 0);
    if (positivePercent < 20) {
      suggestions.push({
        category: "Positive Engagement",
        iconType: "positivity",
        color: "#10B981",
        tips: [
          "Smile naturally when appropriate to convey friendliness",
          "Show genuine interest and curiosity about the role",
          "Share stories that highlight your passion for your work",
          "Practice maintaining an approachable demeanor",
        ],
      });
    }

    // High emotional variability
    if (changeRate > 50) {
      suggestions.push({
        category: "Emotional Consistency",
        iconType: "analytics",
        color: "#F59E0B",
        tips: [
          "Work on maintaining steady emotional baseline during interviews",
          "Practice grounding techniques to stay centered",
          "Develop consistent responses to common question types",
          "Focus on balanced reactions rather than emotional swings",
        ],
      });
    }

    // Low emotional variability (too neutral)
    const neutralPercent = parseFloat(distribution.neutral || 0);
    if (neutralPercent > 60 || changeRate < 15) {
      suggestions.push({
        category: "Expressiveness",
        iconType: "theater",
        color: "#EC4899",
        tips: [
          "Practice showing authentic emotion when discussing achievements",
          "Use facial expressions to emphasize key points",
          "Demonstrate passion for topics you care about",
          "Remember that appropriate emotion shows engagement",
        ],
      });
    }

    // Analyze emotion progression (start vs end)
    const firstThird = timeline.slice(0, Math.floor(timeline.length / 3));
    const lastThird = timeline.slice(Math.floor((timeline.length * 2) / 3));

    const startFear =
      firstThird.filter((e) => e.emotion === "fear").length / firstThird.length;
    const endFear =
      lastThird.filter((e) => e.emotion === "fear").length / lastThird.length;

    if (startFear > 0.4 && endFear < 0.2) {
      suggestions.push({
        category: "Positive Progress",
        iconType: "growth",
        color: "#10B981",
        tips: [
          "Great job! You became more comfortable as the interview progressed",
          "Your ability to relax shows good adaptability",
          "Consider using your warm-up strategy in future interviews",
          "Building rapport early can help you reach this comfort level faster",
        ],
      });
    }

    // If no specific issues found, add general tips
    if (suggestions.length === 0) {
      suggestions.push({
        category: "General Interview Tips",
        iconType: "briefcase",
        color: "#6B7280",
        tips: [
          "Your emotional presentation was balanced overall",
          "Continue practicing to maintain this consistency",
          "Focus on authenticity rather than perfection",
          "Consider mock interviews to further refine your approach",
        ],
      });
    }

    return suggestions;
  }

  if (!summary) {
    return (
      <div className="text-center py-8 text-surface-400">
        {t("no_emotion_data")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dominant Emotion Card */}
      <div className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-xl p-6 border border-surface-200 dark:border-surface-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-200 mb-4">
          {t("dominant_emotion")}
        </h3>
        <div className="flex items-center gap-4">
          <div
            className="flex-shrink-0"
            style={{
              filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.15))",
            }}
          >
            <EmotionIcon emotion={summary.dominantEmotion} size="2xl" />
          </div>
          <div>
            <div className="text-3xl font-bold text-surface-900 dark:text-white">
              {t(summary.dominantEmotion)}
            </div>
            <div className="text-surface-600 dark:text-surface-400 text-sm mt-1">
              {summary.dominantPercentage}% {t("of_recording")}
            </div>
          </div>
        </div>
      </div>

      {/* Top Emotions (Occurrence Frequency) */}
      <div className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-xl p-6 border border-surface-200 dark:border-surface-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-200 mb-2">
          {t("emotion_distribution")}
        </h3>
        <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">
          Frequency of detected dominant emotions across frames
        </p>
        <div className="space-y-3">
          {summary.topEmotions.map((item, index) => (
            <div key={item.emotion} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <EmotionIcon emotion={item.emotion} size="md" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-surface-700 dark:text-surface-300 text-sm font-medium">
                    {t(item.emotion)}
                  </span>
                  <span className="text-surface-600 dark:text-surface-400 text-xs">
                    {item.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: emotionColors[item.emotion],
                    }}
                  />
                </div>
              </div>
              {index === 0 && (
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 px-2 py-1 rounded">
                  {t("top")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Intensity Distribution */}
      {summary.intensityDistribution &&
        Object.keys(summary.intensityDistribution).length > 0 && (
          <div className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-xl p-6 border border-surface-200 dark:border-surface-700 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-200 mb-2">
              {t("emotion_intensity_distribution") ||
                "Emotion Intensity Distribution"}
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">
              Average relative intensity proportions (smoothed) across all
              detected emotions
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(summary.intensityDistribution)
                .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))
                .map(([emotion, pct]) => (
                  <div
                    key={emotion}
                    className="flex items-center gap-2 p-3 rounded-lg bg-surface-100 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700"
                  >
                    <EmotionIcon emotion={emotion} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-surface-600 dark:text-surface-300 capitalize">
                          {t(emotion)}
                        </span>
                        <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: emotionColors[emotion],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-xl p-4 border border-surface-200 dark:border-surface-700 transition-colors duration-200">
          <div className="text-surface-600 dark:text-surface-400 text-xs uppercase tracking-wide mb-2">
            {t("emotion_changes")}
          </div>
          <div className="text-2xl font-bold text-surface-900 dark:text-white">
            {summary.changeRate}%
          </div>
        </div>
        <div className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-xl p-4 border border-surface-200 dark:border-surface-700 transition-colors duration-200">
          <div className="text-surface-600 dark:text-surface-400 text-xs uppercase tracking-wide mb-2">
            {t("detection_confidence")}
          </div>
          <div className="text-2xl font-bold text-surface-900 dark:text-white">
            {summary.avgConfidence}%
          </div>
        </div>
      </div>

      {/* Insights */}
      {summary.insights && summary.insights.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700/30 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-200 mb-4 flex items-center gap-2">
            <CategoryIcon category="insights" size="sm" />
            {t("emotion_insights")}
          </h3>
          <ul className="space-y-2">
            {summary.insights.map((insight, index) => (
              <li
                key={index}
                className="text-surface-700 dark:text-surface-300 text-sm flex gap-2"
              >
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coaching Suggestions */}
      {summary.suggestions && summary.suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-200 flex items-center gap-2">
            <CategoryIcon category="coaching" size="sm" />
            Coaching Suggestions
          </h3>
          {summary.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-xl p-5 border border-surface-200 dark:border-surface-700 transition-colors duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${suggestion.color}20` }}
                >
                  <CategoryIcon category={suggestion.iconType} size="lg" />
                </div>
                <div>
                  <h4
                    className="font-semibold text-base"
                    style={{ color: suggestion.color }}
                  >
                    {suggestion.category}
                  </h4>
                  <p className="text-xs text-surface-600 dark:text-surface-400">
                    Personalized feedback based on your emotional patterns
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {suggestion.tips.map((tip, tipIndex) => (
                  <li
                    key={tipIndex}
                    className="text-sm text-surface-700 dark:text-surface-300 flex gap-3 items-start"
                  >
                    <span
                      className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: suggestion.color }}
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="text-center text-surface-500 text-xs">
        {t("analyzed_frames", { count: summary.totalFrames })}
      </div>
    </div>
  );
};

export default EmotionSummary;
