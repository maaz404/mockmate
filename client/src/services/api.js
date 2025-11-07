import axios from "axios";
import { getLastRequestId } from "./axiosRequestId";

// Create axios instance with base configuration
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE_URL ||
    "http://localhost:5000/api",
  timeout: 30000, // Increased timeout for large requests
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
    // Skip adding token for refresh requests
    if (config.skipAuth) {
      return config;
    }

    try {
      if (getTokenFunction) {
        const token = await getTokenFunction();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
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
    return response;
  },
  async (error) => {
    const { response, config } = error || {};

    // Handle 401 Unauthorized - token expired
    if (response?.status === 401 && !config._retry) {
      config._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const baseURL =
            process.env.REACT_APP_API_BASE ||
            process.env.REACT_APP_API_BASE_URL ||
            "http://localhost:5000/api";
          const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } =
            refreshResponse.data.data;

          // Update tokens
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${accessToken}`;
          return axios(config);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // For other 401s or if retry failed, redirect to login
    if (response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }

    // Normalize error object
    const normalized = {
      status: response?.status || 0,
      code: response?.data?.error || response?.data?.code || null,
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
  get: async (url, config) => {
    const response = await api.get(url, config);
    return response.data;
  },

  post: async (url, data, config) => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async (url, data, config) => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  patch: async (url, data, config) => {
    const response = await api.patch(url, data, config);
    return response.data;
  },

  delete: async (url, config) => {
    const response = await api.delete(url, config);
    return response.data;
  },

  // File upload method
  // IMPORTANT: Do NOT set Content-Type explicitly so the browser can add the correct multipart boundary
  // We override the default JSON content-type by setting it to undefined for this request
  upload: async (url, formData, onProgress) => {
    const response = await api.post(url, formData, {
      headers: { "Content-Type": undefined }, // allow axios/browser to set boundary
      onUploadProgress: onProgress,
    });
    return response.data;
  },
};

export default api;
