import axios from "axios";
axios.defaults.withCredentials = true;

// OPTIMIZATION: Define timeout constant to avoid magic number
const API_TIMEOUT_MS = 10000;

// Create axios instance with base configuration
const api = axios.create({
  // Prefer explicit REACT_APP_API_BASE, fall back to legacy var, then proxy-friendly '/api'
  baseURL:
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE_URL ||
    "/api",
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// Store the getToken function
let getTokenFunction = null;

// Function to set the token function
export const setAuthToken = (getToken) => {
  getTokenFunction = getToken;
};

// Request interceptor to add auth token
// NOTE: This is primarily for backward compatibility with JWT-based endpoints
// MIGRATION: Session-based auth (Google OAuth) uses cookies, not Bearer tokens
api.interceptors.request.use(
  async (config) => {
    try {
      // Legacy JWT token support for backward compatibility
      if (getTokenFunction) {
        const token = await getTokenFunction();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // Removed deprecated mock auth headers for production cleanup
    } catch (error) {
      // Authentication token retrieval failed - silent fail for session-based auth
      // eslint-disable-next-line no-console
      console.warn("Failed to get authentication token:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Unified success envelope already inside response.data
    return response;
  },
  (error) => {
    const { response } = error || {};
    if (response?.status === 401) {
      window.location.href = "/login"; // Auth expired / invalid
    }
    // Normalize error object so callers can rely on a shape
    const normalized = {
      status: response?.status || 0,
      code: response?.data?.error || null,
      message: response?.data?.message || error.message || "Request failed",
      meta: response?.data?.meta,
      requestId:
        response?.data?.requestId ||
        response?.headers?.["x-request-id"] ||
        getLastRequestId() ||
        null,
      raw: error,
    };
    return Promise.reject(normalized);
  }
);

// API service object with common methods
export const apiService = {
  get: async (url) => {
    const response = await api.get(url);
    return response.data; // { success, data, message? }
  },

  post: async (url, data) => {
    const response = await api.post(url, data);
    return response.data;
  },

  put: async (url, data) => {
    const response = await api.put(url, data);
    return response.data;
  },

  delete: async (url) => {
    const response = await api.delete(url);
    return response.data;
  },

  // File upload method
  upload: async (url, formData) => {
    const response = await api.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default api;
