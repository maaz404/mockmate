/* eslint-disable no-magic-numbers */
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../server");
const Interview = require("../models/Interview");
const UserProfile = require("../models/UserProfile");

process.env.MOCK_AUTH_FALLBACK = "true";

async function ensureProfile(userId = "test-user-123") {
  let doc = await UserProfile.findOne({ userId: userId });
  if (!doc) {
    doc = await UserProfile.create({
      userId: userId,
      email: `${userId}@example.com`,
    });
  }
  return doc;
}

describe("Dashboard Metrics Tag Coverage & Horizon", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((res) => setTimeout(res, 500));
    }
    await ensureProfile();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("tag coverage aggregates real question tags and horizon filter reduces data", async () => {
    await Interview.deleteMany({ userId: "test-user-123" });
    const now = Date.now();
    // Two interviews spaced weeks apart with different tags
    const profile = await UserProfile.findOne({ userId: "test-user-123" });
    await Interview.insertMany([
      {
        userId: "test-user-123",
        status: "completed",
        createdAt: new Date(now - 2 * 7 * 24 * 60 * 60 * 1000), // 2 weeks ago
        results: { overallScore: 75 },
        userProfile: profile._id,
        config: {
          jobRole: "Engineer",
          experienceLevel: "mid",
          interviewType: "technical",
          difficulty: "intermediate",
          duration: 30,
          questionCount: 5,
        },
        questions: [
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "System design scalability",
            category: "system-design",
            tags: ["scalability", "caching"],
            followUpsReviewed: true,
            difficulty: "intermediate",
            timeAllocated: 300,
          },
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "Algorithms tagging",
            category: "algorithms",
            tags: ["graph", "optimization"],
            difficulty: "beginner",
            timeAllocated: 200,
          },
        ],
      },
      {
        userId: "test-user-123",
        status: "completed",
        createdAt: new Date(now - 10 * 7 * 24 * 60 * 60 * 1000), // 10 weeks ago (may be out of short horizon)
        results: { overallScore: 65 },
        userProfile: profile._id,
        config: {
          jobRole: "Engineer",
          experienceLevel: "mid",
          interviewType: "technical",
          difficulty: "intermediate",
          duration: 30,
          questionCount: 5,
        },
        questions: [
          {
            questionId: new mongoose.Types.ObjectId(),
            questionText: "Comm teamwork",
            category: "communication",
            tags: ["communication", "teamwork"],
            difficulty: "intermediate",
            timeAllocated: 180,
          },
        ],
      },
    ]);

    // Short horizon (3 weeks) should only include first interview
    const shortRes = await request(app).get(
      "/api/users/dashboard/metrics?horizon=3"
    );
    expect(shortRes.status).toBe(200);
    const shortTags = shortRes.body.data.tagCoverage.top.map((t) => t.tag);
    expect(shortTags).toEqual(
      expect.arrayContaining([
        "scalability",
        "caching",
        "graph",
        "optimization",
      ])
    );
    expect(shortTags).not.toContain("teamwork");

    // Longer horizon should include both sets
    const longRes = await request(app).get(
      "/api/users/dashboard/metrics?horizon=12"
    );
    expect(longRes.status).toBe(200);
    const longTags = longRes.body.data.tagCoverage.top.map((t) => t.tag);
    expect(longTags).toEqual(
      expect.arrayContaining(["teamwork", "communication"])
    );
  });

  test("CSV export returns text/csv and includes benchmark headers", async () => {
    const res = await request(app).get(
      "/api/users/dashboard/metrics?format=csv&horizon=4"
    );
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toMatch(/weekly_interviews/);
    expect(res.text).toMatch(/tag_count/);
  });
});
