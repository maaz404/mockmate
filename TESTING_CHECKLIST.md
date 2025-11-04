# 🧪 MockMate Testing Checklist

**Date:** November 4, 2025  
**Version:** 2.0 (Simplified Architecture)  
**Purpose:** Verify frontend-backend integration after simplification

---

## 🎯 Pre-Testing Setup

### 1. Environment Setup

- [ ] **Backend .env configured:**

  ```
  PORT=5000
  MONGODB_URI=mongodb://localhost:27017/mockmate
  JWT_SECRET=your-secret-key
  JWT_REFRESH_SECRET=your-refresh-secret
  NODE_ENV=development
  ```

- [ ] **Frontend .env configured:**

  ```
  REACT_APP_API_BASE=http://localhost:5000/api
  REACT_APP_ENV=development
  ```

- [ ] **MongoDB running:**

  ```powershell
  # Check MongoDB is running
  mongosh --eval "db.serverStatus()"
  ```

- [ ] **Dependencies installed:**

  ```powershell
  # Backend
  cd server; npm install

  # Frontend
  cd client; npm install
  ```

### 2. Database Seeding

- [ ] **Question bank populated:**

  ```powershell
  cd server
  node src/scripts/seedQuestions.js
  ```

- [ ] **Verify questions exist:**
  ```javascript
  // In MongoDB or via API
  GET / api / questions / categories;
  // Should return: ['technical', 'behavioral', 'situational']
  ```

### 3. Start Services

- [ ] **Start backend server:**

  ```powershell
  cd server
  npm run dev
  # Should see: "Server running on port 5000"
  # Should see: "MongoDB connected successfully"
  ```

- [ ] **Start frontend dev server:**
  ```powershell
  cd client
  npm start
  # Should open browser at http://localhost:3000
  ```

---

## ✅ Critical User Flows

### Flow 1: User Authentication

**Test Case 1.1: User Registration**

1. Steps:

   - [ ] Navigate to http://localhost:3000
   - [ ] Click "Sign Up" button
   - [ ] Fill in registration form:
     - Name: Test User
     - Email: test@example.com
     - Password: TestPassword123!
   - [ ] Click "Register" button

2. Expected Results:

   - [ ] User redirected to /dashboard
   - [ ] JWT tokens stored in localStorage
   - [ ] User document created in MongoDB users collection
   - [ ] No console errors

3. Verify Backend:
   ```javascript
   // Check MongoDB
   db.users.findOne({ email: "test@example.com" });
   // Should show user with hashed password
   ```

**Test Case 1.2: User Login**

1. Steps:

   - [ ] Log out (if logged in)
   - [ ] Navigate to http://localhost:3000/login
   - [ ] Enter credentials:
     - Email: test@example.com
     - Password: TestPassword123!
   - [ ] Click "Login" button

2. Expected Results:
   - [ ] User redirected to /dashboard
   - [ ] JWT tokens refreshed in localStorage
   - [ ] User name displayed in header
   - [ ] No console errors

**Test Case 1.3: Token Refresh**

1. Steps:

   - [ ] Log in
   - [ ] Wait for access token to expire (or manually delete it)
   - [ ] Make any API call (e.g., navigate to /interviews)

2. Expected Results:
   - [ ] Token automatically refreshed
   - [ ] API call succeeds after refresh
   - [ ] New access token in localStorage
   - [ ] No visible error to user

---

### Flow 2: Interview Creation

**Test Case 2.1: Create Technical Interview**

1. Steps:

   - [ ] Log in
   - [ ] Navigate to /interviews/create
   - [ ] Fill in interview configuration:
     - Job Role: Software Engineer
     - Experience Level: Intermediate
     - Interview Type: Technical
     - Difficulty: Intermediate
     - Number of Questions: 5
     - Duration: 15 minutes
   - [ ] Click "Create Interview" button

2. Expected Results:

   - [ ] Interview created successfully
   - [ ] Redirected to /interview/:id
   - [ ] Interview document created in MongoDB
   - [ ] 5 questions displayed
   - [ ] Questions match difficulty level
   - [ ] "Start Interview" button visible

3. Verify Backend:
   ```javascript
   // Check MongoDB
   db.interviews.findOne({ user: ObjectId("...") });
   // Should show:
   // - status: 'created'
   // - questions: array of 5 questions
   // - config matching input
   ```

