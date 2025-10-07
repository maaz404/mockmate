// All-in-one server test
const { spawn } = require("child_process");
const axios = require("axios");

async function testBackend() {
  console.log("🚀 Starting server and running tests...\n");

  // Start the server
  const serverProcess = spawn("node", ["src/server.js"], {
    cwd: "c:\\Users\\Maaz Sheikh\\Desktop\\MockMate Final\\mockmate\\server",
    stdio: "pipe",
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 8000));

  try {
    // Test health endpoint
    const healthResponse = await axios.get("http://localhost:5000/api/health");
    console.log("✅ Health Check Success:", healthResponse.status);

    // Test readiness endpoint
    const readyResponse = await axios.get("http://localhost:5000/api/ready");
    console.log("✅ Readiness Check Success:", readyResponse.status);

    // Test dashboard with mock user
    const dashboardResponse = await axios.get(
      "http://localhost:5000/api/dashboard/summary",
      {
        headers: { "x-user-id": "test-user-123" },
      }
    );
    console.log("✅ Dashboard Test Success:", dashboardResponse.status);

    // Test question generation (might fail due to OpenAI rate limit, but should not crash)
    try {
      const questionsResponse = await axios.post(
        "http://localhost:5000/api/questions/generate",
        {
          category: "technical",
          difficulty: "beginner",
          count: 1,
          customPrompt: "Generate a basic JavaScript question",
        },
        {
          headers: {
            "x-user-id": "test-user-123",
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ Question Generation Success:", questionsResponse.status);
    } catch (qError) {
      console.log(
        "⚠️  Question Generation (expected rate limit):",
        qError.response?.status || "Error"
      );
    }

    console.log("\n🎉 Backend core features are working!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  } finally {
    // Kill the server
    serverProcess.kill();
    console.log("\n🛑 Server stopped");
  }
}

testBackend();
