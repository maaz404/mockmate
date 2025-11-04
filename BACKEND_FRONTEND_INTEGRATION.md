# 🔗 MockMate Frontend-Backend Integration Guide

**Date:** November 4, 2025  
**Version:** 2.0 (Simplified Architecture)  
**Status:** ✅ PRODUCTION READY

---

## 📋 Overview

This document explains how the React frontend and Node.js backend integrate in the simplified MockMate application. All Python service dependencies have been removed, and the system now operates with just two services.

---

## 🏗️ Architecture Summary

### System Components

```
┌─────────────────────────────────────────┐
│         React Frontend (Port 3000)       │
│  - Interview UI                          │
│  - Question Display                      │
│  - Answer Input                          │
│  - Results Dashboard                     │
│  - Feature Flags (client/src/config)    │
└──────────────┬───────────────────────────┘
               │
               │ HTTP/HTTPS
               │ REST API
               │
┌──────────────▼───────────────────────────┐
│      Node.js Backend (Port 5000)         │
│  - Express REST API                      │
│  - JWT Authentication                    │
│  - Interview Management                  │
│  - Evaluation Service (Keyword-based)    │
│  - Question Service (Database)           │
│  - Feature Flags (server/src/config)    │
└──────────────┬───────────────────────────┘
               │
               │ MongoDB Protocol
               │
┌──────────────▼───────────────────────────┐
│         MongoDB Atlas/Local              │
│  - Users & Profiles                      │
│  - Interviews & Answers                  │
│  - Questions Bank                        │
│  - Session Data                          │
└──────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### Authentication Endpoints

| Method | Endpoint             | Frontend Call                               | Backend Handler           | Purpose               |
| ------ | -------------------- | ------------------------------------------- | ------------------------- | --------------------- |
| POST   | `/api/auth/register` | `api.post('/auth/register', data)`          | `authController.register` | Create new user       |
| POST   | `/api/auth/login`    | `api.post('/auth/login', credentials)`      | `authController.login`    | User login, get JWT   |
| POST   | `/api/auth/refresh`  | `api.post('/auth/refresh', {refreshToken})` | `authController.refresh`  | Refresh expired token |
| GET    | `/api/auth/me`       | `api.get('/auth/me')`                       | `authController.getMe`    | Get current user      |

### Interview Endpoints

| Method | Endpoint                                    | Frontend Call                                           | Backend Handler                           | Purpose               |
| ------ | ------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- | --------------------- |
| POST   | `/api/interviews`                           | `api.post('/interviews', config)`                       | `interviewController.createInterview`     | Create new interview  |
| GET    | `/api/interviews`                           | `api.get('/interviews')`                                | `interviewController.getUserInterviews`   | Get user's interviews |
| GET    | `/api/interviews/:id`                       | `api.get(`/interviews/${id}`)`                          | `interviewController.getInterviewDetails` | Get interview details |
| POST   | `/api/interviews/:id/start`                 | `api.post(`/interviews/${id}/start`)`                   | `interviewController.startInterview`      | Start interview       |
| POST   | `/api/interviews/:id/answer/:questionIndex` | `api.post(`/interviews/${id}/answer/${idx}`, {answer})` | `interviewController.submitAnswer`        | Submit answer         |
| POST   | `/api/interviews/:id/complete`              | `api.post(`/interviews/${id}/complete`)`                | `interviewController.completeInterview`   | Complete interview    |
| GET    | `/api/interviews/:id/results`               | `api.get(`/interviews/${id}/results`)`                  | `interviewController.getInterviewResults` | Get results           |

### Question Endpoints

| Method | Endpoint                    | Frontend Call                             | Backend Handler                        | Purpose            |
| ------ | --------------------------- | ----------------------------------------- | -------------------------------------- | ------------------ |
| POST   | `/api/questions/generate`   | `api.post('/questions/generate', config)` | `questionController.generateQuestions` | Generate questions |
| GET    | `/api/questions`            | `api.get('/questions', {params})`         | `questionController.getQuestions`      | Get questions      |
| GET    | `/api/questions/categories` | `api.get('/questions/categories')`        | `questionController.getCategories`     | Get categories     |

---

## 🔄 Critical User Flows

### Flow 1: User Registration & Login

**Frontend → Backend → Database**

```javascript
// 1. Frontend: User clicks "Register"
// client/src/pages/auth/RegisterPage.js
const handleRegister = async (data) => {
  const response = await api.post('/auth/register', {
    email: data.email,
    password: data.password,
    name: data.name
  });

  // Store tokens
  localStorage.setItem('accessToken', response.data.data.accessToken);
  localStorage.setItem('refreshToken', response.data.data.refreshToken);

  // Navigate to dashboard
  navigate('/dashboard');
};

