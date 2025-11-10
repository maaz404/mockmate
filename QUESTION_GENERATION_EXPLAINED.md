# Question Generation System - Complete Guide

## 🎯 Why You're Seeing the Same Questions

You noticed identical questions appearing in your interviews. This is because MockMate uses a **24-hour caching system** for performance optimization.

---

## 📊 How the System Works

### Question Generation Flow

```
Interview Created
    ↓
Check Cache (24-hour TTL)
    ├─→ Cache HIT → Return cached questions (SAME questions)
    └─→ Cache MISS → Generate new questions:
                      ├─→ 70% Template Questions (from JSON file)
                      └─→ 30% AI Questions:
                          ├─→ 15% Completely New (AI-generated)
                          └─→ 15% Paraphrased Templates (AI-rephrased)
```

### Cache Key Formula

Questions are cached based on:

- Job Role (e.g., "Software Engineer")
- Experience Level (e.g., "mid")
- Difficulty (e.g., "intermediate")
- Interview Type (e.g., "technical", "behavioral", "mixed")

**Same config = Same questions for 24 hours**

---

## 🔧 Solution Implemented

### ✅ Automatic Fresh Questions in Development

**File:** `server/src/controllers/interviewController.js` (line 1488)

```javascript
const questionConfig = {
  jobRole: config.jobRole,
  experienceLevel: config.experienceLevel,
  interviewType: config.interviewType,
  difficulty: config.difficulty || "intermediate",
  count: config.questionCount || C.DEFAULT_QUESTION_COUNT,
  focusAreas: config.focusAreas || [],
  skillsToImprove: userProfile?.professionalInfo?.skillsToImprove || [],

  // 🎯 NEW: Skip cache in development for fresh questions
  skipCache: config.skipCache ?? process.env.NODE_ENV !== "production",
};
```

**What This Does:**

- **Development**: `skipCache = true` → Fresh questions every time ✅
- **Production**: `skipCache = false` → Use cache for performance ⚡

---

## 🎨 Question Generation Details

### 1. Template Questions (70%)

**Source:** `server/src/data/questionTemplates.json`

**Structure:**

```json
{
  "software-engineer": {
    "beginner": {
      "technical": [
        {
          "text": "What is a variable in programming?",
          "category": "Programming Fundamentals",
          "tags": ["Variables", "Basics"],
          "estimatedTime": 180
        }
      ],
      "behavioral": [...]
    },
    "intermediate": {...},
    "advanced": {...}
  },
  "software-tester": {...},
  "data-analyst": {...}
}
```

**Features:**

- Pre-written, tested questions
- Role-specific (18+ roles supported)
- Difficulty-specific (beginner/intermediate/advanced)
- Type-specific (technical/behavioral/system-design)
- Randomized selection for variety

### 2. AI-Generated Questions (15%)

**Provider Chain:**

1. **Gemini 1.5 Flash** (Primary)
2. **Groq Llama 3.1** (Fallback)
3. **Grok Beta** (Fallback)

**Generation Process:**

```javascript
// Example prompt sent to AI
const prompt = `
Generate interview questions for:
- Role: ${config.jobRole}
- Experience: ${config.experienceLevel}
- Type: ${config.interviewType}
- Difficulty: ${config.difficulty}
- Count: ${count}

Requirements:
1. Relevant to the role and experience level
2. Appropriate difficulty
3. Include estimated time
4. Add relevant tags
`;
```

**AI Response Format:**

```json
[
  {
    "text": "How would you design a scalable microservices architecture?",
    "category": "System Design",
    "difficulty": "advanced",
    "timeEstimate": 5,
    "tags": ["Microservices", "Architecture", "Scalability"]
  }
]
```

### 3. Paraphrased Questions (15%)

**Purpose:** Provide variety while maintaining quality

**Process:**

1. Select random template questions
2. Send to AI with paraphrasing prompt
3. AI rewrites maintaining intent and difficulty

**Example:**

**Original Template:**

> "Explain the concept of polymorphism in object-oriented programming."

**AI Paraphrased:**

> "Can you describe how polymorphism works in OOP and provide an example?"

**Paraphrasing Prompt:**

```javascript
const prompt = `
Paraphrase this interview question while maintaining its intent and difficulty:

Original: "${questionText}"
Job Role: ${config.jobRole}
Experience: ${config.experienceLevel}
Difficulty: ${config.difficulty}

Requirements:
1. Keep the same core concept and difficulty
2. Make it sound natural and interview-appropriate
3. Maintain technical accuracy
4. Use slightly different wording
5. Return only the paraphrased question

Paraphrased:
`;
```

---

## 🚀 How to Control Question Generation

### Method 1: Environment-Based (Recommended)

**Current Setup:**

- **Development**: Fresh questions every time
- **Production**: Cached questions (performance)

No code changes needed! Just set your environment:

```bash
# Development (default for npm start)
NODE_ENV=development

# Production
NODE_ENV=production
```

### Method 2: Always Fresh (Override Cache)

**Client-Side:** `client/src/pages/InterviewCreationPage.js`

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  const payload = {
    config: {
      jobRole: formData.jobRole,
      experienceLevel: formData.experienceLevel,
      interviewType: formData.interviewType,
      difficulty: formData.difficulty,
      duration: parseInt(formData.duration),
      questionCount: 10,

      // Add this line to always skip cache
      skipCache: true, // ✅ Forces fresh questions

      // ... other config
    },
  };

  await apiService.post("/interviews", payload);
};
```

### Method 3: Clear Cache Manually

**MongoDB Shell:**

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use mockmate_db

# Delete all cached questions
db.cachedquestions.deleteMany({})

# Delete expired cache only
db.cachedquestions.deleteMany({
  expiresAt: { $lt: new Date() }
})
```

