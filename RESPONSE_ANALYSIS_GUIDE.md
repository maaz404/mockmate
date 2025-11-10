# Response Analysis System Documentation

## Overview

This document explains how MockMate analyzes interview responses and stores facial expression data. Use this as a guide when integrating your facial expression AI model.

---

## 1. Answer Submission Flow

### Endpoint: `POST /api/interviews/:interviewId/answer/:questionIndex`

**Request Body:**

```javascript
{
  answer: "User's text response",
  timeSpent: 120, // seconds
  facialMetrics: {
    eyeContact: 75,          // percentage (0-100)
    blinkRate: 15,           // blinks per minute
    smilePercentage: 60,     // percentage (0-100)
    headSteadiness: 80,      // percentage (0-100)
    offScreenPercentage: 5,  // percentage (0-100)
    confidenceScore: 72      // overall confidence (0-100)
  },
  notes: "Optional interviewer notes",
  code: {
    language: "javascript",
    snippet: "function reverse(str) { return str.split('').reverse().join(''); }"
  }
}
```

**Process:**

1. Validate answer (not empty, min 3 chars)
2. Store response and facial metrics
3. Evaluate answer with AI
4. Generate follow-up questions
5. Update adaptive difficulty (if enabled)
6. Return score and feedback

---

## 2. AI-Powered Answer Evaluation

### Current Implementation

**AI Provider Manager** (`server/src/services/aiProviders/index.js`)

- **Primary**: Gemini 1.5 Flash
- **Fallback**: Groq (Llama 3.1), Grok Beta
- **Features**: evaluation, questions, followup_questions, chatbot

**Evaluation Process:**

```javascript
// 1. Prepare question and answer objects
const questionObj = {
  text: "What is polymorphism?",
  category: "Software Tester",
  type: "technical",
  difficulty: "intermediate",
  tags: ["OOP", "Programming Concepts"]
};

const answerObj = {
  text: "User's answer text..."
};

// 2. Call AI evaluation
const evaluation = await aiProviderManager.evaluateAnswer(
  questionObj,
  answer,
  interviewConfig
);

// 3. Evaluation returns structured result:
{
  score: 78,                    // Overall score (0-100)
  rubricScores: {
    relevance: 4,               // 1-5 scale
    clarity: 4,                 // 1-5 scale
    depth: 3,                   // 1-5 scale
    structure: 4                // 1-5 scale
  },
  strengths: [
    "Clear explanation of concept",
    "Good use of examples"
  ],
  improvements: [
    "Could provide more depth",
    "Missing edge cases"
  ],
  feedback: "Your answer demonstrates solid understanding...",
  modelAnswer: "Polymorphism is the ability of objects..."
}
```

**Rubric Scoring System:**

- **Relevance** (1-5): How well the answer addresses the question
- **Clarity** (1-5): How clear and understandable the explanation is
- **Depth** (1-5): Level of detail and technical accuracy
- **Structure** (1-5): Organization and logical flow

---

## 3. Data Storage Schema

### Per-Question Data (Interview.questions[i])

```javascript
{
  questionId: ObjectId,
  questionText: "Explain polymorphism in OOP",
  category: "coding",           // "coding", "technical", "behavioral", etc.
  difficulty: "intermediate",
  timeAllocated: 300,           // seconds
  timeSpent: 245,               // seconds actually spent

  // User's response
  response: {
    text: "User's answer text...",
    notes: "Optional notes",
    submittedAt: ISODate("2025-11-10T19:10:37.474Z")
  },

  // AI evaluation results
  score: {
    overall: 78,                // 0-100
    rubricScores: {
      relevance: 4,             // 1-5
      clarity: 4,               // 1-5
      depth: 3,                 // 1-5
      structure: 4              // 1-5
    },
    breakdown: {
      relevance: 80,
      clarity: 85,
      completeness: 70,
      technical: 75
    }
  },

  // AI-generated feedback
  feedback: {
    strengths: [
      "Clear explanation",
      "Good examples"
    ],
    improvements: [
      "Add more depth",
      "Discuss inheritance"
    ],
    suggestions: "Great answer! Consider...",
    modelAnswer: "Polymorphism allows..."
  },

  // Facial expression data (per question)
  facial: {
    eyeContact: 75,
    blinkRate: 15,
    smilePercentage: 60,
    headSteadiness: 80,
    offScreenPercentage: 5,
    confidenceScore: 72,
    capturedAt: ISODate("2025-11-10T19:10:37.474Z")
  },

  // Coding questions specific
  code: {
    language: "javascript",
    snippet: "function code...",
    updatedAt: ISODate("2025-11-10T19:10:37.474Z")
  },

  // Follow-up questions
  followUpQuestions: [
    {
      text: "Can you provide an example of polymorphism in Java?",
      type: "example",
      generatedAt: ISODate("2025-11-10T19:10:37.474Z")
    }
  ],

  // Skip tracking
  skipped: false,
  skippedAt: null
}
```

