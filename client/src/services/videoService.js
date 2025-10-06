import { apiService } from "./api";

const videoService = {
  /**
   * Start a video recording session for an interview
   * @param {string} interviewId
   * @returns {Promise<Object>}
   */
  async startRecordingSession(interviewId) {
    return await apiService.post(`/video/start/${interviewId}`);
  },

  /**
   * Stop a video recording session for an interview
   * @param {string} interviewId
   * @returns {Promise<Object>}
   */
  async stopRecordingSession(interviewId) {
    return await apiService.post(`/video/stop/${interviewId}`);
  },

  /**
   * Upload a video recording for a specific question
   * @param {string} interviewId
   * @param {number} questionIndex
   * @param {Blob} videoBlob
   * @param {number} duration Duration in seconds
   * @param {Object} facialAnalysis Optional facial analysis data
   * @returns {Promise<Object>}
   */
  async uploadVideo(
    interviewId,
    questionIndex,
    videoBlob,
    duration,
    facialAnalysis = null
  ) {
    const formData = new FormData();
    formData.append("video", videoBlob, `question_${questionIndex}.webm`);
    formData.append("duration", duration.toString());

    if (facialAnalysis) {
      formData.append("facialAnalysis", JSON.stringify(facialAnalysis));
    }

    return await apiService.upload(
      `/video/upload/${interviewId}/${questionIndex}`,
      formData
    );
  },

  /**
   * Get video playback information for a question
   * @param {string} interviewId
   * @param {number} questionIndex
   * @returns {Promise<Object>}
   */
  async getVideoPlayback(interviewId, questionIndex) {
    const resp = await apiService.get(
      `/video/playback/${interviewId}/${questionIndex}`
    );
    if (resp?.success && resp.data?.videoUrl) {
      return {
        ...resp,
        resolvedUrl: resp.data.videoUrl,
        cdn: !!resp.data.cdn,
      };
    }
    return resp;
  },

  /**
   * Delete a video for a specific question
   * @param {string} interviewId
   * @param {number} questionIndex
   * @returns {Promise<Object>}
   */
  async deleteVideo(interviewId, questionIndex) {
    return await apiService.delete(`/video/${interviewId}/${questionIndex}`);
  },

  /**
   * Get video summary for an interview
   * @param {string} interviewId
   * @returns {Promise<Object>}
   */
  async getVideoSummary(interviewId) {
    return await apiService.get(`/video/summary/${interviewId}`);
  },

  /**
   * Get video stream URL
   * @param {string} filename
   * @returns {string}
   */
  getStreamUrl(filename) {
    const baseUrl =
      process.env.REACT_APP_API_BASE ||
      process.env.REACT_APP_API_BASE_URL ||
      "/api";
    return `${baseUrl}/video/stream/${filename}`;
  },

  /**
   * Resolve best playback URL from either a prior getVideoPlayback call result
   * or a raw question.video object (if present client-side)
   */
  resolvePlaybackUrl(source) {
    if (!source) return null;
    if (typeof source === "string") return source;
    if (source.resolvedUrl) return source.resolvedUrl;
    if (source.videoUrl) return source.videoUrl;
    if (source.cloudinary?.url) return source.cloudinary.url;
    if (source.filename) return this.getStreamUrl(source.filename);
    return null;
  },

  /**
   * Get transcription for a specific video
   * @param {string} interviewId
   * @param {number} questionIndex
   * @returns {Promise<Object>}
   */
  async getTranscription(interviewId, questionIndex) {
    return await apiService.get(
      `/video/transcript/${interviewId}/${questionIndex}`
    );
  },

  /**
   * Poll transcription until completed or failed
   * @param {string} interviewId
   * @param {number} questionIndex
   * @param {object} options { intervalMs, timeoutMs, onUpdate }
   */
  async pollTranscription(interviewId, questionIndex, options = {}) {
    const { intervalMs = 4000, timeoutMs = 60000, onUpdate } = options;
    const start = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const resp = await this.getTranscription(interviewId, questionIndex);
      const status = resp?.data?.transcription?.status;
      if (onUpdate) onUpdate(resp?.data?.transcription);
      if (status === "completed" || status === "failed") return resp;
      if (Date.now() - start > timeoutMs) return resp; // timeout returns last state
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  },

  /**
   * Retry a failed or not started transcription
   * @param {string} interviewId
   * @param {number} questionIndex
   */
  async retryTranscription(interviewId, questionIndex) {
    return await apiService.post(
      `/video/transcript/${interviewId}/${questionIndex}/retry`
    );
  },
};

export default videoService;
