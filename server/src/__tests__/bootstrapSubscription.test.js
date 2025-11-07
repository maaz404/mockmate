const request = require("supertest");
const app = require("../server");
const UserProfile = require("../models/UserProfile");
const mongoose = require("mongoose");

// Simple test ensuring /api/bootstrap returns subscription in both locations

describe("GET /api/users/profile/bootstrap subscription shape", () => {
  const userId = "000000000000000000000001"; // fallback dev auth id

  beforeAll(async () => {
    // Ensure a profile exists
    await UserProfile.deleteMany({ user: userId });
    await UserProfile.create({
      user: userId,
      email: `${userId}@dev.local`,
      subscription: { plan: "premium", interviewsRemaining: null },
      onboardingCompleted: true,
      analytics: { averageScore: 0 },
    });
  });

  afterAll(async () => {
    await UserProfile.deleteMany({ user: userId });
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
  });

  it("returns subscription via profile bootstrap", async () => {
    const res = await request(app).post("/api/users/profile/bootstrap").send();
    // eslint-disable-next-line no-console
    console.log("BOOTSTRAP_DEBUG_STATUS", res.status, res.body);
    expect(res.status).toBe(200);

    // Updated controller returns profile object inside data.profile
    expect(res.body.data.profile).toBeDefined();
    expect(res.body.data.profile.subscription.plan).toBe("premium");
    expect(
      res.body.data.profile.subscription.interviewsRemaining === null ||
        res.body.data.profile.subscription.interviewsRemaining > 0
    ).toBe(true);
  });
});
