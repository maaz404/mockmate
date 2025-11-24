/**
 * Emotion Analysis Service
 * Handles communication with Python DeepFace microservice
 */

const axios = require("axios");

const EMOTION_SERVICE_URL =
  process.env.EMOTION_SERVICE_URL || "http://localhost:5001";

class EmotionService {
  /**
   * Check if emotion service is healthy
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${EMOTION_SERVICE_URL}/health`, {
        timeout: 3000,
      });
      return response.data.status === "healthy";
    } catch (error) {
      console.error("[EmotionService] Health check failed:", error.message);
      return false;
    }
  }

  /**
   * Analyze emotion from a single frame
   * @param {string} base64Frame - Base64-encoded image string
   * @param {number} timestamp - Timestamp of the frame
   * @returns {Promise<Object>} Emotion analysis result
   */
  async analyzeFrame(base64Frame, timestamp = Date.now()) {
    try {
      const response = await axios.post(
        `${EMOTION_SERVICE_URL}/analyze`,
        {
          frame: base64Frame,
          timestamp: timestamp,
        },
        {
          timeout: 10000, // 10 seconds timeout
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          emotion: response.data.emotion,
          emotions: response.data.emotions, // smoothed emotions
          rawEmotions: response.data.raw_emotions || null,
          timestamp: response.data.timestamp,
          confidence: response.data.confidence,
          contributions: response.data.contributions || null,
          smoothing: response.data.smoothing || null,
        };
      } else {
        throw new Error(response.data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("[EmotionService] Frame analysis error:", error.message);
      if (error.response) {
        console.error("[EmotionService] Python service error response:", {
          status: error.response.status,
          data: error.response.data,
        });
      }
      return {
        success: false,
        error: error.message,
        pythonError: error.response?.data,
        timestamp: timestamp,
      };
    }
  }

  /**
   * Analyze emotions from multiple frames (batch processing)
   * @param {Array<Object>} frames - Array of {frame: base64, timestamp: number}
   * @returns {Promise<Object>} Batch analysis results
   */
  async analyzeFramesBatch(frames) {
    try {
      const response = await axios.post(
        `${EMOTION_SERVICE_URL}/batch-analyze`,
        {
          frames: frames,
        },
        {
          timeout: 30000, // 30 seconds for batch
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          results: response.data.results,
          analyzed: response.data.analyzed,
        };
      } else {
        throw new Error(response.data.error || "Batch analysis failed");
      }
    } catch (error) {
      console.error("[EmotionService] Batch analysis error:", error.message);
      return {
        success: false,
        error: error.message,
        results: [],
      };
    }
  }

  /**
   * Calculate emotion summary from timeline data
   * @param {Array<Object>} emotionTimeline - Array of emotion data points
   * @returns {Object} Summary statistics
   */
  calculateEmotionSummary(emotionTimeline) {
    if (!emotionTimeline || emotionTimeline.length === 0) {
      return {
        dominantEmotion: "neutral",
        averageConfidence: 0,
        emotionDistribution: {},
        emotionChanges: 0,
        dataPoints: 0,
      };
    }

    // Count emotion occurrences
    const emotionCounts = {};
    let totalConfidence = 0;
    let previousEmotion = null;
    let emotionChanges = 0;

    emotionTimeline.forEach((point) => {
      const emotion = point.emotion || "neutral";
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      totalConfidence += point.confidence || 0;

      // Collect raw emotion averages if available
      if (point.rawEmotions || point.raw_emotions) {
        const raw = point.rawEmotions || point.raw_emotions;
        Object.entries(raw).forEach(([k, v]) => {
          if (typeof v === "number") {
            rawEmotionTotals[k] = (rawEmotionTotals[k] || 0) + v;
          }
        });
        rawEmotionFrames += 1;
      }

      if (previousEmotion && previousEmotion !== emotion) {
        emotionChanges++;
      }
      previousEmotion = emotion;
    });

    // Find dominant emotion
    let dominantEmotion = "neutral";
    let maxCount = 0;
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion;
      }
    });

    // Calculate distribution percentages
    const total = emotionTimeline.length;
    const emotionDistribution = {};
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      emotionDistribution[emotion] = Math.round((count / total) * 100);
    });

    const summary = {
      dominantEmotion,
      averageConfidence: totalConfidence / total,
      emotionDistribution,
      emotionChanges,
      dataPoints: total,
      timeline: emotionTimeline,
    };

    if (rawEmotionFrames > 0) {
      const rawAverages = {};
      Object.entries(rawEmotionTotals).forEach(([k, v]) => {
        rawAverages[k] = +(v / rawEmotionFrames).toFixed(4);
      });
      summary.rawEmotionAverages = rawAverages;
    }
    return summary;
  }

  /**
   * Generate emotion insights based on summary
   * @param {Object} summary - Emotion summary object
   * @returns {Array<string>} Array of insight strings
   */
  generateInsights(summary) {
    const insights = [];
    const { dominantEmotion, emotionDistribution, emotionChanges, dataPoints } =
      summary;

    // Dominant emotion insight
    const percentage = emotionDistribution[dominantEmotion] || 0;
    insights.push(
      `Your dominant emotion was ${dominantEmotion} (${percentage}% of the time)`
    );

    // Confidence insight
    if (summary.averageConfidence > 0.7) {
      insights.push(
        "Your expressions were clear and confident throughout the interview"
      );
    } else if (summary.averageConfidence > 0.5) {
      insights.push("Your emotional expressions were moderately consistent");
    }

    // Emotional stability
    const changeRate = dataPoints > 0 ? emotionChanges / dataPoints : 0;
    if (changeRate < 0.2) {
      insights.push(
        "You maintained good emotional stability during the interview"
      );
    } else if (changeRate > 0.5) {
      insights.push(
        "You showed diverse emotional responses, which can indicate engagement"
      );
    }

    // Positive emotions
    const positiveEmotions = ["happy", "surprise"];
    const positivePercentage = positiveEmotions.reduce(
      (sum, emotion) => sum + (emotionDistribution[emotion] || 0),
      0
    );
    if (positivePercentage > 50) {
      insights.push(
        "You maintained a positive demeanor for most of the interview"
      );
    }

    // Neutral dominance
    if (dominantEmotion === "neutral" && percentage > 60) {
      insights.push(
        "You maintained a professional and neutral expression throughout"
      );
    }

    return insights;
  }
}

module.exports = new EmotionService();
