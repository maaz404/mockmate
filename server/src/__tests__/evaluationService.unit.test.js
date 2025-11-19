const evaluationService = require("../services/evaluationService");

jest.mock("../services/aiProviders", () => ({
  evaluateAnswer: jest.fn(async (question, answer) => {
    return {
      score: 85,
      rubricScores: { relevance: 4, clarity: 4, depth: 4, structure: 4 },
      strengths: ["Clear structure", "Covered core concepts"],
      improvements: ["Add more detail on edge-cases"],
      feedback: "Good answer with room for more depth",
      modelAnswer: "Suggested model answer snippet",
    };
  }),
}));

describe("EvaluationService (AI-backed)", () => {
  it("should normalize AI provider evaluation response", async () => {
    const question = {
      questionText: "Explain event loop",
      tags: ["node", "js"],
    };
    const answer = { text: "The event loop handles async callbacks." };

    const res = await evaluationService.evaluateAnswerWithAI(question, answer, {
      jobRole: "dev",
    });

    expect(res).toBeDefined();
    expect(typeof res.score).toBe("number");
    expect(res.rubricScores).toBeDefined();
    expect(Array.isArray(res.strengths)).toBe(true);
    expect(Array.isArray(res.improvements)).toBe(true);
    expect(res.feedback).toBeTruthy();
    expect(res.evaluation_method).toBe("ai-provider");
  });
});
