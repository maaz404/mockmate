/* eslint-disable no-magic-numbers */
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const UserProfile = require("../models/UserProfile");

process.env.MOCK_AUTH_FALLBACK = "true";

// Helper to ensure a profile exists for test user
async function ensureProfile(userId = "000000000000000000000001") {
  let doc = await UserProfile.findOne({ user: userId });
  if (!doc) {
    doc = await UserProfile.create({
      user: userId,
      email: `${userId}@example.com`,
      onboardingCompleted: true,
      subscription: { plan: "free", interviewsRemaining: 5 },
    });
  }
  return doc;
}

describe("API Integration Smoke", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      // Force connection (server.js calls connectDB already, but guard here)
      // eslint-disable-next-line global-require
      await new Promise((res) => setTimeout(res, 500));
    }
    await ensureProfile();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("Health endpoint", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  test("Get profile (auto ensured)", async () => {
    const res = await request(app).get("/api/users/profile");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
  });

  test("Create interview + start + answer first question", async () => {
    const createRes = await request(app).post("/api/interviews").send({
      jobRole: "backend-developer",
      experienceLevel: "mid",
      interviewType: "technical",
      difficulty: "intermediate",
      questionCount: 3,
    });
    // If wrapper expects config object
    let interviewId = createRes.body?.data?._id;
    if (!interviewId && createRes.body?.data?.config) {
      interviewId = createRes.body.data._id;
    }
    expect(createRes.status).toBeLessThan(500);
    expect(createRes.body.success).toBe(true);

    const startRes = await request(app).put(
      `/api/interviews/${interviewId}/start`
    );
    expect(startRes.status).toBe(200);
    expect(startRes.body.success).toBe(true);

    const answerRes = await request(app)
      .post(`/api/interviews/${interviewId}/answer/0`)
      .send({
        answer: "This is a test answer about system design components",
        timeSpent: 30,
      });
    expect(answerRes.status).toBe(200);
    expect(answerRes.body.success).toBe(true);
  });
});