**MongoDB Compass:**

1. Open Compass
2. Connect to your database
3. Navigate to `cachedquestions` collection
4. Click "Delete Documents"
5. Filter: `{}` (all) or `{ expiresAt: { $lt: ISODate() } }` (expired only)
6. Confirm deletion

### Method 4: Reduce Cache TTL

**File:** `server/src/services/hybridQuestionService.js` (line 1186)

```javascript
async cacheQuestions(config, questions) {
  try {
    const cacheKey = CachedQuestion.generateCacheKey(config);
    await CachedQuestion.deleteOne({ cacheKey });

    const cachedQuestion = new CachedQuestion({
      cacheKey,
      config,
      questions,

      // Change cache duration
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      // expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      // expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    await cachedQuestion.save();
  }
}
```

---

## 📈 Question Distribution Examples

### Example 1: Software Engineer - Intermediate - Technical (10 questions)

| Source         | Count | Questions                                      |
| -------------- | ----- | ---------------------------------------------- |
| Templates      | 7     | - DSA, System Design, Programming Fundamentals |
| AI Generated   | 2     | - Custom advanced questions                    |
| AI Paraphrased | 1     | - Template rephrased                           |

### Example 2: Data Analyst - Senior - Mixed (10 questions)

| Type             | Count | Source Distribution                |
| ---------------- | ----- | ---------------------------------- |
| Technical (70%)  | 7     | 5 templates + 1 AI + 1 paraphrased |
| Behavioral (30%) | 3     | 2 templates + 1 AI                 |

### Example 3: With Coding Challenges (10 questions)

| Type              | Count | Notes                                |
| ----------------- | ----- | ------------------------------------ |
| Regular Questions | 6     | Mix of technical/behavioral          |
| Coding Questions  | 4     | Injected, replacing last 4 questions |

---

## 🔍 Debugging Question Generation

### Check What Questions Were Generated

**Server Logs:**

```bash
[hybridQuestionService] Generated 10 hybrid questions
[getQuestionsForInterview] Generated 10 questions
```

### View Question Sources

Each question has a `source` field:

- `"template"` - From questionTemplates.json
- `"ai_generated"` - Completely new AI question
- `"ai_paraphrased"` - AI-rephrased template
- `"coding"` - Coding challenge

**Check in MongoDB:**

```javascript
db.interviews.findOne(
  { _id: ObjectId("your-interview-id") },
  { "questions.questionText": 1, "questions.category": 1 }
);
```

### Check Cache Status

```javascript
// Check cached questions
db.cachedquestions.find().pretty();

// Check cache for specific config
db.cachedquestions.findOne({
  "config.jobRole": "Software Engineer",
  "config.experienceLevel": "mid",
  "config.difficulty": "intermediate",
  "config.interviewType": "technical",
});

// See when cache expires
db.cachedquestions.find({}, { cacheKey: 1, expiresAt: 1, usageCount: 1 });
```

---

## ⚡ Performance Considerations

### With Cache (Production)

**Benefits:**

- ⚡ Fast response time (~50ms)
- 💰 Reduced AI API costs
- 📊 Consistent experience for same configs

**Trade-offs:**

- 🔁 Same questions for 24 hours
- 💾 Additional database storage

### Without Cache (Development)

**Benefits:**

- 🎨 Fresh questions every time
- 🧪 Better for testing
- 🔍 See all generation sources

**Trade-offs:**

- ⏱️ Slower response (~2-5 seconds)
- 💸 Higher AI API costs
- 🔄 Increased load on AI providers

---

## 🎯 Recommended Setup

### Development Environment

```env
NODE_ENV=development
# Cache automatically disabled
# Fresh questions every interview
```

### Staging Environment

```env
NODE_ENV=staging
# Optional: Lower cache TTL for testing
# QUESTION_CACHE_TTL=3600  # 1 hour
```

### Production Environment

```env
NODE_ENV=production
# Cache enabled
# 24-hour TTL for performance
```

---

## 🛠️ Advanced: Custom Question Mix

Want to change the 70/30 ratio? Modify `hybridQuestionService.js`:

```javascript
async generateNewQuestionSet(config) {
  const { questionCount } = config;

  // CURRENT: 70% templates, 30% AI
  const TEMPLATE_RATIO = 0.7;

  // OPTIONS:
  // const TEMPLATE_RATIO = 0.8;  // 80% templates, 20% AI
  // const TEMPLATE_RATIO = 0.5;  // 50/50 split
  // const TEMPLATE_RATIO = 0.3;  // 30% templates, 70% AI

  const templateCount = Math.ceil(questionCount * TEMPLATE_RATIO);
  const aiCount = questionCount - templateCount;

  // ...
}
```

---

## 📝 Summary

✅ **Problem:** Same questions appearing due to 24-hour cache  
✅ **Solution:** Added `skipCache` parameter  
✅ **Behavior:**

- Development: Fresh questions every time
- Production: Cached for performance

✅ **Question Mix:**

- 70% templates (reliable, tested)
- 15% AI-generated (unique, relevant)
- 15% AI-paraphrased (variety from templates)

✅ **Control:** Multiple methods to control caching behavior

---

**Files Modified:**

1. `server/src/controllers/interviewController.js` - Added skipCache logic
2. `server/src/services/hybridQuestionService.js` - Implemented skipCache parameter
3. `RESPONSE_ANALYSIS_GUIDE.md` - Added question generation documentation

**Last Updated:** November 11, 2025
