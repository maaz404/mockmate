const request = require("supertest");
const app = require("../server");
const UserProfile = require("../models/UserProfile");
const mongoose = require("mongoose");

// Simple test ensuring /api/bootstrap returns subscription in both locations

describe("GET /api/bootstrap subscription shape", () => {
  const userId = "test-user-bootstrap";

  beforeAll(async () => {
    // Ensure a profile exists
    await UserProfile.deleteMany({ clerkUserId: userId });
    await UserProfile.create({
      clerkUserId: userId,
      email: `${userId}@dev.local`,
      subscription: { plan: "premium", interviewsRemaining: null },
      onboardingCompleted: true,
    });
  });

  afterAll(async () => {
    await UserProfile.deleteMany({ clerkUserId: userId });
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
  });

  it("returns subscription at root and inside analytics", async () => {
    const res = await request(app)
      .get("/api/bootstrap")
      .set("Authorization", "Bearer test") // Clerk middleware may be bypassed in test env
      .set("x-user-id", userId) // In mock mode, we may need custom header (depending on auth logic)
      .expect(200);

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
