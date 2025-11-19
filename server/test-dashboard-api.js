const axios = require("axios");

// You need to get your actual JWT token from browser localStorage
// Open browser console and run: localStorage.getItem('token')
const TOKEN = "YOUR_JWT_TOKEN_HERE";

async function testDashboardAPI() {
  try {
    console.log("🔍 Testing Dashboard Summary API...\n");

    const response = await axios.get(
      "http://localhost:5000/api/users/dashboard/summary",
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );

    console.log("✅ Response Status:", response.status);
    console.log("\n📊 Stats from API:");
    console.log("Total Interviews:", response.data.data.stats.totalInterviews);
    console.log(
      "Completed Interviews:",
      response.data.data.stats.completedInterviews
    );
    console.log("Average Score:", response.data.data.stats.averageScore);
    console.log("\n🔍 Full stats object:");
    console.log(JSON.stringify(response.data.data.stats, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testDashboardAPI();
