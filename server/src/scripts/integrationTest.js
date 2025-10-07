#!/usr/bin/env node

/**
 * Comprehensive Backend Feature Test & Integration Checker
 * Tests all major backend features and their frontend integration
 */

const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const API_BASE = "http://localhost:5000/api";
const TEST_USER_ID = "test-integration-user";

// Test results collector
const results = {
  passed: 0,
  failed: 0,
  tests: [],
  issues: [],
  recommendations: [],
};

function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix =
    {
      info: "📘",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      test: "🧪",
    }[type] || "📘";

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function recordTest(name, passed, details = "", recommendation = "") {
  results.tests.push({
    name,
    passed,
    details,
    timestamp: new Date().toISOString(),
  });

  if (passed) {
    results.passed++;
    log(`✅ ${name}`, "success");
  } else {
    results.failed++;
    log(`❌ ${name}: ${details}`, "error");
    if (recommendation) {
      results.recommendations.push(`${name}: ${recommendation}`);
    }
  }
}

function recordIssue(component, issue, impact, fix) {
  results.issues.push({
    component,
    issue,
    impact,
    fix,
    timestamp: new Date().toISOString(),
  });
  log(`🚨 ISSUE in ${component}: ${issue}`, "error");
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": TEST_USER_ID, // For mock auth
        ...headers,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
}

async function testHealthEndpoints() {
  log("Testing Health & System Endpoints...", "test");

  // Basic health check
  const health = await makeRequest("GET", "/health");
  recordTest(
    "Basic Health Check",
    health.success && health.data?.status === "OK",
    health.success
      ? "Server responding"
      : `Health check failed: ${health.error}`,
    "Ensure server is running and database is connected"
  );

  // System readiness
  const readiness = await makeRequest("GET", "/system/readiness");
  recordTest(
    "System Readiness",
    readiness.success && readiness.data?.success,
    readiness.success
      ? `Services: ${JSON.stringify(readiness.data.services)}`
      : `Readiness failed: ${readiness.error}`,
    "Check Cloudinary and OpenAI configurations"
  );

  // Bootstrap endpoint
  const bootstrap = await makeRequest("GET", "/bootstrap");
  recordTest(
    "Bootstrap Endpoint",
    bootstrap.success && bootstrap.data?.auth,
    bootstrap.success
      ? "Bootstrap data loaded"
      : `Bootstrap failed: ${bootstrap.error}`,
    "Verify auth and profile initialization"
  );
}

async function testUserProfile() {
  log("Testing User Profile Features...", "test");

  // Get/Create profile
  const profile = await makeRequest("POST", "/users/profile");
  recordTest(
    "User Profile Creation",
    profile.success,
    profile.success
      ? "Profile created/retrieved"
      : `Profile error: ${profile.error}`,
    "Check user profile schema and middleware"
  );

  // Update profile
  const profileUpdate = await makeRequest("PUT", "/users/profile", {
    firstName: "Integration",
    lastName: "Test",
    professionalInfo: {
      jobTitle: "Software Engineer",
      company: "Test Corp",
      industry: "Technology",
    },
  });
  recordTest(
    "Profile Update",
    profileUpdate.success,
    profileUpdate.success
      ? "Profile updated successfully"
      : `Update failed: ${profileUpdate.error}`,
    "Verify profile update validation and persistence"
  );

  // Get analytics
  const analytics = await makeRequest("GET", "/users/analytics");
  recordTest(
    "User Analytics",
    analytics.success,
    analytics.success
      ? "Analytics retrieved"
      : `Analytics failed: ${analytics.error}`,
    "Check analytics calculation and aggregation"
  );
}