---

## 4. Session-Level Facial Data

### Completion Enrichment Data

When the interview completes, additional facial metrics are sent:

**Request to** `POST /api/interviews/:interviewId/complete`:

```javascript
{
  transcript: "Full interview transcript...",
  facialMetrics: [
    {
      timestamp: 1699632637474,
      eyeContact: 75,
      smilePercentage: 60,
      headSteadiness: 80,
      confidenceScore: 72
      // ... recorded every few seconds during interview
    },
    // ... hundreds or thousands of data points
  ]
}
```

**Current Processing:**

- If `facialMetrics.length > 100`, summarize to averages (prevents 25MB payload)
- Stored in `interview.sessionEnrichment.facialMetrics`

**Storage Schema:**

```javascript
sessionEnrichment: {
  transcript: String,           // Full interview transcript
  facialMetrics: Mixed,         // Array or summary object
  enrichedAt: Date
}
```

---

## 5. Results Calculation

### Interview Completion (`completeInterview`)

**Overall Score Calculation:**

```javascript
// 1. Collect all question scores
const scores = interview.questions
  .filter((q) => q.score?.overall != null)
  .map((q) => q.score.overall);

// 2. Calculate average
const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

// 3. Store in results
interview.results = {
  overallScore: Math.round(averageScore), // 0-100
  completionRate: 90, // % of questions answered
  questionsAnswered: 9,
  questionsSkipped: 1,
  totalQuestions: 10,

  // Category breakdown
  breakdown: {
    technical: 75, // Average of technical questions
    communication: 80, // Average of communication questions
    problemSolving: 78, // Average of problem-solving questions
    behavioral: 85, // Average of behavioral questions
  },
};
```

**Category Normalization:**

- `category: "coding"` → Maps to `technical`
- `type: "behavioral"` → Maps to `behavioral`
- Job role categories → Mapped intelligently

---

## 6. Integration Points for Your Facial AI Model

### Where to Hook In

#### Option 1: Real-Time Analysis (Per Question)

**Location:** `submitAnswer` in `interviewController.js` (line ~480)

```javascript
// EXISTING CODE (lines 483-495)
if (facialMetrics && typeof facialMetrics === "object") {
  interview.questions[qIndex].facial = {
    eyeContact: facialMetrics.eyeContact,
    blinkRate: facialMetrics.blinkRate,
    smilePercentage: facialMetrics.smilePercentage,
    headSteadiness: facialMetrics.headSteadiness,
    offScreenPercentage: facialMetrics.offScreenPercentage,
    confidenceScore: facialMetrics.confidenceScore,
    capturedAt: new Date(),
  };
}

// YOUR INTEGRATION:
// Add your AI model's analysis here
if (facialMetrics && FEATURES.FACIAL_AI) {
  const aiAnalysis = await yourFacialAIModel.analyze(facialMetrics);

  interview.questions[qIndex].facial.aiEnhanced = {
    emotions: aiAnalysis.emotions, // { happy: 0.8, nervous: 0.2 }
    engagement: aiAnalysis.engagement, // 0-100
    authenticity: aiAnalysis.authenticity, // 0-100
    microExpressions: aiAnalysis.micro, // Array of detected expressions
    recommendations: aiAnalysis.feedback, // AI-generated tips
  };
}
```

#### Option 2: Batch Analysis (At Completion)

**Location:** `completeInterview` in `interviewController.js` (line ~1032)

