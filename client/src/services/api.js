import axios from "axios";
import { getLastRequestId } from "./axiosRequestId"; // for enriched error context

// Create axios instance with base configuration
const api = axios.create({
  // Prefer explicit REACT_APP_API_BASE, fall back to legacy var, then proxy-friendly '/api'
  baseURL:
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE_URL ||
    "/api",
  timeout: 10000,
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
api.interceptors.request.use(
  async (config) => {
    try {
      if (getTokenFunction) {
        // Get the JWT token for backend authentication
        const token = await getTokenFunction();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // Authentication token retrieval failed
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