async function testDashboardFeatures() {
  log("Testing Dashboard Features...", "test");

  // Dashboard summary
  const summary = await makeRequest("GET", "/users/dashboard/summary");
  recordTest(
    "Dashboard Summary",
    summary.success,
    summary.success
      ? "Summary data loaded"
      : `Summary failed: ${summary.error}`,
    "Check dashboard aggregation logic"
  );

  // Dashboard preferences (this was failing before)
  const preferences = await makeRequest("GET", "/users/dashboard/preferences");
  recordTest(
    "Dashboard Preferences",
    preferences.success,
    preferences.success
      ? "Preferences loaded"
      : `Preferences failed: ${preferences.error}`,
    "Ensure preferences schema is properly initialized"
  );

  // Update preferences
  const prefUpdate = await makeRequest("PUT", "/users/dashboard/preferences", {
    density: "compact",
    upcomingView: "week",
    thisWeekOnly: true,
  });
  recordTest(
    "Preferences Update",
    prefUpdate.success,
    prefUpdate.success
      ? "Preferences updated"
      : `Update failed: ${prefUpdate.error}`,
    "Verify preferences validation and persistence"
  );

  // Dashboard metrics
  const metrics = await makeRequest("GET", "/users/dashboard/metrics");
  recordTest(
    "Dashboard Metrics",
    metrics.success,
    metrics.success ? "Metrics calculated" : `Metrics failed: ${metrics.error}`,
    "Check metrics calculation algorithms"
  );

  // Dashboard recommendations
  const recommendations = await makeRequest(
    "GET",
    "/users/dashboard/recommendation"
  );
  recordTest(
    "Dashboard Recommendations",
    recommendations.success,
    recommendations.success
      ? "Recommendations generated"
      : `Recommendations failed: ${recommendations.error}`,
    "Verify recommendation engine logic"
  );
}

async function testInterviewFeatures() {
  log("Testing Interview System...", "test");

  // Create interview
  const interview = await makeRequest("POST", "/interviews", {
    config: {
      jobRole: "Software Engineer",
      industry: "Technology",
      experienceLevel: "mid",
      interviewType: "mixed",
      difficulty: "intermediate",
      duration: 30,
      questionCount: 5,
    },
  });
  recordTest(
    "Interview Creation",
    interview.success,
    interview.success
      ? `Interview created: ${interview.data?.data?._id}`
      : `Creation failed: ${interview.error}`,
    "Check question generation and interview initialization"
  );

  if (interview.success && interview.data?.data?._id) {
    const interviewId = interview.data.data._id;

    // Start interview
    const start = await makeRequest("PUT", `/interviews/${interviewId}/start`);
    recordTest(
      "Interview Start",
      start.success,
      start.success ? "Interview started" : `Start failed: ${start.error}`,
      "Verify interview state management"
    );

    // Get interview details
    const details = await makeRequest("GET", `/interviews/${interviewId}`);
    recordTest(
      "Interview Details",
      details.success,
      details.success
        ? "Details retrieved"
        : `Details failed: ${details.error}`,
      "Check interview data retrieval"
    );

    // Get user interviews list
    const userInterviews = await makeRequest("GET", "/interviews");
    recordTest(
      "User Interviews List",
      userInterviews.success,
      userInterviews.success
        ? `Found ${userInterviews.data?.data?.length || 0} interviews`
        : `List failed: ${userInterviews.error}`,
      "Verify interview listing and filtering"
    );

    // Complete interview (simulate)
    const complete = await makeRequest(
      "POST",
      `/interviews/${interviewId}/complete`
    );
    recordTest(
      "Interview Completion",
      complete.success,
      complete.success
        ? "Interview completed"
        : `Completion failed: ${complete.error}`,
      "Check completion flow and results calculation"
    );

    // Get results
    const results = await makeRequest(
      "GET",
      `/interviews/${interviewId}/results`
    );
    recordTest(
      "Interview Results",
      results.success,
      results.success
        ? "Results retrieved"
        : `Results failed: ${results.error}`,
      "Verify results generation and scoring"
    );
  }
}

async function testQuestionSystem() {
  log("Testing Question System...", "test");

  // Get questions by category
  const questions = await makeRequest(
    "GET",
    "/questions?category=javascript&difficulty=intermediate"
  );
  recordTest(
    "Question Retrieval",
    questions.success,
    questions.success
      ? `Found ${questions.data?.data?.length || 0} questions`
      : `Retrieval failed: ${questions.error}`,
    "Verify question filtering and categorization"
  );

  // Test question generation (will likely hit OpenAI rate limit)
  const generation = await makeRequest("POST", "/questions/generate", {
    jobRole: "Software Engineer",
    difficulty: "intermediate",
    count: 3,
  });
  recordTest(
    "Question Generation",
    generation.success || generation.status === 429, // Rate limit is acceptable
    generation.success
      ? "Questions generated"
      : generation.status === 429
      ? "Rate limited (expected)"
      : `Generation failed: ${generation.error}`,
    "Configure OpenAI API or ensure fallback questions work"
  );
}