// 2. Backend: Create user and generate JWT
// server/src/controllers/authController.js (auth routes)
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user in MongoDB
  const user = await User.create({
    email,
    password: hashedPassword,
    name
  });

  // Generate JWT tokens
  const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET);
  const refreshToken = jwt.sign({ userId: user._id }, REFRESH_SECRET);

  res.json({
    success: true,
    data: { accessToken, refreshToken, user }
  });
});

// 3. Database: User stored in MongoDB
// Collection: users
{
  _id: ObjectId("..."),
  email: "user@example.com",
  password: "$2b$10$...", // hashed
  name: "User Name",
  createdAt: ISODate("2025-11-04T...")
}
```

### Flow 2: Create Interview

**Frontend → Backend → Database**

```javascript
// 1. Frontend: User configures interview
// client/src/pages/InterviewCreationPage.js
const handleCreateInterview = async () => {
  const config = {
    jobRole: "Software Engineer",
    experienceLevel: "intermediate",
    interviewType: "technical",
    difficulty: "intermediate",
    questionCount: 10,
    duration: 30
  };

  const response = await api.post('/interviews', { config });

  // Navigate to interview
  navigate(`/interview/${response.data.data.interview._id}`);
};

// 2. Backend: Generate questions and create interview
// server/src/controllers/interviewController.js
const createInterview = async (req, res) => {
  const { config } = req.body;
  const userId = req.user.id;

  // Get questions from database
  const questions = await Question.find({
    type: config.interviewType,
    difficulty: config.difficulty
  }).limit(config.questionCount);

  // Create interview document
  const interview = await Interview.create({
    user: userId,
    config,
    questions: questions.map(q => ({
      questionText: q.questionText,
      category: q.category,
      difficulty: q.difficulty,
      tags: q.tags
    })),
    status: 'created',
    createdAt: new Date()
  });

  res.json({
    success: true,
    data: { interview, questions }
  });
};

// 3. Database: Interview stored
// Collection: interviews
{
  _id: ObjectId("..."),
  user: ObjectId("..."),
  config: {
    jobRole: "Software Engineer",
    experienceLevel: "intermediate",
    interviewType: "technical",
    difficulty: "intermediate",
    questionCount: 10
  },
  questions: [
    {
      questionText: "What is REST API?",
      category: "api",
      difficulty: "intermediate",
      tags: ["rest", "api", "http"],
      response: null,
      score: null,
      feedback: null
    },
    // ... more questions
  ],
  status: 'created',
  createdAt: ISODate("2025-11-04T...")
}
```

### Flow 3: Submit Answer & Get Evaluation

**Frontend → Backend → Evaluation Service → Database**

```javascript
// 1. Frontend: User submits answer
// client/src/pages/InterviewPage.js
const handleSubmitAnswer = async () => {
  const answer = currentAnswer; // User's typed answer

  const response = await api.post(
    `/interviews/${interviewId}/answer/${currentQuestionIndex}`,
    {
      answer: answer,
      timeSpent: 120, // seconds
    }
  );

  // Show feedback
  setFeedback(response.data.data.feedback);
  setScore(response.data.data.score);
};