```javascript
// EXISTING CODE (lines 1054-1080)
// Trim excessively large data to prevent payload errors
if (facialMetrics && Array.isArray(facialMetrics)) {
  Logger.info(`Facial metrics array length: ${facialMetrics.length}`);

  // YOUR INTEGRATION:
  // Before trimming, run your AI analysis on the full time series
  if (FEATURES.FACIAL_AI) {
    const sessionAnalysis = await yourFacialAIModel.analyzeSession({
      timeSeries: facialMetrics,
      duration: interview.timing.totalDuration,
      questionCount: interview.questions.length,
    });

    // Store comprehensive analysis
    interview.facialAnalysis = {
      overallEngagement: sessionAnalysis.engagement,
      emotionalJourney: sessionAnalysis.emotions, // Timeline of emotions
      stressIndicators: sessionAnalysis.stress,
      confidenceTrend: sessionAnalysis.confidence,
      recommendations: sessionAnalysis.feedback,
      analyzedAt: new Date(),
    };
  }

  // Then trim for storage efficiency
  if (facialMetrics.length > 100) {
    const summary = {
      /* ... existing summary logic ... */
    };
    facialMetrics = summary;
  }
}
```

---

## 7. API Endpoints Reference

### Get Interview Results

```
GET /api/interviews/:interviewId
```

**Response includes:**

```javascript
{
  _id: "...",
  status: "completed",
  results: {
    overallScore: 78,
    breakdown: { technical: 75, behavioral: 85, ... }
  },
  questions: [
    {
      score: { overall: 78, rubricScores: {...} },
      feedback: { strengths: [...], improvements: [...] },
      facial: { eyeContact: 75, confidenceScore: 72, ... },
      response: { text: "..." }
    }
  ],
  sessionEnrichment: {
    facialMetrics: { /* summary or array */ },
    transcript: "..."
  },
  facialAnalysis: {  // YOUR AI MODEL RESULTS
    overallEngagement: 82,
    emotionalJourney: [...],
    recommendations: "..."
  }
}
```

---

## 8. Database Schema Extensions

### Add Fields to Interview Model

**File:** `server/src/models/Interview.js`

```javascript
// Add after sessionEnrichment (around line 325):

facialAnalysis: {
  enabled: { type: Boolean, default: false },

  // Overall session metrics
  overallEngagement: { type: Number, min: 0, max: 100 },
  overallConfidence: { type: Number, min: 0, max: 100 },
  authenticity: { type: Number, min: 0, max: 100 },

  // Emotional analysis
  emotionalJourney: [{
    timestamp: Number,
    emotions: {
      neutral: Number,
      happy: Number,
      surprised: Number,
      confused: Number,
      focused: Number,
      nervous: Number
    },
    dominantEmotion: String
  }],

  // Stress and confidence trends
  stressIndicators: {
    averageStress: Number,
    peakStress: Number,
    stressTimeline: [Number]
  },

  confidenceTrend: {
    type: String,
    enum: ['increasing', 'stable', 'decreasing', 'fluctuating']
  },

  // Micro-expressions (optional)
  microExpressions: [{
    timestamp: Number,
    type: String,
    confidence: Number
  }],

  // AI-generated insights
  recommendations: [String],
  insights: String,

  // Model metadata
  modelVersion: String,
  analyzedAt: Date
}
```

---

## 9. Feature Flag Setup

**File:** `server/src/config/features.js`

```javascript
module.exports = {
  // Existing flags...
  AI_QUESTIONS: true,

  // Add your flag
  FACIAL_AI: process.env.FACIAL_AI_ENABLED === "true",
  FACIAL_AI_MODEL: process.env.FACIAL_AI_MODEL || "your-model-name",
};
```

**Environment Variable:**

```env
FACIAL_AI_ENABLED=true
FACIAL_AI_MODEL=advanced-emotion-recognition-v2
```

---

## 10. Client-Side Integration

### Sending Facial Data

**File:** `client/src/pages/InterviewPage.js` (around line 214)

