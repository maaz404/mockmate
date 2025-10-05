const request = require("supertest");
const app = require("../../src/server");

// Ensures MOCK_AUTH_FALLBACK is active via jest.setup.js

describe("Question Category Generation API", () => {
  const baseConfig = {
    config: {
      jobRole: "software-engineer",
      experienceLevel: "intermediate",
      interviewType: "mixed",
      difficulty: "intermediate",
      questionCount: 6,
    },
  };

  const categories = ["behavioral", "technical", "system-design"];

  categories.forEach((cat) => {
    it(`generates ${cat} category questions`, async () => {
      const res = await request(app)
        .post(`/api/questions/generate/${cat}`)
        .set("Authorization", "Bearer test")
        .send(baseConfig);
      expect(res.status).toBeLessThan(500);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.questions)).toBe(true);
      // Ensure at least 1 question returned (service pads if under-produced)
      expect(res.body.data.questions.length).toBeGreaterThan(0);
      // Source breakdown metadata present
      expect(res.body.data.metadata).toBeDefined();
      expect(res.body.data.metadata.category).toBe(cat);
    });
  });

  it("rejects missing config payload", async () => {
    const res = await request(app)
      .post("/api/questions/generate/behavioral")
      .set("Authorization", "Bearer test")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code || res.body.error).toBeDefined();
  });
});