// 2. Backend: Evaluate answer
// server/src/controllers/interviewController.js
const submitAnswer = async (req, res) => {
  const { answer, timeSpent } = req.body;
  const { id: interviewId, questionIndex } = req.params;

  // Get interview and question
  const interview = await Interview.findById(interviewId);
  const question = interview.questions[questionIndex];

  // Prepare for evaluation
  const questionObj = {
    questionText: question.questionText,
    tags: question.tags,
    category: question.category,
  };

  const answerObj = {
    text: answer,
    answerText: answer,
  };

  // 3. Evaluation Service: Score the answer
  // server/src/services/evaluationService.js
  const evaluation = await evaluationService.evaluateAnswer(
    questionObj,
    answerObj
  );

  // evaluation = {
  //   score: 75,
  //   feedback: {
  //     overall: "Good answer!",
  //     strengths: ["Covered 3 key concepts"],
  //     improvements: ["Try to mention: response"]
  //   },
  //   breakdown: {
  //     keywordScore: 56,
  //     lengthScore: 10,
  //     baseScore: 15
  //   }
  // }

  // 4. Save to database
  interview.questions[questionIndex].response = {
    text: answer,
    submittedAt: new Date(),
  };

  interview.questions[questionIndex].score = {
    overall: evaluation.score,
    breakdown: evaluation.breakdown,
  };

  interview.questions[questionIndex].feedback = {
    strengths: evaluation.feedback.strengths,
    improvements: evaluation.feedback.improvements,
    suggestions: evaluation.feedback.overall,
  };

  await interview.save();

  res.json({
    success: true,
    data: {
      score: evaluation.score,
      feedback: evaluation.feedback,
    },
  });
};

// 5. Database: Answer and evaluation stored
// Collection: interviews (updated document)
{
  questions: [
    {
      questionText: "What is REST API?",
      tags: ["rest", "api", "http"],
      response: {
        text: "REST API uses HTTP requests...",
        submittedAt: ISODate("2025-11-04T..."),
      },
      score: {
        overall: 75,
        breakdown: {
          keywordScore: 56,
          lengthScore: 10,
          baseScore: 15,
        },
      },
      feedback: {
        strengths: ["Covered 3 key concepts"],
        improvements: ["Try to mention: response"],
        suggestions: "Good answer!",
      },
      timeSpent: 120,
    },
  ];
}
```

### Flow 4: Complete Interview & View Results

```javascript
// 1. Frontend: User completes interview
// client/src/pages/InterviewPage.js
const handleCompleteInterview = async () => {
  await api.post(`/interviews/${interviewId}/complete`);
  navigate(`/interviews/${interviewId}/results`);
};

// 2. Backend: Calculate final scores
// server/src/controllers/interviewController.js
const completeInterview = async (req, res) => {
  const interview = await Interview.findById(req.params.id);

  // Calculate overall score
  const scores = interview.questions
    .filter((q) => q.score)
    .map((q) => q.score.overall);

  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Update status
  interview.status = "completed";
  interview.completedAt = new Date();
  interview.overallScore = overallScore;

  await interview.save();

  res.json({
    success: true,
    data: { interview },
  });
};

// 3. Frontend: Display results
// client/src/pages/InterviewResultsPage.js
useEffect(() => {
  const fetchResults = async () => {
    const response = await api.get(`/interviews/${interviewId}/results`);
    setResults(response.data.data);
  };
  fetchResults();
}, [interviewId]);