async function testScheduledSessions() {
  log("Testing Scheduled Sessions...", "test");

  // Get scheduled sessions
  const sessions = await makeRequest("GET", "/users/scheduled-sessions");
  recordTest(
    "Scheduled Sessions List",
    sessions.success,
    sessions.success
      ? `Found ${sessions.data?.data?.length || 0} sessions`
      : `List failed: ${sessions.error}`,
    "Check session management and persistence"
  );

  // Create scheduled session
  const newSession = await makeRequest("POST", "/users/scheduled-sessions", {
    title: "Integration Test Session",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    config: {
      jobRole: "Software Engineer",
      duration: 30,
      difficulty: "intermediate",
    },
  });
  recordTest(
    "Session Creation",
    newSession.success,
    newSession.success
      ? "Session scheduled"
      : `Creation failed: ${newSession.error}`,
    "Verify session validation and calendar integration"
  );
}

async function testChatbotFeatures() {
  log("Testing Chatbot Features...", "test");

  // Test chatbot ping
  const ping = await makeRequest("GET", "/chatbot/ping");
  recordTest(
    "Chatbot Ping",
    ping.success,
    ping.success ? "Chatbot responding" : `Ping failed: ${ping.error}`,
    "Check chatbot service availability"
  );

  // Note: Streaming test would require WebSocket/SSE testing
  // For now, we'll just verify the endpoint exists
}

async function testFileUploads() {
  log("Testing File Upload Features...", "test");

  // Test upload health (without actual file)
  const uploadHealth = await makeRequest("GET", "/uploads/health");
  recordTest(
    "Upload Service Health",
    uploadHealth.success,
    uploadHealth.success
      ? "Upload service ready"
      : `Upload health failed: ${uploadHealth.error}`,
    "Check file upload service and Cloudinary integration"
  );
}

async function generateReport() {
  log("Generating Comprehensive Report...", "test");

  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      totalTests: results.tests.length,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / results.tests.length) * 100).toFixed(1),
    },
    tests: results.tests,
    issues: results.issues,
    recommendations: results.recommendations,
    integration: {
      status:
        results.failed === 0
          ? "FULLY_INTEGRATED"
          : results.failed < 3
          ? "MOSTLY_INTEGRATED"
          : "NEEDS_ATTENTION",
      criticalIssues: results.issues.filter((i) => i.impact === "HIGH"),
      minorIssues: results.issues.filter((i) => i.impact === "LOW"),
    },
  };

  // Save report
  const reportPath = path.join(
    __dirname,
    "../../../integration-test-report.json"
  );
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 BACKEND INTEGRATION TEST REPORT");
  console.log("=".repeat(80));
  console.log(`🧪 Tests Run: ${report.summary.totalTests}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`📈 Success Rate: ${report.summary.successRate}%`);
  console.log(`🔗 Integration Status: ${report.integration.status}`);

  if (results.recommendations.length > 0) {
    console.log("\n🔧 RECOMMENDATIONS:");
    results.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  console.log(`\n📋 Full report saved to: ${reportPath}`);
  console.log("=".repeat(80));

  return report;
}

async function runIntegrationTests() {
  log("🚀 Starting Comprehensive Backend Integration Tests...", "test");

  try {
    await testHealthEndpoints();
    await testUserProfile();
    await testDashboardFeatures();
    await testInterviewFeatures();
    await testQuestionSystem();
    await testScheduledSessions();
    await testChatbotFeatures();
    await testFileUploads();

    const report = await generateReport();

    if (report.integration.status === "FULLY_INTEGRATED") {
      log(
        "🎉 All backend features are fully integrated and working!",
        "success"
      );
      process.exit(0);
    } else {
      log(
        `⚠️ Integration needs attention: ${results.failed} issues found`,
        "warning"
      );
      process.exit(1);
    }
  } catch (error) {
    log(`💥 Integration test failed: ${error.message}`, "error");
    process.exit(1);
  }
}

// Run the tests
runIntegrationTests().catch(console.error);
