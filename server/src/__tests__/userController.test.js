// Unit tests for onboarding validation logic
// const { clerkClient } = require("@clerk/clerk-sdk-node"); // REMOVED: Migrating to Google OAuth

// Mock Clerk SDK (DEPRECATED - keeping for now to avoid test breakage)
jest.mock("@clerk/clerk-sdk-node", () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

// Mock UserProfile model
const mockUserProfile = {
  findOneAndUpdate: jest.fn(),
  prototype: {
    calculateCompleteness: jest.fn(),
    save: jest.fn(),
  },
};

jest.mock("../models/UserProfile", () => mockUserProfile);

const { completeOnboarding } = require("../controllers/userController");

describe("Complete Onboarding Validation", () => {
  let req, res;

  beforeEach(() => {
    req = {
      auth: { userId: "test-user-123" },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();

    // Default successful Clerk response
    clerkClient.users.getUser.mockResolvedValue({
      id: "test-user-123",
      emailAddresses: [{ emailAddress: "test@example.com" }],
      firstName: "John",
      lastName: "Doe",
      profileImageUrl: "https://example.com/avatar.jpg",
    });

    // Default successful database response
    const mockProfileData = {
      calculateCompleteness: jest.fn(),
      save: jest.fn().mockResolvedValue(),
    };
    mockUserProfile.findOneAndUpdate.mockResolvedValue(mockProfileData);
  });

  test("should reject request with missing professionalInfo", async () => {
    req.body = {
      preferences: {
        interviewTypes: ["technical"],
        difficulty: "beginner",
      },
    };

    await completeOnboarding(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "MISSING_PROFESSIONAL_INFO",
      message: "Missing required onboarding data",
      meta: {
        professionalInfo: "Professional information is required",
        preferences: null,
      },
    });
  });

  test("should reject request with missing preferences", async () => {
    req.body = {
      professionalInfo: {
        currentRole: "Developer",
        industry: "Tech",
      },
    };

    await completeOnboarding(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "MISSING_PREFERENCES",
      message: "Missing required onboarding data",
      meta: {
        professionalInfo: null,
        preferences: "Preferences are required",
      },
    });
  });

  test("should reject request with missing currentRole", async () => {
    req.body = {
      professionalInfo: {
        industry: "Technology",
      },
      preferences: {
        interviewTypes: ["technical"],
        difficulty: "beginner",
      },
    };

    await completeOnboarding(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "MISSING_PROFESSIONAL_FIELDS",
      message: "Missing required professional information",
      meta: {
        currentRole: "Current role is required",
        industry: null,
      },
    });
  });

  test("should reject request with empty interview types", async () => {
    req.body = {
      professionalInfo: {
        currentRole: "Developer",
        industry: "Technology",
      },
      preferences: {
        interviewTypes: [],
        difficulty: "beginner",
      },
    };

    await completeOnboarding(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "NO_INTERVIEW_TYPE",
      message: "At least one interview type must be selected",
    });
  });

  test("should handle Clerk API errors", async () => {
    req.body = {
      professionalInfo: {
        currentRole: "Developer",
        industry: "Technology",
      },
      preferences: {
        interviewTypes: ["technical"],
        difficulty: "beginner",
      },
    };

    clerkClient.users.getUser.mockRejectedValue(new Error("Clerk API error"));

    await completeOnboarding(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "MISSING_DATA",
      message: "Failed to fetch user data from authentication service",
    });
  });

  test("should succeed with valid data", async () => {
    req.body = {
      professionalInfo: {
        currentRole: "Software Engineer",
        industry: "Technology",
        experience: "entry",
        skills: ["JavaScript"],
      },
      preferences: {
        interviewTypes: ["technical", "behavioral"],
        difficulty: "beginner",
        sessionDuration: 30,
      },
    };

    await completeOnboarding(req, res);

    expect(clerkClient.users.getUser).toHaveBeenCalledWith("test-user-123");
    expect(mockUserProfile.findOneAndUpdate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Onboarding completed successfully",
      data: expect.any(Object),
    });
  });
});