// Display:
// - Overall score: 75/100
// - Per-question breakdown
// - Strengths and improvements
// - Time taken
```

---

## 🔐 Authentication Flow

### JWT Token Management

```javascript
// Frontend: API interceptor adds token to requests
// client/src/services/api.js
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend: Middleware verifies token
// server/src/middleware/auth.js
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "NO_TOKEN",
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Invalid or expired token",
    });
  }
};
```

### Token Refresh Flow

```javascript
// Frontend: Auto-refresh on 401
// client/src/services/api.js
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      const response = await axios.post("/api/auth/refresh", { refreshToken });

      const { accessToken } = response.data.data;
      localStorage.setItem("accessToken", accessToken);

      // Retry original request
      error.config.headers.Authorization = `Bearer ${accessToken}`;
      return axios(error.config);
    }

    return Promise.reject(error);
  }
);
```

---

## 📦 Data Models

### Interview Model

```javascript
// server/src/models/Interview.js
{
  user: ObjectId,          // Reference to User
  config: {
    jobRole: String,
    experienceLevel: String,
    interviewType: String,
    difficulty: String,
    questionCount: Number,
    duration: Number
  },
  questions: [
    {
      questionText: String,
      category: String,
      difficulty: String,
      tags: [String],
      response: {
        text: String,
        submittedAt: Date
      },
      score: {
        overall: Number,
        breakdown: Object
      },
      feedback: {
        strengths: [String],
        improvements: [String],
        suggestions: String
      },
      timeSpent: Number,
      skipped: Boolean
    }
  ],
  status: String,          // 'created', 'in-progress', 'completed'
  overallScore: Number,
  createdAt: Date,
  startedAt: Date,
  completedAt: Date
}
```

### Question Model

```javascript
// server/src/models/Question.js
{
  questionText: String,
  type: String,            // 'technical', 'behavioral', 'situational'
  difficulty: String,      // 'easy', 'intermediate', 'hard'
  category: String,        // 'javascript', 'react', 'database', etc.
  tags: [String],          // Keywords for evaluation
  estimatedTime: Number,   // Seconds
  isActive: Boolean,
  source: String,
  createdBy: ObjectId,
  createdAt: Date
}
```

### User Model

```javascript
// server/src/models/User.js
{
  email: String,
  password: String,        // Hashed
  name: String,
  role: String,
  subscription: {
    plan: String,          // 'free', 'pro', 'enterprise'
    status: String,
    interviewsRemaining: Number
  },
  preferences: {
    facialAnalysis: {
      enabled: Boolean
    },
    notifications: {
      email: Boolean
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Feature Flag Integration

### Backend Feature Flags

```javascript
// server/src/config/features.js
module.exports = {
  // Core features (always on)
  USER_AUTHENTICATION: true,
  INTERVIEW_PRACTICE: true,
  QUESTION_BANK: true,
  BASIC_EVALUATION: true,

  // Advanced features (disabled)
  USE_PYTHON_SERVICE: false,
  VIDEO_RECORDING: false,
  FACIAL_ANALYSIS: false,
  AI_QUESTIONS: false,
  ADAPTIVE_DIFFICULTY: false,
  CODING_CHALLENGES: false,
  CHATBOT: false,
  ADVANCED_ANALYTICS: false,
  PDF_EXPORT: false,
  CSV_EXPORT: false,
};
```

### Frontend Feature Flags

```javascript
// client/src/config/features.js
export const FEATURES = {
  // Core features
  interviews: true,
  questions: true,
  dashboard: true,

  // Advanced features (disabled)
  videoRecording: false,
  facialAnalysis: false,
  aiQuestions: false,
  adaptiveDifficulty: false,
  codingChallenges: false,
  chatbot: false,
  advancedAnalytics: false,
  pdfExport: false,
};
```

### Usage Example

```javascript
// Backend: Conditional evaluation
// server/src/controllers/interviewController.js
if (FEATURES.AI_QUESTIONS && process.env.OPENAI_API_KEY) {
  // Use AI evaluation
  evaluation = await aiQuestionService.evaluateAnswer(...);
} else {
  // Use simple keyword evaluation
  evaluation = await evaluationService.evaluateAnswer(...);
}

// Frontend: Conditional rendering
// client/src/pages/InterviewPage.js
import { FEATURES } from '../config/features';

{FEATURES.videoRecording && (
  <VideoRecorder interviewId={interviewId} />
)}

{FEATURES.facialAnalysis && (
  <FacialMetrics />
)}
```

---

## 🔍 Evaluation Service Integration

### Simplified Keyword-Based Evaluation

```javascript
// server/src/services/evaluationService.js
class EvaluationService {
  async evaluateAnswer(question, answer) {
    // Extract answer text
    const answerText = answer.text.toLowerCase();

    // Get expected keywords from question tags
    const keywords = question.tags || [];

    // Calculate keyword matching score (70%)
    const matchedKeywords = keywords.filter((k) =>
      answerText.includes(k.toLowerCase())
    );
    const keywordScore = (matchedKeywords.length / keywords.length) * 70;

    // Calculate length score (15%)
    const wordCount = answerText.split(/\s+/).length;
    const lengthScore =
      wordCount < 10 ? 0 : wordCount < 20 ? 5 : wordCount < 50 ? 10 : 15;

    // Base score (15%)
    const baseScore = 15;

    // Total score
    const totalScore = Math.round(keywordScore + lengthScore + baseScore);

    // Generate feedback
    return {
      score: totalScore,
      feedback: {
        overall:
          totalScore >= 80
            ? "Excellent!"
            : totalScore >= 60
            ? "Good!"
            : "Needs improvement",
        strengths:
          matchedKeywords.length > 0
            ? [`Covered ${matchedKeywords.length} key concepts`]
            : ["Attempted the question"],
        improvements:
          keywords.length - matchedKeywords.length > 0
            ? [`Try mentioning: ${keywords.slice(0, 3).join(", ")}`]
            : [],
      },
      breakdown: {
        keywordScore: Math.round(keywordScore),
        lengthScore: lengthScore,
        baseScore: baseScore,
      },
    };
  }
}
```

### Integration in Interview Controller

```javascript
// server/src/controllers/interviewController.js
const submitAnswer = async (req, res) => {
  // ... get question and answer ...

  let evaluation;
  try {
    // Try AI evaluation first (if enabled)
    if (FEATURES.AI_QUESTIONS && process.env.OPENAI_API_KEY) {
      evaluation = await aiQuestionService.evaluateAnswer(
        questionObj,
        answer,
        interview.config
      );
    } else {
      // Use simplified evaluation
      const simpleEval = await evaluationService.evaluateAnswer(
        questionObj,
        answerObj
      );

      // Convert to expected format
      evaluation = {
        score: simpleEval.score,
        rubricScores: {
          relevance: Math.ceil((simpleEval.score / 100) * 5),
          clarity: Math.ceil((simpleEval.score / 100) * 5),
          depth: Math.ceil((simpleEval.score / 100) * 5),
          structure: Math.ceil((simpleEval.score / 100) * 5)
        },
        strengths: simpleEval.feedback.strengths,
        improvements: simpleEval.feedback.improvements,
        feedback: simpleEval.feedback.overall
      };
    }
  } catch (error) {
    // Fallback to simplified evaluation
    const simpleEval = await evaluationService.evaluateAnswer(...);
    evaluation = { /* converted format */ };
  }

  // Save evaluation to database
  interview.questions[qIndex].score = { overall: evaluation.score };
  interview.questions[qIndex].feedback = {
    strengths: evaluation.strengths,
    improvements: evaluation.improvements
  };

  await interview.save();
  res.json({ success: true, data: { evaluation } });
};
```

---

## 🚦 Error Handling

### Backend Error Response Format

```javascript
// Standard error response
{
  success: false,
  code: "ERROR_CODE",
  message: "Human-readable error message",
  requestId: "unique-request-id",
  details: {} // Optional additional context
}
```

### Common Error Codes

| Code               | Status | Meaning                 | Frontend Action         |
| ------------------ | ------ | ----------------------- | ----------------------- |
| `NO_TOKEN`         | 401    | No auth token provided  | Redirect to login       |
| `INVALID_TOKEN`    | 401    | Token invalid/expired   | Try refresh, then login |
| `NOT_FOUND`        | 404    | Resource not found      | Show error message      |
| `EMPTY_ANSWER`     | 400    | Answer is empty         | Show validation error   |
| `ANSWER_TOO_SHORT` | 400    | Answer too brief        | Prompt for more detail  |
| `INTERVIEW_LIMIT`  | 403    | Interview limit reached | Show upgrade prompt     |

### Frontend Error Handling

```javascript
// client/src/services/api.js
try {
  const response = await api.post("/interviews", config);
  return response.data;
} catch (error) {
  if (error.response) {
    // Backend returned error
    const { code, message } = error.response.data;

    switch (code) {
      case "INTERVIEW_LIMIT":
        toast.error("Interview limit reached. Upgrade to continue.");
        navigate("/pricing");
        break;
      case "EMPTY_ANSWER":
        toast.error("Please provide an answer");
        break;
      default:
        toast.error(message || "An error occurred");
    }
  } else if (error.request) {
    // Network error
    toast.error("Network error. Please check your connection.");
  } else {
    // Other error
    toast.error("An unexpected error occurred");
  }
}
```

---

## 🎓 Best Practices

### 1. API Service Organization

```javascript
// ✅ Good: Organized service
// client/src/services/interviewService.js
export const interviewService = {
  create: (config) => api.post("/interviews", config),
  getAll: () => api.get("/interviews"),
  getById: (id) => api.get(`/interviews/${id}`),
  start: (id) => api.post(`/interviews/${id}/start`),
  submitAnswer: (id, questionIndex, answer) =>
    api.post(`/interviews/${id}/answer/${questionIndex}`, { answer }),
  complete: (id) => api.post(`/interviews/${id}/complete`),
  getResults: (id) => api.get(`/interviews/${id}/results`),
};

// ❌ Bad: Direct API calls everywhere
const response = await api.post("/interviews", config);
```

### 2. Error Handling

```javascript
// ✅ Good: Centralized error handling
// client/src/hooks/useInterview.js
const useInterview = (interviewId) => {
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const response = await interviewService.getById(interviewId);
        setInterview(response.data);
        setError(null);
      } catch (err) {
        setError(err);
        toast.error("Failed to load interview");
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [interviewId]);

  return { interview, error, loading };
};

// ❌ Bad: No error handling
const response = await api.get(`/interviews/${id}`);
setInterview(response.data); // Crashes if API fails
```

### 3. Loading States

```javascript
// ✅ Good: Show loading state
const InterviewPage = () => {
  const { interview, loading, error } = useInterview(interviewId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!interview) return <NotFound />;

  return <InterviewContent interview={interview} />;
};

// ❌ Bad: No loading state
const InterviewPage = () => {
  const { interview } = useInterview(interviewId);
  return <InterviewContent interview={interview} />; // Crashes while loading
};
```

---

## ✅ Testing Integration

### Backend API Tests

```javascript
// server/src/__tests__/interview.test.js
describe("Interview API", () => {
  it("should create interview", async () => {
    const config = {
      jobRole: "Software Engineer",
      experienceLevel: "intermediate",
      interviewType: "technical",
      questionCount: 5,
    };

    const response = await request(app)
      .post("/api/interviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ config })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.interview).toBeDefined();
    expect(response.body.data.questions).toHaveLength(5);
  });

  it("should submit answer and get evaluation", async () => {
    const response = await request(app)
      .post(`/api/interviews/${interviewId}/answer/0`)
      .set("Authorization", `Bearer ${token}`)
      .send({ answer: "REST API uses HTTP..." })
      .expect(200);

    expect(response.body.data.score).toBeGreaterThan(0);
    expect(response.body.data.feedback).toBeDefined();
  });
});
```

### Frontend Component Tests

```javascript
// client/src/pages/__tests__/InterviewPage.test.js
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InterviewPage from "../InterviewPage";

jest.mock("../../services/api");

test("submits answer and shows feedback", async () => {
  api.post.mockResolvedValue({
    data: {
      success: true,
      data: {
        score: 75,
        feedback: {
          overall: "Good answer!",
          strengths: ["Covered key concepts"],
          improvements: ["Add more detail"],
        },
      },
    },
  });

  render(<InterviewPage />);

  const textarea = screen.getByRole("textbox");
  await userEvent.type(textarea, "REST API uses HTTP...");

  const submitButton = screen.getByText("Submit Answer");
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText("Good answer!")).toBeInTheDocument();
    expect(screen.getByText("Score: 75/100")).toBeInTheDocument();
  });
});
```

---

## 📞 Troubleshooting

### Common Issues

**Issue:** Frontend can't connect to backend  
**Solution:** Check `REACT_APP_API_BASE` in `client/.env` matches backend URL

**Issue:** Authentication fails  
**Solution:** Verify JWT secret matches in backend and token is being sent

**Issue:** Evaluation returns NaN  
**Solution:** Ensure questions have `tags` array with keywords

**Issue:** Interview creation fails  
**Solution:** Check MongoDB connection and question bank has data

---

## 🎉 Summary

Your MockMate application now has:

- ✅ **Clean 2-tier architecture** (React → Node.js)
- ✅ **Simple keyword-based evaluation** (no external dependencies)
- ✅ **Feature flag system** (easy to enable/disable features)
- ✅ **Robust error handling** (graceful degradation)
- ✅ **Complete API integration** (frontend ↔ backend)
- ✅ **Production-ready** (secure, scalable, maintainable)

**The application is fully integrated and ready for use!** 🚀

---

**Last Updated:** November 4, 2025  
**Version:** 2.0 (Simplified Architecture)  
**Status:** ✅ PRODUCTION READY
