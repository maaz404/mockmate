// Axios interceptor to propagate server-provided requestId to subsequent requests
// and include a client-generated id when absent.
import axios from "axios";
import { v4 as uuid } from "uuid";

let lastRequestId = null;

export function getLastRequestId() {
  return lastRequestId;
}

export function installRequestIdInterceptor(instance = axios) {
  // Request: attach previous requestId (helps correlate sequences) and a fresh one
  instance.interceptors.request.use((config) => {
    const newId = uuid();
    config.headers["X-Request-Id"] = newId;
    if (lastRequestId) {
      config.headers["X-Parent-Request-Id"] = lastRequestId;
    }
    return config;
  });
  // Response: capture server id if present
  instance.interceptors.response.use(
    (response) => {
      const serverId = response.headers["x-request-id"];
      if (serverId) lastRequestId = serverId;
      return response;
    },
    (error) => {
      const serverId = error?.response?.headers?.["x-request-id"];
      if (serverId) lastRequestId = serverId;
      return Promise.reject(error);
    }
  );
}

// Auto-install on import for global axios
installRequestIdInterceptor();
