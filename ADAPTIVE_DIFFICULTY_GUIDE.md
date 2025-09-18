# Adaptive Difficulty Feature Usage Guide

## Overview
The adaptive difficulty feature automatically adjusts interview question difficulty based on user performance during a session. Questions become easier if the user struggles (score < 3/5) and harder if they excel (score ≥ 4/5).

## How to Enable

### 1. Create Interview with Adaptive Difficulty
```javascript
POST /api/interviews
{
  "config": {
    "jobRole": "Software Engineer",
    "experienceLevel": "mid",
    "interviewType": "technical",
    "difficulty": "intermediate",
    "duration": 60,
    "questionCount": 10,
    "adaptiveDifficulty": {
      "enabled": true
    }
  }
}
```

### 2. Start Interview (gets initial questions)
```javascript
PUT /api/interviews/{interviewId}/start
```

### 3. Submit Answers and Get Adaptive Feedback
```javascript
POST /api/interviews/{interviewId}/answer/{questionIndex}
{
  "answer": "Your answer here...",
  "timeSpent": 180
}
```

Response includes adaptive info:
```javascript
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "questionIndex": 0,
    "score": 45,
    "adaptiveInfo": {
      "currentDifficulty": "intermediate",
      "suggestedNextDifficulty": "beginner", 
      "difficultyWillChange": true,
      "scoreBasedRecommendation": "easier"
    }
  }
}
```

### 4. Get Next Adaptive Question
```javascript
POST /api/interviews/{interviewId}/adaptive-question
```

Response provides next question with adapted difficulty:
```javascript
{
  "success": true,
  "message": "Adaptive question generated successfully",
  "data": {
    "question": {
      "id": "...",
      "text": "What is a variable in programming?",
      "category": "technical",
      "difficulty": "beginner",
      "timeAllocated": 300,
      "index": 1
    },
    "adaptiveInfo": {
      "currentDifficulty": "beginner",
      "previousDifficulty": "intermediate",
      "difficultyChanged": true
    }
  }
}
```

## Difficulty Adjustment Rules

| Score Range | 5-Point Scale | Action |
|-------------|---------------|---------|
| 0-59        | < 3/5         | Make easier (one level down) |
| 60-79       | 3-4/5         | Keep same difficulty |
| 80-100      | ≥ 4/5         | Make harder (one level up) |

**Difficulty Levels:** `beginner` → `intermediate` → `advanced`

## Implementation Notes

- ✅ Tracks difficulty history per session
- ✅ Prevents going below beginner or above advanced
- ✅ Maintains backward compatibility with non-adaptive interviews
- ✅ Provides detailed adaptive metadata in API responses
- ✅ Works with both AI-generated and database questions

## Example Flow

1. **User starts** intermediate interview
2. **Question 1** (intermediate): User scores 45/100 
3. **Next question** becomes beginner difficulty
4. **Question 2** (beginner): User scores 85/100
5. **Next question** becomes intermediate difficulty
6. **Question 3** (intermediate): User scores 70/100
7. **Next question** stays intermediate difficulty

The system automatically adapts to user performance without requiring manual intervention.