**Test Case 2.2: Create Behavioral Interview**

1. Steps:

   - [ ] Navigate to /interviews/create
   - [ ] Select Interview Type: Behavioral
   - [ ] Number of Questions: 3
   - [ ] Click "Create Interview"

2. Expected Results:
   - [ ] 3 behavioral questions displayed
   - [ ] Questions are behavioral (not technical)
   - [ ] Interview created with correct type

---

### Flow 3: Interview Execution

**Test Case 3.1: Start Interview**

1. Steps:

   - [ ] Create interview (or use existing)
   - [ ] Click "Start Interview" button

2. Expected Results:

   - [ ] Interview status changes to 'in-progress'
   - [ ] Timer starts
   - [ ] First question displayed
   - [ ] Answer textarea enabled
   - [ ] Submit button visible

3. Verify Backend:
   ```javascript
   db.interviews.findOne({ _id: ObjectId("...") });
   // Should show:
   // - status: 'in-progress'
   // - startedAt: timestamp
   ```

**Test Case 3.2: Submit Answer (Good Answer)**

1. Steps:

   - [ ] Start interview
   - [ ] Type a comprehensive answer (50+ words) that includes keywords:
     ```
     REST API is an architectural style for building web services that
     uses HTTP requests to access and manipulate resources. It follows
     principles like statelessness, client-server architecture, and
     uniform interface. REST APIs use HTTP methods (GET, POST, PUT, DELETE)
     to perform CRUD operations on resources identified by URLs.
     ```
   - [ ] Click "Submit Answer" button

2. Expected Results:

   - [ ] Answer submitted successfully
   - [ ] Evaluation appears:
     - Score: 80-100 (high score for good answer)
     - Feedback: "Excellent!" or "Good!"
     - Strengths: "Covered X key concepts"
     - Improvements: (minimal or none)
   - [ ] Next question displayed automatically
   - [ ] Progress indicator updates (1/5)

3. Verify Backend:
   ```javascript
   db.interviews.findOne({ _id: ObjectId("...") });
   // Should show:
   // questions[0].response.text: (your answer)
   // questions[0].score.overall: 80-100
   // questions[0].feedback: { strengths, improvements }
   ```

**Test Case 3.3: Submit Answer (Weak Answer)**

1. Steps:

   - [ ] Navigate to next question
   - [ ] Type a brief, incomplete answer (10-20 words):
     ```
     REST API is used for web services.
     ```
   - [ ] Click "Submit Answer"

2. Expected Results:
   - [ ] Answer submitted successfully
   - [ ] Evaluation appears:
     - Score: 30-50 (low score for weak answer)
     - Feedback: "Needs improvement"
     - Strengths: "Attempted the question"
     - Improvements: "Try to mention: [missing keywords]"
   - [ ] Next question displayed

**Test Case 3.4: Submit Empty Answer**

1. Steps:

   - [ ] Navigate to next question
   - [ ] Leave answer textarea empty
   - [ ] Click "Submit Answer"

2. Expected Results:
   - [ ] Validation error shown
   - [ ] Toast/error message: "Please provide an answer"
   - [ ] Answer not submitted
   - [ ] User stays on same question

**Test Case 3.5: Navigate Between Questions**

1. Steps:

   - [ ] Submit answer to question 1
   - [ ] Submit answer to question 2
   - [ ] Use "Previous" button to go back to question 1
   - [ ] Verify previous answer is displayed
   - [ ] Use "Next" button to return to question 2

2. Expected Results:
   - [ ] Previous answers persist
   - [ ] Scores and feedback shown for answered questions
   - [ ] Navigation works smoothly
   - [ ] No data loss

---

### Flow 4: Complete Interview

**Test Case 4.1: Complete Interview Successfully**

1. Steps:

   - [ ] Answer all 5 questions (submit answers)
   - [ ] Click "Complete Interview" button
   - [ ] Confirm completion in modal (if any)

2. Expected Results:

   - [ ] Interview completed successfully
   - [ ] Redirected to /interviews/:id/results
   - [ ] Interview status: 'completed'
   - [ ] Overall score calculated and displayed

3. Verify Backend:
   ```javascript
   db.interviews.findOne({ _id: ObjectId("...") });
   // Should show:
   // - status: 'completed'
   // - completedAt: timestamp
   // - overallScore: average of all question scores
   ```

