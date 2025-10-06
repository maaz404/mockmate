const request = require("supertest");
const app = require("../server");
const UserProfile = require("../models/UserProfile");
const Interview = require("../models/Interview");

// Utility to create a premium user profile
async function ensureUser(userId = "test-user-adaptive") {
  await UserProfile.deleteMany({ clerkUserId: userId });
  return UserProfile.create({
    clerkUserId: userId,
    email: `${userId}@dev.local`,
    subscription: { plan: "premium", interviewsRemaining: null },
    onboardingCompleted: true,
  });
}

describe("Adaptive difficulty PATCH + metrics export CSV", () => {
  const userId = "test-user-adaptive";
  let interviewId;

  beforeAll(async () => {
    await ensureUser(userId);
    // Create interview with adaptive enabled
    const CREATED = 201; // eslint-disable-line no-magic-numbers
    const createRes = await request(app)
      .post("/api/interviews")
      .set("Authorization", "Bearer test")
      .set("x-user-id", userId)
      .send({
        config: {
          jobRole: "frontend engineer",
          experienceLevel: "mid",
          interviewType: "technical",
          difficulty: "intermediate",
          adaptiveDifficulty: { enabled: true },
          questionCount: 5,
        },
        // Provide explicit questions to bypass generation & external AI calls
        questions: [
          {
            text: "Q1 explain event loop",
            category: "technical",
            difficulty: "intermediate",
          },
          {
            text: "Q2 optimize React render",
            category: "technical",
            difficulty: "intermediate",
          },
          {
            text: "Q3 CSS layout issue",
            category: "technical",
            difficulty: "intermediate",
          },
          {
            text: "Q4 handle API errors",
            category: "technical",
            difficulty: "intermediate",
          },
          {
            text: "Q5 state management tradeoffs",
            category: "technical",
            difficulty: "intermediate",
          },
        ],
      })
      .expect(CREATED);
    interviewId = createRes.body.data._id;

    // Start interview
    await request(app)
      .put(`/api/interviews/${interviewId}/start`)
      .set("Authorization", "Bearer test")
      .set("x-user-id", userId)
      .expect(200);

    // Submit an answer with facial metrics
    await request(app)
      .post(`/api/interviews/${interviewId}/answer/0`)
      .set("Authorization", "Bearer test")
      .set("x-user-id", userId)
      .send({
        answer: "Sample answer",
        timeSpent: 42,
        facialMetrics: { eyeContact: 0.8 },
      })
      .expect(200);
  });

  afterAll(async () => {
    await Interview.deleteMany({ userId });
    await UserProfile.deleteMany({ clerkUserId: userId });
    // Do not close mongoose connection here to avoid interfering with subsequent test suites
  });

  it("allows explicit adaptive difficulty update", async () => {
    const res = await request(app)
      .patch(`/api/interviews/${interviewId}/adaptive-difficulty`)
      .set("Authorization", "Bearer test")
      .set("x-user-id", userId)
      .send({ difficulty: "advanced" })
      .expect(200);
    expect(res.body).toHaveProperty("data.currentDifficulty", "advanced");
  });

  it("exports metrics CSV including header row", async () => {
    const res = await request(app)
      .get(`/api/interviews/${interviewId}/metrics/export`)
      .set("Authorization", "Bearer test")
      .set("x-user-id", userId)
      .expect(200);
    expect(res.text.split("\n")[0]).toContain(
      "questionIndex,category,difficulty,score"
    );
  });

  it("exports metrics PDF", async () => {
    const res = await request(app)
      .get(`/api/interviews/${interviewId}/metrics/export?format=pdf`)
      .set("Authorization", "Bearer test")
      .set("x-user-id", userId)
      .expect(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
  });
});
