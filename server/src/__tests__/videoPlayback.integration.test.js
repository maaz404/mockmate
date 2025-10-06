const request = require("supertest");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
// Interview model path corrected (tests are under src/__tests__)
const UserProfile = require("../models/UserProfile");

let app;
const HTTP_OK = 200; // eslint-disable-line no-magic-numbers
const HTTP_CREATED = 201; // eslint-disable-line no-magic-numbers
let mongo;

// Utility to create a tiny dummy webm file (not a valid video but enough for route path)
function createDummyWebm() {
  const filePath = path.join(__dirname, "dummy.webm");
  fs.writeFileSync(filePath, "webm");
  return filePath;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MOCK_AUTH_FALLBACK = "true";
  process.env.OPENAI_API_KEY = ""; // disable openai
  // Defer requiring server until env prepared
  app = require("../server");
  await mongoose.connection.asPromise();
  // Seed a user profile (required by interview create)
  await UserProfile.create({
    clerkUserId: "test-user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    subscription: { plan: "free", interviewsRemaining: 5 },
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe("Video upload → playback", () => {
  let interviewId;
  it("creates an interview", async () => {
    const res = await request(app).post("/api/interviews").send({
      jobRole: "Engineer",
      experienceLevel: "mid",
      interviewType: "technical",
      difficulty: "intermediate",
      duration: 30,
      questionCount: 5,
    });
    expect(res.status).toBe(HTTP_CREATED);
    interviewId = res.body.data._id;
  });

  it("starts the interview", async () => {
    const res = await request(app).post(`/api/interviews/${interviewId}/start`);
    expect(res.status).toBe(HTTP_OK);
  });

  it("starts recording session", async () => {
    const res = await request(app).post(`/api/video/start/${interviewId}`);
    expect(res.status).toBe(HTTP_OK);
  });

  it("uploads a dummy video", async () => {
    const filePath = createDummyWebm();
    const res = await request(app)
      .post(`/api/video/upload/${interviewId}/0`)
      .attach("video", filePath);
    expect([HTTP_OK, HTTP_CREATED]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it("fetches playback info", async () => {
    const res = await request(app).get(`/api/video/playback/${interviewId}/0`);
    expect(res.status).toBe(HTTP_OK);
    expect(res.body.data.videoUrl).toBeTruthy();
  });
});