**Test Case 4.2: View Results Page**

1. Steps:

   - [ ] Complete interview (or navigate to /interviews/:id/results)

2. Expected Results:
   - [ ] Overall score displayed (e.g., 75/100)
   - [ ] Score breakdown by question:
     - Question text
     - Your answer
     - Score
     - Feedback (strengths/improvements)
   - [ ] Time statistics:
     - Total time taken
     - Average time per question
   - [ ] Visual score chart/graph (if implemented)
   - [ ] "Back to Dashboard" button

---

### Flow 5: Dashboard & History

**Test Case 5.1: View Interview History**

1. Steps:

   - [ ] Complete at least 2 interviews
   - [ ] Navigate to /dashboard or /interviews

2. Expected Results:
   - [ ] All interviews displayed in list/grid
   - [ ] For each interview:
     - Job role
     - Interview type
     - Status (completed, in-progress, created)
     - Date created
     - Overall score (if completed)
   - [ ] Interviews sorted by date (newest first)
   - [ ] "View Results" button for completed interviews
   - [ ] "Resume" button for in-progress interviews

**Test Case 5.2: Resume In-Progress Interview**

1. Steps:

   - [ ] Start interview but don't complete it
   - [ ] Navigate away (e.g., to /dashboard)
   - [ ] Return to /interviews
   - [ ] Click "Resume" on in-progress interview

2. Expected Results:
   - [ ] Interview loads at last answered question
   - [ ] Previous answers preserved
   - [ ] Timer resumes (or shows elapsed time)
   - [ ] Can continue answering questions

---

## 🔍 API Endpoint Testing

### Using Browser DevTools or Postman

**Test Authentication Endpoints**

1. [ ] **POST /api/auth/register**

   ```json
   // Request
   {
     "email": "test@example.com",
     "password": "TestPassword123!",
     "name": "Test User"
   }

   // Expected Response (200)
   {
     "success": true,
     "data": {
       "accessToken": "eyJhbG...",
       "refreshToken": "eyJhbG...",
       "user": { "id": "...", "email": "...", "name": "..." }
     }
   }
   ```

2. [ ] **POST /api/auth/login**

   ```json
   // Request
   {
     "email": "test@example.com",
     "password": "TestPassword123!"
   }

   // Expected Response (200)
   {
     "success": true,
     "data": {
       "accessToken": "eyJhbG...",
       "refreshToken": "eyJhbG...",
       "user": { "id": "...", "email": "...", "name": "..." }
     }
   }
   ```

3. [ ] **GET /api/auth/me**

   ```
   // Header
   Authorization: Bearer <accessToken>

   // Expected Response (200)
   {
     "success": true,
     "data": {
       "user": { "id": "...", "email": "...", "name": "..." }
     }
   }
   ```

**Test Interview Endpoints**

4. [ ] **POST /api/interviews**

   ```json
   // Header: Authorization: Bearer <token>
   // Request
   {
     "config": {
       "jobRole": "Software Engineer",
       "experienceLevel": "intermediate",
       "interviewType": "technical",
       "difficulty": "intermediate",
       "questionCount": 5
     }
   }

   // Expected Response (200)
   {
     "success": true,
     "data": {
       "interview": { "_id": "...", "status": "created", "questions": [...] },
       "questions": [ /* 5 questions */ ]
     }
   }
   ```

5. [ ] **GET /api/interviews/:id**

   ```
   // Header: Authorization: Bearer <token>

   // Expected Response (200)
   {
     "success": true,
     "data": {
       "interview": { /* full interview object */ }
     }
   }
   ```

6. [ ] **POST /api/interviews/:id/answer/0**

   ```json
   // Header: Authorization: Bearer <token>
   // Request
   {
     "answer": "REST API is an architectural style...",
     "timeSpent": 120
   }

   // Expected Response (200)
   {
     "success": true,
     "data": {
       "score": 75,
       "feedback": {
         "overall": "Good answer!",
         "strengths": ["Covered 3 key concepts"],
         "improvements": ["Try to mention: response"]
       }
     }
   }
   ```

---

## 🐛 Error Handling Testing

**Test Case: Invalid Token**

1. Steps:

   - [ ] Log in
   - [ ] Manually edit accessToken in localStorage (corrupt it)
   - [ ] Make any API call (e.g., navigate to /interviews)

