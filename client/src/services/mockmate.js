import api from "./api";

/**
 * Auth Service - Handles authentication related API calls
 */
export const authService = {
  // Check health and auth status
  checkHealth: async () => {
    try {
      const response = await api.get("/health");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Health check failed");
    }
  },
};

/**
 * User Service - Handles user profile and data
 */
export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get("/users/profile");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to get profile");
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/users/profile", profileData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to update profile"
      );
    }
  },

  // Get user statistics
  getStats: async () => {
    try {
      const response = await api.get("/users/stats");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to get statistics"
      );
    }
  },
};

/**
 * Interview Service - Handles interview sessions
 */
export const interviewService = {
  // Create new interview session
  createInterview: async (interviewData) => {
    try {
      const response = await api.post("/interviews", interviewData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to create interview"
      );
    }
  },

  // Get user's interviews
  getInterviews: async () => {
    try {
      const response = await api.get("/interviews");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to get interviews"
      );
    }
  },

  // Get specific interview
  getInterview: async (interviewId) => {
    try {
      const response = await api.get(`/interviews/${interviewId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to get interview");
    }
  },

  // Submit interview response
  submitResponse: async (interviewId, responseData) => {
    try {
      const response = await api.post(
        `/interviews/${interviewId}/responses`,
        responseData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to submit response"
      );
    }
  },

  // Submit answer to specific question
  submitAnswer: async (interviewId, questionIndex, answerData) => {
    try {
      const response = await api.post(
        `/interviews/${interviewId}/answer/${questionIndex}`,
        answerData
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to submit answer");
    }
  },

  // Get follow-up questions for a specific question
  getFollowUpQuestions: async (interviewId, questionIndex) => {
    try {
      const response = await api.post(
        `/interviews/${interviewId}/followup/${questionIndex}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to get follow-up questions"
      );
    }
  },
};

/**
 * Question Service - Handles AI question generation
 */
export const questionService = {
  // Generate interview questions
  generateQuestions: async (questionData) => {
    try {
      const response = await api.post("/questions/generate", questionData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to generate questions"
      );
    }
  },
};

/**
 * Report Service - Handles performance reports
 */
export const reportService = {
  // Generate interview report
  generateReport: async (interviewId, reportType = "comprehensive") => {
    try {
      const response = await api.post(`/reports/generate/${interviewId}`, {
        reportType,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to generate report"
      );
    }
  },

  // Get user reports
  getReports: async () => {
    try {
      const response = await api.get("/reports");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to get reports");
    }
  },

  // Get a specific report for an interview
  getReportByInterview: async (interviewId, type = "comprehensive") => {
    try {
      const response = await api.get(`/reports/${interviewId}?type=${type}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to get the report"
      );
    }
  },
};
