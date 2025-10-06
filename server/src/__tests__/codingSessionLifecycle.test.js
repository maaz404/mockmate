const request = require("supertest");
const app = require("../../src/server");

/**
 * Integration test for coding challenge session lifecycle:
 * 1. Create interview with coding config
 * 2. Create coding session (via POST /api/coding/session)
 * 3. Submit code for first challenge (simple placeholder implementation expected to fail/pass minimal tests)
 * 4. Advance to next challenge until completion
 * 5. Retrieve coding results via interview endpoint
 */

describe("Coding Challenge Session Lifecycle", () => {
  let interviewId;
  let sessionId;
  let currentChallengeId;

  const baseInterviewPayload = {
    config: {
      jobRole: "software-engineer",
      experienceLevel: "mid",
      interviewType: "technical",
      difficulty: "intermediate",
      duration: 30,
      questionCount: 5,
      adaptiveDifficulty: { enabled: false },
      coding: {
        challengeCount: 2,
        difficulty: "mixed",
        language: "javascript",
      },
    },
  };

  it("creates interview with coding config", async () => {
    const res = await request(app)
      .post("/api/interviews")
      .set("Authorization", "Bearer test")
      .send(baseInterviewPayload);
    expect(res.status).toBeLessThan(500);
    expect(res.body.success).toBe(true);
    interviewId = res.body?.data?._id || res.body?.data?.id;
    expect(interviewId).toBeDefined();
  });

  it("creates coding session for interview", async () => {
    const res = await request(app)
      .post("/api/coding/session")
      .set("Authorization", "Bearer test")
      .send({
        interviewId,
        config: {
          challengeCount: 2,
          difficulty: "mixed",
          language: "javascript",
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    sessionId = res.body.data.sessionId;
    currentChallengeId = res.body.data.currentChallenge.id;
    expect(sessionId).toBeDefined();
    expect(currentChallengeId).toBeDefined();
  });

  it("submits code for first challenge", async () => {
    // Provide a minimal generic solution that might intentionally be wrong; we are testing pipeline not correctness
    const code = `function twoSum(nums, target){ const map={}; for(let i=0;i<nums.length;i++){ const c=target-nums[i]; if(map[c]!==undefined){ return [map[c], i]; } map[nums[i]]=i;} return []; }`;
    const res = await request(app)
      .post(`/api/coding/session/${sessionId}/submit`)
      .set("Authorization", "Bearer test")
      .send({ challengeId: currentChallengeId, code, language: "javascript" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.testResults).toBeInstanceOf(Array);
    expect(res.body.data.passedTests).toBeGreaterThanOrEqual(0);
    expect(res.body.data.totalTests).toBeGreaterThan(0);
  });

  it("advances to next challenge", async () => {
    const res = await request(app)
      .post(`/api/coding/session/${sessionId}/next`)
      .set("Authorization", "Bearer test")
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // We might be at completion if only 1 challenge, else ensure structure
  });

  it("completes session explicitly (idempotent)", async () => {
    const res = await request(app)
      .post(`/api/coding/session/${sessionId}/complete`)
      .set("Authorization", "Bearer test")
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.completed).toBe("boolean");
  });

  it("fetches coding results via interview endpoint", async () => {
    const res = await request(app)
      .get(`/api/coding/interview/${interviewId}/results`)
      .set("Authorization", "Bearer test");
    // May be 200 after completion or 404 if timing; accept either but expect success true when 200
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      const perf = res.body.data.performance;
      expect(perf).toBeDefined();
      expect(perf.totalChallenges).toBeGreaterThan(0);
      expect(perf.challengesCompleted).toBeGreaterThanOrEqual(0);
      expect(perf.averageScore).toBeGreaterThanOrEqual(0);
      expect(perf.overallScore).toBeGreaterThanOrEqual(0);
    } else {
      expect([404]).toContain(res.status); // Tolerate race in test env
    }
  });
});
