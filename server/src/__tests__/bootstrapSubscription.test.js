const request = require("supertest");
const app = require("../server");
const UserProfile = require("../models/UserProfile");
const mongoose = require("mongoose");

// Simple test ensuring /api/bootstrap returns subscription in both locations

describe("GET /api/bootstrap subscription shape", () => {
  const userId = "test-user-bootstrap";

  beforeAll(async () => {
    // Ensure a profile exists
    await UserProfile.deleteMany({ userId: userId });
    await UserProfile.create({
      userId: userId,
      email: `${userId}@dev.local`,
      subscription: { plan: "premium", interviewsRemaining: null },
      onboardingCompleted: true,
      analytics: { averageScore: 0 },
    });
  });

  afterAll(async () => {
    await UserProfile.deleteMany({ userId: userId });
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
  });

  it("returns subscription at root and inside analytics", async () => {
    const res = await request(app)
      .get("/api/bootstrap")
      .set("Authorization", "Bearer test")
      .set("x-user-id", userId)
      .set("x-test-premium", "true");
    // eslint-disable-next-line no-console
    console.log("BOOTSTRAP_DEBUG_STATUS", res.status, res.body);
    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty("data.subscription");
    expect(res.body.data.subscription).toHaveProperty("plan", "premium");
    // premium unlimited interviews should be null (unlimited marker)
    expect(
      res.body.data.subscription.interviewsRemaining === null ||
        res.body.data.subscription.interviewsRemaining > 0
    ).toBe(true);
    expect(res.body.data.analytics).toHaveProperty("subscription");
    expect(res.body.data.analytics.subscription).toHaveProperty(
      "plan",
      "premium"
    );
  });
});
