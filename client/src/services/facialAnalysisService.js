import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection';

class FacialAnalysisService {
  constructor() {
    this.detector = null;
    this.isInitialized = false;
    this.analysisInterval = null;
    this.metrics = {
      eyeContact: 0,
      blinkRate: 0,
      headSteadiness: 0,
      smilePercentage: 0,
      offScreenPercentage: 0,
      confidenceScore: 0,
      environmentQuality: 0
    };
    this.baseline = null;
    this.analysisHistory = [];
    this.lastFacePosition = null;
    this.blinkCount = 0;
    this.lastEyeState = null;
    this.startTime = null;
    this.faceDetectedFrames = 0;
    this.totalFrames = 0;
  }

  /**
   * Initialize the face detection model
   */
  async initialize() {
    try {
      if (this.isInitialized) return true;

      // Set TensorFlow.js backend
      await tf.ready();
      
      // Initialize MediaPipe FaceMesh detector
      const model = faceDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        refineLandmarks: true,
        maxFaces: 1
      };

      this.detector = await faceDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;
      console.log('Facial Analysis Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize facial analysis:', error);
      return false;
    }
  }

  /**
   * Start baseline calibration
   */
  async startBaseline(videoElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      const calibrationData = [];
      const calibrationDuration = 10000; // 10 seconds
      const startTime = Date.now();
      
      const calibrationInterval = setInterval(async () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed >= calibrationDuration) {
          clearInterval(calibrationInterval);
          this.baseline = this.calculateBaseline(calibrationData);
          resolve(this.baseline);
          return;
        }
        
        try {
          const faces = await this.detector.estimateFaces(videoElement);
          if (faces.length > 0) {
            const face = faces[0];
            calibrationData.push({
              timestamp: currentTime,
              face: face,
              headPosition: this.calculateHeadPosition(face),
              eyeAspectRatio: this.calculateEyeAspectRatio(face)
            });
          }
        } catch (error) {
          console.warn('Calibration frame skipped:', error);
        }
      }, 100); // Every 100ms
    });
  }

  /**
   * Calculate baseline metrics from calibration data
   */
  calculateBaseline(calibrationData) {
    if (calibrationData.length === 0) return null;

    const headPositions = calibrationData.map(d => d.headPosition);
    const eyeRatios = calibrationData.map(d => d.eyeAspectRatio);

    return {
      averageHeadPosition: {
        x: headPositions.reduce((sum, pos) => sum + pos.x, 0) / headPositions.length,
        y: headPositions.reduce((sum, pos) => sum + pos.y, 0) / headPositions.length,
        z: headPositions.reduce((sum, pos) => sum + pos.z, 0) / headPositions.length
      },
      averageEyeRatio: eyeRatios.reduce((sum, ratio) => sum + ratio, 0) / eyeRatios.length,
      headMovementRange: {
        x: Math.max(...headPositions.map(p => p.x)) - Math.min(...headPositions.map(p => p.x)),
        y: Math.max(...headPositions.map(p => p.y)) - Math.min(...headPositions.map(p => p.y))
      }
    };
  }

  /**
   * Start real-time analysis
   */
  startAnalysis(videoElement, onMetricsUpdate) {
    if (!this.isInitialized) {
      console.error('Service not initialized');
      return;
    }

    this.startTime = Date.now();
    this.resetMetrics();

    this.analysisInterval = setInterval(async () => {
      try {
        await this.analyzeFrame(videoElement);
        this.updateMetrics();
        if (onMetricsUpdate) {
          onMetricsUpdate(this.getMetrics());
        }
      } catch (error) {
        console.warn('Analysis frame skipped:', error);
      }
    }, 200); // Every 200ms for performance
  }

  /**
   * Stop analysis
   */
  stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  /**
   * Analyze a single frame
   */
  async analyzeFrame(videoElement) {
    this.totalFrames++;
    
    const faces = await this.detector.estimateFaces(videoElement);
    
    if (faces.length === 0) {
      // No face detected
      this.analysisHistory.push({
        timestamp: Date.now(),
        faceDetected: false,
        metrics: null
      });
      return;
    }

    this.faceDetectedFrames++;
    const face = faces[0];
    
    // Calculate frame metrics
    const frameMetrics = {
      timestamp: Date.now(),
      faceDetected: true,
      headPosition: this.calculateHeadPosition(face),
      eyeAspectRatio: this.calculateEyeAspectRatio(face),
      smileStrength: this.calculateSmileStrength(face),
      eyeContactDirection: this.calculateEyeContactDirection(face),
      faceOrientation: this.calculateFaceOrientation(face)
    };

    this.analysisHistory.push(frameMetrics);
    
    // Detect blinks
    this.detectBlink(frameMetrics.eyeAspectRatio);
    
    // Keep only recent history (last 30 seconds)
    const cutoffTime = Date.now() - 30000;
    this.analysisHistory = this.analysisHistory.filter(h => h.timestamp > cutoffTime);
  }

  /**
   * Calculate head position from face landmarks
   */
  calculateHeadPosition(face) {
    if (!face.keypoints || face.keypoints.length === 0) return { x: 0, y: 0, z: 0 };
    
    // Use nose tip as reference point
    const noseTip = face.keypoints.find(kp => kp.name === 'noseTip') || face.keypoints[1];
    return {
      x: noseTip.x,
      y: noseTip.y,
      z: 0 // TensorFlow.js doesn't provide Z coordinate reliably
    };
  }

  /**
   * Calculate eye aspect ratio for blink detection
   */
  calculateEyeAspectRatio(face) {
    if (!face.keypoints || face.keypoints.length < 6) return 0.25;
    
    // Simplified eye aspect ratio calculation
    // In a real implementation, you'd use specific eye landmark points
    const leftEye = face.keypoints.slice(130, 145); // Approximate left eye region
    const rightEye = face.keypoints.slice(359, 374); // Approximate right eye region
    
    if (leftEye.length === 0 || rightEye.length === 0) return 0.25;
    
    // Calculate vertical distance vs horizontal distance
    const leftEyeHeight = Math.abs(leftEye[1].y - leftEye[5].y);
    const leftEyeWidth = Math.abs(leftEye[0].x - leftEye[3].x);
    const leftRatio = leftEyeHeight / leftEyeWidth;
    
    const rightEyeHeight = Math.abs(rightEye[1].y - rightEye[5].y);
    const rightEyeWidth = Math.abs(rightEye[0].x - rightEye[3].x);
    const rightRatio = rightEyeHeight / rightEyeWidth;
    
    return (leftRatio + rightRatio) / 2;
  }

  /**
   * Calculate smile strength
   */
  calculateSmileStrength(face) {
    if (!face.keypoints || face.keypoints.length < 20) return 0;
    
    // Use mouth corner positions to detect smile
    const mouthCorners = face.keypoints.slice(50, 70); // Approximate mouth region
    if (mouthCorners.length < 4) return 0;
    
    // Simple smile detection based on mouth corner elevation
    const leftCorner = mouthCorners[0];
    const rightCorner = mouthCorners[3];
    const mouthCenter = mouthCorners[1];
    
    const avgCornerHeight = (leftCorner.y + rightCorner.y) / 2;
    const smileRatio = Math.max(0, (mouthCenter.y - avgCornerHeight) / 10);
    
    return Math.min(1, smileRatio);
  }

  /**
   * Calculate eye contact direction
   */
  calculateEyeContactDirection(face) {
    if (!face.keypoints || face.keypoints.length < 10) return { x: 0, y: 0 };
    
    // Simplified gaze direction estimation
    const noseTip = face.keypoints[1];
    const faceCenter = face.keypoints[0];
    
    return {
      x: (noseTip.x - faceCenter.x) / 100,
      y: (noseTip.y - faceCenter.y) / 100
    };
  }

  /**
   * Calculate face orientation
   */
  calculateFaceOrientation(face) {
    if (!face.keypoints || face.keypoints.length < 5) return { pitch: 0, yaw: 0, roll: 0 };
    
    // Simplified orientation calculation
    const leftEye = face.keypoints[2];
    const rightEye = face.keypoints[3];
    const nose = face.keypoints[1];
    
    const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    
    return {
      pitch: 0, // Not reliably calculable with 2D landmarks
      yaw: (nose.x - (leftEye.x + rightEye.x) / 2) / 50,
      roll: eyeAngle * 180 / Math.PI
    };
  }

  /**
   * Detect blinks based on eye aspect ratio
   */
  detectBlink(eyeAspectRatio) {
    const blinkThreshold = 0.15;
    const isEyesClosed = eyeAspectRatio < blinkThreshold;
    
    if (this.lastEyeState === false && isEyesClosed) {
      this.blinkCount++;
    }
    
    this.lastEyeState = isEyesClosed;
  }

  /**
   * Update aggregated metrics
   */
  updateMetrics() {
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - this.startTime) / 60000;
    
    if (this.analysisHistory.length === 0) return;
    
    const recentFrames = this.analysisHistory.slice(-50); // Last 10 seconds
    const faceFrames = recentFrames.filter(f => f.faceDetected);
    
    // Calculate metrics
    this.metrics.eyeContact = this.calculateEyeContactPercentage(faceFrames);
    this.metrics.blinkRate = elapsedMinutes > 0 ? this.blinkCount / elapsedMinutes : 0;
    this.metrics.headSteadiness = this.calculateHeadSteadiness(faceFrames);
    this.metrics.smilePercentage = this.calculateSmilePercentage(faceFrames);
    this.metrics.offScreenPercentage = this.calculateOffScreenPercentage();
    this.metrics.confidenceScore = this.calculateConfidenceScore();
    this.metrics.environmentQuality = this.calculateEnvironmentQuality(faceFrames);
  }

  /**
   * Calculate eye contact percentage
   */
  calculateEyeContactPercentage(faceFrames) {
    if (faceFrames.length === 0) return 0;
    
    const goodEyeContact = faceFrames.filter(frame => {
      const gaze = frame.eyeContactDirection;
      const gazeDistance = Math.sqrt(gaze.x * gaze.x + gaze.y * gaze.y);
      return gazeDistance < 0.3; // Within reasonable gaze range
    });
    
    return (goodEyeContact.length / faceFrames.length) * 100;
  }

  /**
   * Calculate head steadiness
   */
  calculateHeadSteadiness(faceFrames) {
    if (faceFrames.length < 2 || !this.baseline) return 100;
    
    const movements = [];
    for (let i = 1; i < faceFrames.length; i++) {
      const prev = faceFrames[i - 1].headPosition;
      const curr = faceFrames[i].headPosition;
      const movement = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      movements.push(movement);
    }
    
    const avgMovement = movements.reduce((sum, m) => sum + m, 0) / movements.length;
    const steadinessScore = Math.max(0, 100 - (avgMovement / 2));
    
    return Math.min(100, steadinessScore);
  }

  /**
   * Calculate smile percentage
   */
  calculateSmilePercentage(faceFrames) {
    if (faceFrames.length === 0) return 0;
    
    const smilingFrames = faceFrames.filter(frame => frame.smileStrength > 0.3);
    return (smilingFrames.length / faceFrames.length) * 100;
  }

  /**
   * Calculate off-screen percentage
   */
  calculateOffScreenPercentage() {
    if (this.totalFrames === 0) return 0;
    
    const offScreenFrames = this.totalFrames - this.faceDetectedFrames;
    return (offScreenFrames / this.totalFrames) * 100;
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidenceScore() {
    const weights = {
      eyeContact: 0.3,
      headSteadiness: 0.2,
      offScreen: 0.25,
      blinkRate: 0.15,
      environment: 0.1
    };
    
    const normalizedBlinkRate = Math.max(0, 100 - Math.abs(this.metrics.blinkRate - 20) * 2);
    const offScreenScore = 100 - this.metrics.offScreenPercentage;
    
    const score = 
      (this.metrics.eyeContact * weights.eyeContact) +
      (this.metrics.headSteadiness * weights.headSteadiness) +
      (offScreenScore * weights.offScreen) +
      (normalizedBlinkRate * weights.blinkRate) +
      (this.metrics.environmentQuality * weights.environment);
    
    return Math.round(score);
  }

  /**
   * Calculate environment quality
   */
  calculateEnvironmentQuality(faceFrames) {
    if (faceFrames.length === 0) return 50;
    
    // Basic environment quality based on face detection consistency
    const detectionRate = this.faceDetectedFrames / this.totalFrames;
    return Math.round(detectionRate * 100);
  }

  /**
   * Reset metrics for new analysis session
   */
  resetMetrics() {
    this.metrics = {
      eyeContact: 0,
      blinkRate: 0,
      headSteadiness: 0,
      smilePercentage: 0,
      offScreenPercentage: 0,
      confidenceScore: 0,
      environmentQuality: 0
    };
    this.analysisHistory = [];
    this.blinkCount = 0;
    this.faceDetectedFrames = 0;
    this.totalFrames = 0;
    this.lastEyeState = null;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get analysis summary for session end
   */
  getSessionSummary() {
    const totalTime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    
    return {
      metrics: this.getMetrics(),
      duration: totalTime,
      totalFrames: this.totalFrames,
      faceDetectedFrames: this.faceDetectedFrames,
      detectionRate: this.totalFrames > 0 ? (this.faceDetectedFrames / this.totalFrames) * 100 : 0,
      analysisHistory: this.analysisHistory.length,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.eyeContact < 60) {
      recommendations.push({
        type: 'eye_contact',
        message: 'Try to look directly at the camera more often to improve eye contact',
        priority: 'high'
      });
    }
    
    if (this.metrics.headSteadiness < 70) {
      recommendations.push({
        type: 'stability',
        message: 'Keep your head more stable to appear more confident',
        priority: 'medium'
      });
    }
    
    if (this.metrics.offScreenPercentage > 20) {
      recommendations.push({
        type: 'presence',
        message: 'Stay in frame during your response to maintain engagement',
        priority: 'high'
      });
    }
    
    if (this.metrics.blinkRate < 10 || this.metrics.blinkRate > 30) {
      recommendations.push({
        type: 'natural_behavior',
        message: 'Maintain a natural blink rate (15-20 per minute) to appear relaxed',
        priority: 'low'
      });
    }
    
    if (this.metrics.smilePercentage < 10) {
      recommendations.push({
        type: 'engagement',
        message: 'Show more positive facial expressions to appear engaged',
        priority: 'medium'
      });
    }
    
    return recommendations.slice(0, 3); // Top 3 recommendations
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopAnalysis();
    if (this.detector) {
      this.detector.dispose();
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const facialAnalysisService = new FacialAnalysisService();
export default facialAnalysisService;