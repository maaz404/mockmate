import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api",
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
        // Try to get a backend-ready JWT via multiple strategies
        let token = null;
        const templateFromEnv = process.env.REACT_APP_CLERK_JWT_TEMPLATE;
        const tryGet = async (args) => {
          try {
            return await getTokenFunction(args);
          } catch (_) {
            return null;
          }
        };

        // 1) Env-configured template (recommended)
        if (!token && templateFromEnv) {
          token = await tryGet({ template: templateFromEnv });
        }
        // 2) Common template name 'backend'
        if (!token) {
          token = await tryGet({ template: "backend" });
        }
        // 3) Alternate common template name 'server'
        if (!token) {
          token = await tryGet({ template: "server" });
        }
        // 4) Default token as last resort
        if (!token) {
          token = await tryGet();
        }
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // Authentication token retrieval failed
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// API service object with common methods
export const apiService = {
  get: async (url) => {
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  post: async (url, data) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  put: async (url, data) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // File upload method
  upload: async (url, formData) => {
    try {
      const response = await api.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
