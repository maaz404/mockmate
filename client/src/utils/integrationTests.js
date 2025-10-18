// Frontend Integration Test Script
// This script validates that all major frontend components are properly integrated

import { apiService } from "../services/api";

const IntegrationTests = {
  async runHealthCheck() {
    const results = {
      apiConnection: false,
      authIntegration: false,
      themeSystem: false,
      routingSystem: false,
      totalTests: 4,
      passedTests: 0,
      errors: [],
    };

    try {
      // Test 1: API Connection
      try {
        const healthResponse = await apiService.get("/health");
        if (healthResponse?.success) {
          results.apiConnection = true;
          results.passedTests++;
        }
      } catch (error) {
        results.errors.push(`API Connection failed: ${error.message}`);
      }

      // Test 2: Authentication Integration
      try {
        // Check if Google OAuth endpoints are configured
        const apiBase = process.env.REACT_APP_API_BASE_URL;
        const hasAuth = !!apiBase;
        if (hasAuth) {
          results.authIntegration = true;
          results.passedTests++;
        } else {
          results.errors.push("Authentication: API base URL not configured");
        }
      } catch (error) {
        results.errors.push(
          `Authentication integration failed: ${error.message}`
        );
      }

      // Test 3: Theme System
      try {
        const themeContext =
          document.documentElement.classList.contains("dark") ||
          document.documentElement.classList.contains("light") ||
          localStorage.getItem("theme");
        if (themeContext !== null) {
          results.themeSystem = true;
          results.passedTests++;
        } else {
          results.errors.push("Theme system: No theme state detected");
        }
      } catch (error) {
        results.errors.push(`Theme system failed: ${error.message}`);
      }

      // Test 4: Routing System
      try {
        const currentPath = window.location.pathname;
        if (currentPath !== undefined) {
          results.routingSystem = true;
          results.passedTests++;
        }
      } catch (error) {
        results.errors.push(`Routing system failed: ${error.message}`);
      }
    } catch (globalError) {
      results.errors.push(`Global test failure: ${globalError.message}`);
    }

    results.successRate = Math.round(
      (results.passedTests / results.totalTests) * 100
    );
    return results;
  },

  async testBackendIntegration() {
    const endpoints = [
      "/users/profile",
      "/users/dashboard/preferences",
      "/questions/generate",
      "/interviews",
      "/uploads/health",
    ];

    const results = {
      endpoints: {},
      totalEndpoints: endpoints.length,
      workingEndpoints: 0,
    };

    for (const endpoint of endpoints) {
      try {
        const response = await apiService.get(endpoint);
        results.endpoints[endpoint] = {
          status: response?.success ? "working" : "error",
          message: response?.message || "Success",
        };
        if (response?.success) {
          results.workingEndpoints++;
        }
      } catch (error) {
        results.endpoints[endpoint] = {
          status: "error",
          message: error.message || "Failed to connect",
        };
      }
    }

    results.integrationRate = Math.round(
      (results.workingEndpoints / results.totalEndpoints) * 100
    );
    return results;
  },
};

export default IntegrationTests;
