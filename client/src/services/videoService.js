import { apiService } from './api';

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
   * @returns {Promise<Object>}
   */
  async uploadVideo(interviewId, questionIndex, videoBlob, duration) {
    const formData = new FormData();
    formData.append('video', videoBlob, `question_${questionIndex}.webm`);
    formData.append('duration', duration.toString());

    return await apiService.upload(`/video/upload/${interviewId}/${questionIndex}`, formData);
  },

  /**
   * Get video playback information for a question
   * @param {string} interviewId 
   * @param {number} questionIndex 
   * @returns {Promise<Object>}
   */
  async getVideoPlayback(interviewId, questionIndex) {
    return await apiService.get(`/video/playback/${interviewId}/${questionIndex}`);
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
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
    return `${baseUrl}/video/stream/${filename}`;
  }
};

export default videoService;