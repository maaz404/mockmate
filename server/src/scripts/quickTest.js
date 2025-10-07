// Quick Backend Health Test
const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function quickHealthTest() {
  console.log("🔍 Quick Backend Health Check...\n");

  try {
    // Test basic health endpoint
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log("✅ Health Check:", healthResponse.data);

    // Test readiness endpoint
    const readyResponse = await axios.get(`${BASE_URL}/api/ready`);
    console.log("✅ Readiness Check:", readyResponse.data);

    // Test a simple API endpoint
    const dashboardResponse = await axios.get(
      `${BASE_URL}/api/dashboard/summary`,
      {
        headers: { "x-user-id": "test-user-123" },
      }
    );
    console.log("✅ Dashboard Summary:", dashboardResponse.data);

    console.log("\n🎉 Backend is healthy and responding!");
  } catch (error) {
    console.error("❌ Backend test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
quickHealthTest();
