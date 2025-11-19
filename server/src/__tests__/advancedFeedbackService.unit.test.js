jest.mock("../services/aiProviders", () => ({
  analyzeSoftSkills: jest.fn(async (responses) => ({
    communication: {
      score: 8,
      evidence: "Spoke clearly",
      improvement: "Structure answers",
    },
    problemSolving: {
      score: 7,
      evidence: "Good breakdown",
      improvement: "Edge cases",
    },
    leadership: {
      score: 6,
      evidence: "Showed initiative",
      improvement: "Delegate",
    },
    teamwork: {
      score: 7,
      evidence: "Collaborative examples",
      improvement: "Conflict handling",
    },
    adaptability: {
      score: 6,
      evidence: "Adapted examples",
      improvement: "Faster learning",
    },
    emotionalIntelligence: {
      score: 7,
      evidence: "Aware of impact",
      improvement: "Empathy examples",
    },
    overallSoftSkillsScore: 6.8,
    topStrengths: ["Communication", "Problem Solving"],
    areasToImprove: ["Leadership", "Adaptability"],
    recommendation: "Focus on leadership scenarios.",
  })),
  generateCoachingTip: jest.fn(async (context) => ({
    recommendation: "Practice STAR responses and time boxing",
    recommendations: [
      "Practice STAR",
      "Time box answers",
      "Review fundamentals",
    ],
  })),
}));

const advancedFeedbackService = require("../services/advancedFeedbackService");

describe("AdvancedFeedbackService", () => {
  it("returns structured advanced feedback when AI providers succeed", async () => {
    const mockInterview = {
      _id: "test-int-1",
      questions: [
        {
          questionText: "Tell me about a time you led a project",
          response: { text: "I led..." },
          feedback: {},
        },
      ],
      results: { overallScore: 78, breakdown: { communication: 78 } },
    };

    const res = await advancedFeedbackService.generateAdvancedFeedback(
      mockInterview
    );

    expect(res).toBeDefined();
    expect(res.overallScore).toBeDefined();
    expect(res.dimensionalScores).toBeDefined();
    expect(Array.isArray(res.strengths)).toBe(true);
    expect(Array.isArray(res.recommendations)).toBe(true);
  });
});
