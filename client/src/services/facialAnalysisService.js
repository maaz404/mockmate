// Temporary mock service for development
class FacialAnalysisService {
  constructor() {
    this.detector = null;
    this.isInitialized = false;
    this.metrics = {
      eyeContact: 0,
      blinkRate: 0,
      headSteadiness: 0,
      smilePercentage: 0,
      offScreenPercentage: 0,
      confidenceScore: 0,
      environmentQuality: 0,
    };
    this.baseline = null;
  }

  async initialize() {
    console.log("Facial Analysis Service initialized (mock mode)");
    this.isInitialized = true;
    return true;
  }

  async startBaseline(_videoElement) {
    // _videoElement intentionally unused (mock placeholder)
    return new Promise((resolve) => {
      setTimeout(() => {
        this.baseline = { completed: true };
        resolve(this.baseline);
      }, 10000);
    });
  }

  startAnalysis(_videoElement, onMetricsUpdate) {
    // _videoElement intentionally unused (mock placeholder)
    // Mock analysis with random metrics
    this.analysisInterval = setInterval(() => {
      this.metrics = {
        eyeContact: Math.random() * 100,
        blinkRate: 15 + Math.random() * 10,
        headSteadiness: 80 + Math.random() * 20,
        smilePercentage: Math.random() * 30,
        offScreenPercentage: Math.random() * 10,
        confidenceScore: 60 + Math.random() * 40,
        environmentQuality: 80 + Math.random() * 20,
      };

      if (onMetricsUpdate) {
        onMetricsUpdate(this.metrics);
      }
    }, 1000);
  }

  stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getSessionSummary() {
    return {
      metrics: this.getMetrics(),
      duration: 60,
      totalFrames: 1800,
      faceDetectedFrames: 1700,
      detectionRate: 94.4,
      recommendations: [
        {
          type: "eye_contact",
          message: "Try to maintain more eye contact with the camera",
          priority: "medium",
        },
        {
          type: "stability",
          message: "Keep your head more stable during responses",
          priority: "low",
        },
      ],
    };
  }

  cleanup() {
    this.stopAnalysis();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const facialAnalysisService = new FacialAnalysisService();
export default facialAnalysisService;
