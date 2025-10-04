const request = require("supertest");
const app = require("../../src/server");

// In test environment we rely on MOCK_AUTH_FALLBACK path (ensure env vars accordingly when running jest)

describe("Interview Lifecycle (integration)", () => {
  let interviewId;
  // Basic payload used for creation (whatever controller expects minimal fields)
  const basePayload = {
    config: {
      jobRole: "software-engineer",
      experienceLevel: "mid",
      interviewType: "mixed",
      difficulty: "intermediate",
      duration: 30,
      questionCount: 5,
      adaptiveDifficulty: { enabled: false },
    },
  };

  it("creates an interview", async () => {
    const res = await request(app)
      .post("/api/interviews")
      .set("Authorization", "Bearer test")
      .send(basePayload);
    expect(res.status).toBeLessThan(500);
    if (!res.body.success) {
      // Helpful debug
      // eslint-disable-next-line no-console
      console.error("Create interview failure payload", res.body);
    }
    expect(res.body.success).toBe(true);
    interviewId =
      res.body?.data?._id ||
      res.body?.data?.id ||
      res.body?.data?.interview?._id;
    expect(interviewId).toBeDefined();
  });

  it("starts interview (generates questions)", async () => {
    const res = await request(app)
      .put(`/api/interviews/${interviewId}/start`)
      .set("Authorization", "Bearer test")
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("submits first answer", async () => {
    const res = await request(app)
      .post(`/api/interviews/${interviewId}/answer/0`)
      .set("Authorization", "Bearer test")
      .send({ answer: "Example structured answer", durationSeconds: 42 });
    const HTTP_OK = 200; // descriptive to avoid magic number lint
    const HTTP_CREATED = 201;
    expect([HTTP_OK, HTTP_CREATED]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it("generates a follow-up for question 0", async () => {
    const res = await request(app)
      .post(`/api/interviews/${interviewId}/followup/0`)
      .set("Authorization", "Bearer test")
      .send({ previousAnswer: "Example structured answer" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("marks follow-ups reviewed", async () => {
    const res = await request(app)
      .post(`/api/interviews/${interviewId}/followups-reviewed/0`)
      .set("Authorization", "Bearer test")
      .send({ reviewed: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("completes interview", async () => {
    const res = await request(app)
      .post(`/api/interviews/${interviewId}/complete`)
      .set("Authorization", "Bearer test")
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("fetches interview results", async () => {
    const res = await request(app)
      .get(`/api/interviews/${interviewId}/results`)
      .set("Authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
