/* eslint-disable no-magic-numbers */
const mongoose = require("mongoose");
const UserProfile = require("../models/UserProfile");
const { consumeFreeInterview } = require("../utils/subscription");

process.env.MOCK_AUTH_FALLBACK = "true";

describe("Subscription utility", () => {
  const userId = "quota-user-1";

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((res) => setTimeout(res, 300));
    }
    await UserProfile.deleteMany({ clerkUserId: userId });
    await UserProfile.create({
      clerkUserId: userId,
      email: "quota@example.com",
      subscription: { plan: "free", interviewsRemaining: 2 },
    });
  });

  afterAll(async () => {
    await UserProfile.deleteMany({ clerkUserId: userId });
  });

  test("Consumes only once per interview", async () => {
    const first = await consumeFreeInterview(userId, "int-1");
    const second = await consumeFreeInterview(userId, "int-1");
    expect(first.updated).toBe(true);
    expect(second.updated).toBe(false);
  });

  test("Stops at zero", async () => {
    await consumeFreeInterview(userId, "int-2"); // second unique
    const after = await UserProfile.findOne({ clerkUserId: userId });
    expect(after.subscription.interviewsRemaining).toBe(0);
    const extra = await consumeFreeInterview(userId, "int-3");
    expect(extra.updated).toBe(false);
  });
});