```javascript
const handleEndInterview = useCallback(
  async () => {
    try {
      await submitCurrentAnswer();

      // Collect all facial metrics from session
      const enrichmentPayload = {};

      if (sessionTranscript && sessionTranscript.trim()) {
        enrichmentPayload.transcript = sessionTranscript;
      }

      // Send accumulated facial metrics
      if (sessionFacialMetrics && sessionFacialMetrics.length > 0) {
        enrichmentPayload.facialMetrics = sessionFacialMetrics;
      }

      // Complete interview with enrichment data
      await apiService.post(
        `/interviews/${interviewId}/complete`,
        enrichmentPayload
      );

      toast.success("Interview completed!");
      navigate(`/interview/${interviewId}/results`);
    } catch (e) {
      toast.error("Failed to complete interview. Please try again.");
    }
  },
  [
    /* dependencies */
  ]
);
```

---

## 11. Testing Your Integration

### Test Checklist

- [ ] **Per-Question Analysis**

  - Submit answer with facial metrics
  - Verify AI analysis is stored in `questions[i].facial.aiEnhanced`
  - Check response time (should be < 2 seconds)

- [ ] **Session Analysis**

  - Complete interview with 100+ facial data points
  - Verify session analysis in `facialAnalysis` field
  - Confirm data trimming works (no payload errors)

- [ ] **Results Display**

  - Fetch completed interview
  - Verify facial analysis appears in results
  - Check recommendations are human-readable

- [ ] **Performance**
  - Test with 1000+ facial data points
  - Verify payload doesn't exceed 50MB
  - Check AI processing time

---

## 12. Recommended Implementation Steps

1. **Phase 1: Add Schema Fields**

   - Extend Interview model with `facialAnalysis` fields
   - Test data storage and retrieval

2. **Phase 2: Integrate at Completion**

   - Hook into `completeInterview` function
   - Process full session data before trimming
   - Store comprehensive analysis

3. **Phase 3: Real-Time Analysis** (Optional)

   - Add per-question analysis in `submitAnswer`
   - Provide immediate feedback to user

4. **Phase 4: Results Display**

   - Update results page to show facial insights
   - Add charts/graphs for emotional journey
   - Display AI recommendations

5. **Phase 5: Optimization**
   - Cache AI model in memory
   - Batch process where possible
   - Add error handling and fallbacks

---

## 13. Question Generation System

### How Questions Are Generated

MockMate uses a **Hybrid Question Generation System** with caching:

**Generation Mix:**

- **70% Template Questions** - From `questionTemplates.json`
- **30% AI Questions**, split into:
  - **15% Completely New AI** - Generated fresh by AI providers
  - **15% Paraphrased Templates** - AI rephrases existing templates

**Caching Mechanism:**

- Questions are **cached for 24 hours** based on configuration
- Cache key includes: job role, experience level, difficulty, interview type
- Same config = Same cached questions (for 24 hours)

### Getting Fresh Questions Every Time

**Option 1: Skip Cache in Development** (✅ Already implemented)

```javascript
// In interviewController.js
skipCache: config.skipCache ?? process.env.NODE_ENV !== "production";
```

Questions will be fresh in development, cached in production for performance.

**Option 2: Clear Cache Manually**

```bash
# MongoDB shell or Compass
db.cachedquestions.deleteMany({})
```

**Option 3: Pass skipCache from Client**

```javascript
// In InterviewCreationPage.js
const payload = {
  config: {
    jobRole: formData.jobRole,
    experienceLevel: formData.experienceLevel,
    // ... other config
    skipCache: true, // Always generate fresh questions
  },
};
```

---

## Need Help?

### Current Code References:

- **Answer submission**: `server/src/controllers/interviewController.js:396` (`submitAnswer`)
- **Interview completion**: `server/src/controllers/interviewController.js:1032` (`completeInterview`)
- **Data schema**: `server/src/models/Interview.js`
- **AI evaluation**: `server/src/services/aiProviders/index.js`
- **Client submission**: `client/src/pages/InterviewPage.js:214`

### Key Files to Modify:

1. `server/src/models/Interview.js` - Add facial AI schema
2. `server/src/controllers/interviewController.js` - Add AI analysis calls
3. `server/src/config/features.js` - Add feature flag
4. `client/src/pages/InterviewResultsPage.js` - Display insights

---

**Last Updated:** November 11, 2025
