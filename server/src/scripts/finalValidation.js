// Final Backend Validation Test
const { spawn } = require("child_process");
const axios = require("axios");

async function validateBackend() {
  console.log("🎯 MockMate Backend Validation Test\n");

  // Start the server
  const serverProcess = spawn("node", ["src/server.js"], {
    cwd: "c:\\Users\\Maaz Sheikh\\Desktop\\MockMate Final\\mockmate\\server",
    stdio: "pipe",
  });

  // Wait for server to fully start
  await new Promise((resolve) => setTimeout(resolve, 10000));

  let testsPassed = 0;
  let testsTotal = 0;

  async function runTest(name, testFn) {
    testsTotal++;
    try {
      await testFn();
      console.log(`✅ ${name}: PASSED`);
      testsPassed++;
    } catch (error) {
      console.log(`❌ ${name}: FAILED - ${error.message}`);
      if (error.response?.data) {
        console.log(`   Details: ${JSON.stringify(error.response.data)}`);
      }
    }
  }

  try {
    console.log("🔍 Testing Core Health Endpoints...");

    await runTest("Health Check", async () => {
      const response = await axios.get("http://localhost:5000/api/health");
      if (response.status !== 200)
        throw new Error(`Expected 200, got ${response.status}`);
    });

    await runTest("Database Test", async () => {
      const response = await axios.get(
        "http://localhost:5000/api/health/db-test"
      );
      if (response.status !== 200)
        throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.success) throw new Error("Database not connected");
    });

    console.log("\n🔍 Testing User & Dashboard Features...");

    await runTest("Dashboard Summary", async () => {
      const response = await axios.get(
        "http://localhost:5000/api/users/dashboard/summary",
        {
          headers: { "x-user-id": "test-user-123" },
        }
      );
      if (response.status !== 200)
        throw new Error(`Expected 200, got ${response.status}`);
    });

    await runTest("Dashboard Preferences", async () => {
      const response = await axios.get(
        "http://localhost:5000/api/users/dashboard/preferences",
        {
          headers: { "x-user-id": "test-user-123" },
        }
      );
      if (response.status !== 200)
        throw new Error(`Expected 200, got ${response.status}`);
    });

    await runTest("User Profile Bootstrap", async () => {
      // Bootstrap user profile
      const response = await axios.post(
        "http://localhost:5000/api/users/bootstrap",
        {},
        {
          headers: { "x-user-id": "test-user-123" },
        }
      );
      if (![200, 201].includes(response.status))
        throw new Error(`Expected 200/201, got ${response.status}`);

      // Patch user profile to ensure onboardingCompleted and required fields
      await axios.put(
        "http://localhost:5000/api/users/profile",
        {
          onboardingCompleted: true,
          professionalInfo: {
            currentRole: "Software Engineer",
            experience: "entry",
            industry: "Software",
            skills: [{ name: "JavaScript" }],
          },
          preferences: {
            interviewTypes: ["technical", "behavioral"],
            difficulty: "beginner",
            sessionDuration: 30,
          },
          subscription: {
            plan: "free",
            interviewsRemaining: 10,
          },
        },
        {
          headers: {
            "x-user-id": "test-user-123",
            "Content-Type": "application/json",
          },
        }
      );
    });

    console.log("\n🔍 Testing Question System...");

    await runTest("Questions Generation", async () => {
      const response = await axios.post(
        "http://localhost:5000/api/questions/generate",
        {
          config: {
            jobRole: "Software Engineer",
            experienceLevel: "beginner",
            interviewType: "practice",
            difficulty: "beginner",
            questionCount: 1,
          },
        },
        {
          headers: {
            "x-user-id": "test-user-123",
            "Content-Type": "application/json",
          },
        }
      );
      if (![200, 201].includes(response.status))
        throw new Error(`Expected 200/201, got ${response.status}`);
    });

    console.log("\n🔍 Testing Interview System...");

    await runTest("Interview Creation", async () => {
      const response = await axios.post(
        "http://localhost:5000/api/interviews",
        {
          config: {
            jobRole: "Software Engineer",
            experienceLevel: "entry",
            interviewType: "technical",
            difficulty: "beginner",
            duration: 30,
            questionCount: 5,
          },
        },
        {
          headers: {
            "x-user-id": "test-user-123",
            "Content-Type": "application/json",
          },
        }
      );
      if (![200, 201].includes(response.status))
        throw new Error(`Expected 200/201, got ${response.status}`);
    });

    console.log("\n🔍 Testing File Upload System...");

    await runTest("Upload Health Check", async () => {
      const response = await axios.get(
        "http://localhost:5000/api/uploads/health"
      );
      if (response.status !== 200)
        throw new Error(`Expected 200, got ${response.status}`);
    });

    console.log("\n🔍 Testing Chatbot System...");

    await runTest("Chatbot Health", async () => {
      const response = await axios.get(
        "http://localhost:5000/api/chatbot/health"
      );
      if (response.status !== 200)
        throw new Error(`Expected 200, got ${response.status}`);
    });

    console.log("\n📊 TEST RESULTS:");
    console.log(`✅ Passed: ${testsPassed}/${testsTotal}`);
    console.log(`❌ Failed: ${testsTotal - testsPassed}/${testsTotal}`);
    console.log(
      `📈 Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`
    );

    if (testsPassed === testsTotal) {
      console.log("\n🎉 ALL TESTS PASSED! Backend is fully functional!");
    } else {
      console.log("\n⚠️  Some tests failed. Check the details above.");
    }
  } catch (error) {
    console.error("💥 Critical test failure:", error.message);
  } finally {
    // Kill the server
    serverProcess.kill();
    console.log("\n🛑 Test server stopped");
  }
}

validateBackend();