2. Expected Results:
   - [ ] 401 Unauthorized response
   - [ ] Token refresh attempted
   - [ ] If refresh fails, redirect to /login
   - [ ] Error message displayed

**Test Case: Empty Answer Submission**

1. Steps:

   - [ ] Start interview
   - [ ] Click "Submit Answer" without typing

2. Expected Results:
   - [ ] Frontend validation prevents submission
   - [ ] Error message: "Please provide an answer"
   - [ ] No API call made

**Test Case: Network Error**

1. Steps:

   - [ ] Stop backend server
   - [ ] Try to create interview from frontend

2. Expected Results:
   - [ ] Network error caught
   - [ ] User-friendly error message: "Network error. Please check your connection."
   - [ ] No application crash

**Test Case: Interview Not Found**

1. Steps:

   - [ ] Navigate to /interviews/invalid-id-12345

2. Expected Results:
   - [ ] 404 Not Found response
   - [ ] Error page or message displayed
   - [ ] No application crash

---

## 📊 Data Validation

### Check MongoDB Collections

**Users Collection**

```javascript
db.users.findOne({ email: "test@example.com" });
// Should have:
// - Hashed password (not plain text)
// - createdAt timestamp
// - subscription object
```

**Interviews Collection**

```javascript
db.interviews.findOne({ user: ObjectId("...") });
// Should have:
// - Correct user reference
// - config object
// - questions array with responses
// - scores and feedback
// - status: 'completed'
```

**Questions Collection**

```javascript
db.questions.countDocuments();
// Should have 30+ questions

db.questions.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
// Should show distribution: technical, behavioral, situational
```

---

## ⚡ Performance Testing

**Test Case: Load Testing**

1. [ ] Create 10 interviews rapidly
2. [ ] Verify all created successfully
3. [ ] Check response times < 1000ms

**Test Case: Large Answer Submission**

1. [ ] Submit answer with 500+ words
2. [ ] Verify evaluation completes
3. [ ] Check response time < 2000ms

---

## 🎨 UI/UX Verification

- [ ] Responsive design (test on mobile, tablet, desktop)
- [ ] Loading spinners appear during API calls
- [ ] Toast notifications for success/error
- [ ] Disabled features (video recording, facial analysis) are hidden
- [ ] Navigation works smoothly
- [ ] Accessibility (keyboard navigation, ARIA labels)

---

## ✅ Feature Flags Verification

**Verify Disabled Features Don't Appear**

- [ ] Video recording button not visible
- [ ] Facial analysis components not rendered
- [ ] AI questions option not shown (if disabled)
- [ ] Coding challenges not accessible
- [ ] Chatbot icon not present

**Verify Core Features Work**

- [ ] Question bank accessible
- [ ] Basic evaluation works
- [ ] Dashboard statistics display
- [ ] Interview history shows

---

## 🎉 Final Checklist

Before marking complete:

- [ ] All critical user flows tested (auth, create, answer, complete, results)
- [ ] No console errors in browser
- [ ] No server errors in terminal
- [ ] MongoDB data looks correct
- [ ] Feature flags respected
- [ ] Error handling works gracefully
- [ ] API responses match expected format
- [ ] Authentication/authorization working
- [ ] Token refresh working
- [ ] Evaluation scores reasonable (0-100 range)
- [ ] Feedback messages meaningful
- [ ] Navigation works smoothly
- [ ] Data persists across sessions

---

## 📝 Test Results Template

```markdown
## Test Execution Results

**Date:** [YYYY-MM-DD]
**Tester:** [Your Name]
**Environment:** Development

### Summary

- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

### Failed Tests

| Test Case | Issue                       | Severity | Notes       |
| --------- | --------------------------- | -------- | ----------- |
| TC 3.2    | Score calculation incorrect | High     | Fixed by... |

### Notes

- All critical flows working
- Minor UI polish needed
- Performance acceptable
```

---

## 🚀 Ready for Production?

If all tests pass:

✅ **Backend is complete and error-free**  
✅ **Frontend is integrated with backend**  
✅ **Evaluation service works correctly**  
✅ **Authentication is secure**  
✅ **Data persistence is reliable**  
✅ **Error handling is graceful**  
✅ **Feature flags control features**

**Your application is ready to use!** 🎊

---

**Last Updated:** November 4, 2025  
**Version:** 2.0 (Simplified Architecture)  
**Status:** Ready for Testing
