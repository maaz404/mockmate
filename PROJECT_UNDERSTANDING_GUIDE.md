# 🎓 MockMate Application - Complete Understanding Guide

## 📖 **What is MockMate?**

MockMate is an **AI-powered interview practice platform** that helps job seekers prepare for interviews. Think of it like having a personal interview coach that uses AI to:

- Ask you relevant interview questions
- Record your answers (video + audio)
- Analyze how you perform
- Give you detailed feedback
- Track your progress over time

---

## 🏗️ **Project Architecture (The Big Picture)**

Your application has **3 main parts** working together:

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                          │
│                   (What users see)                          │
│                                                             │
│    React Frontend (client/) - Port 3000                    │
│    • Beautiful UI/UX                                       │
│    • Video recording                                       │
│    • Displays questions & feedback                         │
└─────────────┬───────────────────────────────────────────────┘
              │ HTTP Requests
              ↓
┌─────────────────────────────────────────────────────────────┐
│              NODE.JS BACKEND (server/) - Port 5000          │
│                 (The main brain)                            │
│                                                             │
│    • Handles authentication                                │
│    • Manages database (MongoDB)                            │
│    • Coordinates everything                                │
│    • Business logic                                        │
└─────────────┬───────────────────────────────────────────────┘
              │ Calls for AI help
              ↓
┌─────────────────────────────────────────────────────────────┐
│         PYTHON AI SERVICE (python-service/) - Port 8000     │
│              (The AI specialist)                            │
│                                                             │
│    • Generates smart questions using AI                    │
│    • Evaluates answers deeply                              │
│    • Analyzes text semantically                            │
│    • Provides advanced analytics                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 **PART 1: Frontend (client/ folder)**

### **Technology Stack:**

- **React** - JavaScript framework for building the UI
- **React Router** - Navigation between pages
- **Tailwind CSS** - Styling (makes it look beautiful)
- **TensorFlow.js** - Face detection and analysis in browser
- **MediaPipe** - Facial expression tracking
- **Monaco Editor** - Code editor for coding challenges
- **Chart.js & Recharts** - Beautiful graphs and charts
- **Axios** - Makes HTTP requests to backend

### **What It Does:**

#### 1. **User Interface** 🎨

- Login/Signup pages
- Dashboard showing your progress
- Interview session interface
- Profile management
- Settings pages

#### 2. **Video Recording** 📹

- Records your face using webcam
- Captures audio of your answers
- Real-time facial expression analysis:
  - Eye contact tracking
  - Smile detection
  - Head steadiness
  - Confidence scoring

#### 3. **Interview Experience** 🎤

- Displays questions one by one
- Timer for each question
- Record/stop recording controls
- Shows feedback after answering
- Follow-up questions based on your answers

#### 4. **Analytics & Reports** 📊

- Performance graphs
- Progress over time
- Strengths and weaknesses
- Export reports as PDF/CSV

#### 5. **Coding Challenges** 💻

- Built-in code editor (like VS Code in browser)
- Run code in multiple languages
- Get instant feedback

### **Key Files:**

- `src/pages/` - Different pages (Dashboard, Interview, Profile)
- `src/components/` - Reusable UI pieces
- `src/services/` - API calls to backend
- `src/hooks/` - Custom React logic (e.g., useInterview, useVideoRecording)
- `src/context/` - App-wide state (Auth, Theme, etc.)

---

## 🖥️ **PART 2: Backend Server (server/ folder)**

### **Technology Stack:**

- **Node.js + Express** - JavaScript server framework
- **MongoDB + Mongoose** - Database for storing data
- **Passport.js** - Authentication (Google OAuth)
- **JWT** - Secure user sessions
- **OpenAI API** - For basic AI features
- **Cloudinary** - Stores videos and images
- **Judge0 API** - Executes code for coding challenges
- **PDFKit** - Generates PDF reports

### **What It Does:**

This is the **main control center** of your application. It handles everything!

#### 1. **User Management** 👤

Files: `controllers/userController.js`, `routes/user.js`

**What it does:**

- User registration and login
- Profile management (update info, upload profile pic)
- Password reset
- Track user's subscription (Free or Premium)
- Handle quota (Free users get 5 interviews/month)

**Example flow:**

```
User signs up → Backend creates account in MongoDB →
Sends back JWT token → User can now login
```

#### 2. **Interview Management** 🎤

Files: `controllers/interviewController.js`, `routes/interview.js`, `services/hybridQuestionService.js`

**What it does:**

- Create new interview sessions
- Load questions (from database or generate with AI)
- Store user's answers
- Track interview progress
- Save video recordings (to Cloudinary)
- Calculate scores
- Generate feedback

**Example flow:**

```
User clicks "Start Interview" →
Backend creates interview session →
Loads/generates questions →
User answers → Backend stores answer →
Evaluates answer → Returns feedback
```

**Key Features:**

- **Adaptive Difficulty**: Adjusts question difficulty based on performance
  - If you're doing well → Gets harder questions
  - If struggling → Gets easier questions
- **Multiple Interview Types**:
  - Technical (coding, algorithms)
  - Behavioral (tell me about a time...)
  - System Design
  - Mixed

#### 3. **Question Generation & Management** ❓

Files: `controllers/questionController.js`, `services/aiQuestionService.js`, `services/hybridQuestionService.js`

**How it works:**

**Option 1: Database Questions**

- Pre-written questions stored in MongoDB
- Categorized by: topic, difficulty, type
- Fast and reliable

**Option 2: AI-Generated Questions**

- Calls OpenAI API to generate custom questions
- Based on: job role, experience level, topic
- More personalized

**Option 3: Hybrid (BEST)**

- Combines both approaches
- Uses database questions as base
- Enhances with AI for personalization
- Falls back to database if AI fails

**Python Service Integration:**
The backend CAN call Python service for even smarter question generation:

```javascript
// In questionController.js (line 79)
const response = await axios.post(
  `${process.env.PYTHON_SERVICE_URL}/api/generate-adaptive-questions`,
  { role, level, difficulty, context }
);
```

#### 4. **Answer Evaluation** ✅

Files: `services/evaluationService.js`, `services/advancedFeedbackService.js`

**What it does:**

- Analyzes your answer text
- Compares with expected keywords
- Checks answer quality
- Generates detailed feedback
- Assigns a score (0-100)

**Evaluation Process:**

```
1. Keyword Matching (30%): Did you mention important terms?
2. Completeness (30%): How thorough was your answer?
3. Clarity (20%): Was it well-structured?
4. Technical Accuracy (20%): Was it correct?
```

**Python Service Integration:**
For advanced evaluation, it calls Python service:

```javascript
// In evaluationService.js
const response = await axios.post(
  `${process.env.PYTHON_SERVICE_URL}/api/evaluate-answer`,
  { question, answer, keywords }
);
```

Python service uses advanced NLP (Natural Language Processing) for deeper analysis.

#### 5. **Coding Challenges** 💻

Files: `controllers/codingController.js`, `services/codingChallengeService.js`, `services/judge0Service.js`

**What it does:**

- Provides coding problems
- Accepts code submissions
- Executes code safely (using Judge0 API - external service)
- Checks if solution is correct
- Provides test cases and feedback

**How code execution works:**

```
User writes code in browser →
Sends to backend →
Backend sends to Judge0 API →
Judge0 runs code in secure sandbox →
Returns result →
Backend checks against test cases →
Gives feedback to user
```

**Supported Languages:**
JavaScript, Python, Java, C++, C#, Ruby, Go, and more!

#### 6. **Video & Media Management** 📹

Files: `controllers/videoController.js`, `controllers/sessionMediaController.js`, `routes/video.js`

**What it does:**

- Receives video/audio from frontend
- Uploads to Cloudinary (cloud storage)
- Stores URLs in MongoDB
- Retrieves videos for playback
- Handles transcription (speech-to-text)

**Flow:**

```
User records video →
Frontend sends video file →
Backend uploads to Cloudinary →
Gets back URL →
Saves URL to MongoDB →
Later: User can watch their recorded interviews
```

#### 7. **AI Chatbot (Grok)** 🤖

Files: `services/grokChatbotService.js`, `controllers/chatbotController.js`

**What it does:**

- Provides an AI assistant during interviews
- Answers questions about the interview
- Gives hints (premium feature)
- Explains concepts
- Provides encouragement

#### 8. **Reports & Analytics** 📊

Files: `controllers/reportController.js`, `services/comprehensiveReportingService.js`, `services/pdfGenerationService.js`

**What it does:**

- Generates performance reports
- Creates beautiful charts
- Shows progress over time
- Identifies strengths/weaknesses
- Exports as PDF or CSV

**Metrics tracked:**

- Average score per interview type
- Improvement over time
- Most challenging topics
- Facial metrics (eye contact, confidence)
- Time management
- Answer quality trends

#### 9. **Subscription Management** 💳

Files: Mixed in `userController.js`, `interviewController.js`

**What it does:**

- Manages Free vs Premium users
- Tracks interview quota (Free = 5/month)
- Resets quota monthly
- Checks subscription before features
- Upgrade/downgrade handling

**Free Plan:**

- 5 interviews per month
- Basic feedback
- Limited features

**Premium Plan:**

- Unlimited interviews
- Advanced AI feedback
- Facial analysis
- Detailed reports
- Chatbot hints
- Priority support

---

## 🐍 **PART 3: Python AI Service (python-service/ folder)**

### **Technology Stack:**

- **FastAPI** - Modern Python web framework (like Express but for Python)
- **OpenAI API** - GPT-4 for generating questions and feedback
- **Sentence Transformers** - For understanding meaning of text
- **SpaCy** - Natural Language Processing library
- **KeyBERT** - Extracts important keywords from text
- **Scikit-learn** - Machine learning algorithms
- **TensorFlow/PyTorch** - Deep learning (for future features)

### **Purpose: Why Python Service Exists?**

The Node.js backend is great for general tasks, but **Python is better for AI/ML**:

- Better ML libraries (TensorFlow, PyTorch, spaCy)
- Better NLP (Natural Language Processing) tools
- More accurate text analysis
- Semantic understanding (understanding meaning, not just words)

### **What It Does:**

#### 1. **Advanced Question Generation** 🧠

File: `app/services/ai_question_generator.py`

**Better than Node.js because:**

- Uses advanced AI models
- Generates contextual questions
- Considers user's history
- Adapts to weak areas
- Creates follow-up questions dynamically

**Example:**

```
Input: User struggled with "React Hooks"
Output: Generates 5 progressively challenging questions about hooks,
        with follow-ups based on their understanding level
```

#### 2. **Semantic Answer Evaluation** 🔍

File: `app/services/answer_evaluator.py`, `app/services/semantic_analyzer.py`

**What makes it special:**

- **Semantic Similarity**: Understands meaning, not just matching words

  - "Function that returns a function" ≈ "Higher-order function"
  - Even if exact words don't match!

- **Keyword Extraction**: Automatically finds important terms in answer

- **Structure Analysis**: Checks if answer is well-organized

- **Technical Depth**: Evaluates how deep the understanding is

- **Clarity Score**: Measures how clearly explained

**Example:**

```
Question: "Explain React hooks"
Answer 1: "Hooks let you use state in functions"
Answer 2: "React Hooks are functions that enable state management
           and lifecycle features in functional components. useState
           manages state, useEffect handles side effects..."

Python service understands Answer 2 is much better, even without
exact word matching - it understands the MEANING!
```

#### 3. **Adaptive Difficulty Engine** 🎯

File: `app/services/adaptive_difficulty.py`

**What it does:**

- Analyzes performance patterns
- Calculates next question difficulty
- Considers:
  - Recent scores
  - Score trends (improving or declining)
  - Time taken
  - Topics mastered
  - Weak areas

**Smart adjustments:**

```
User scores: 90%, 92%, 95% → "User is doing great!
                                Increase to Advanced level"

User scores: 45%, 50%, 48% → "User is struggling.
                                Decrease to Beginner level"

User scores: 75%, 80%, 78% → "Stable performance.
                                Keep current level"
```

#### 4. **Real-time Analytics** 📈

Files: `app/services/advanced_analytics.py`, `app/services/real_time_tracker.py`

**What it does:**

- Tracks metrics during interview
- Predicts performance trends
- Identifies skill gaps
- Recommends learning paths
- Generates insights

**Example insights:**

```
"You're 20% stronger in technical questions than behavioral.
 Recommended: Practice STAR method for behavioral answers."

"Your scores improved 30% in the last 3 weeks.
 At this rate, you'll be interview-ready in 2 weeks!"
```

#### 5. **Keyword & Concept Extraction** 🔑

File: `app/services/semantic_analyzer.py`

**Uses advanced NLP to:**

- Extract important keywords from answers
- Find relevant concepts mentioned
- Check coverage of expected topics
- Understand context and relationships

**Example:**

```
Answer: "I used React with Redux for state management,
         implemented hooks for side effects, and optimized
         with React.memo for performance"

Extracted Keywords:
- React (framework)
- Redux (state management)
- Hooks (feature)
- React.memo (optimization)

Concepts Identified:
- State Management ✓
- Performance Optimization ✓
- Modern React Features ✓
```

### **How Python Service Connects to Backend:**

The Node.js backend calls Python service via HTTP requests:

```javascript
// In Node.js backend (questionController.js)
const response = await axios.post(
  "http://localhost:8000/api/questions/generate", // Python service URL
  {
    topic: "React",
    difficulty: "intermediate",
    count: 5,
  }
);
```

Python service responds:

```json
{
  "success": true,
  "questions": [
    {
      "id": "q1",
      "text": "Explain the difference between useState and useReducer...",
      "difficulty": "intermediate",
      "expected_keywords": ["state", "reducer", "complex state"],
      "estimated_time": 180
    }
  ]
}
```

---

## 🔄 **Complete User Journey Example**

Let's trace what happens when a user takes an interview:

### **Step 1: User Starts Interview**

```
👤 User clicks "Start Technical Interview" on dashboard

Frontend (React):
  → Sends POST /api/interviews with { type: "technical", topic: "React" }

Backend (Node.js):
  → Creates interview document in MongoDB
  → Decides: Should generate questions or use existing ones?
  → Option A: Gets questions from database (fast)
  → Option B: Calls Python service for AI questions (smarter)

Python Service (if called):
  → Generates 10 contextual questions using OpenAI
  → Returns questions with keywords and evaluation criteria

Backend:
  → Saves questions to interview document
  → Returns interview object to frontend

Frontend:
  → Displays first question
  → Starts video recording
  → Shows timer
```

### **Step 2: User Answers Question**

```
👤 User speaks their answer (video recording)

Frontend:
  → Records video + audio
  → Tracks facial expressions (TensorFlow.js):
    - Eye contact: 75%
    - Confidence: 80%
    - Smile percentage: 60%
  → Transcribes audio to text (speech-to-text)
  → Sends POST /api/interviews/:id/answer with:
    - Answer text
    - Video file
    - Facial metrics

Backend:
  → Uploads video to Cloudinary
  → Saves answer to database
  → Calls evaluation service

Evaluation Service (Node.js):
  → Basic evaluation (keyword matching)
  → Calls Python service for advanced evaluation

Python Service:
  → Semantic similarity analysis
  → Keyword extraction
  → Structure quality check
  → Technical depth assessment
  → Generates detailed feedback
  → Returns score and feedback

Backend:
  → Updates answer with evaluation
  → Updates interview progress
  → Checks if should adjust difficulty
  → Returns evaluation to frontend

Frontend:
  → Shows score and feedback
  → Displays next question (adjusted difficulty if needed)
```

### **Step 3: Interview Completes**

```
👤 User finishes all questions

Backend:
  → Calculates overall score
  → Generates comprehensive report:
    - Average score per topic
    - Strengths and weaknesses
    - Facial metrics summary
    - Time management
    - Improvement suggestions

Python Service (if called):
  → Advanced analytics
  → Trend prediction
  → Learning path recommendation

Frontend:
  → Shows completion screen
  → Displays results
  → Offers PDF export
  → Updates dashboard with new data
```

---

## 📊 **Database Structure (MongoDB)**

### **Collections (like tables):**

1. **Users**

   - User profile info
   - Email, password (hashed)
   - Subscription plan (Free/Premium)
   - Interview quota remaining
   - Profile picture URL
   - Resume URL

2. **UserProfiles**

   - Extended profile data
   - Skills, experience
   - Target companies
   - Career goals
   - Preferences

3. **Interviews**

   - Interview sessions
   - Type (technical, behavioral, etc.)
   - Questions and answers
   - Scores and feedback
   - Video URLs
   - Facial metrics
   - Start/end time
   - Status (in_progress, completed)

4. **Questions**

   - Pre-made question bank
   - Topic, difficulty, type
   - Expected keywords
   - Sample answers
   - Evaluation criteria

5. **CodingChallenges**
   - Coding problems
   - Description, constraints
   - Test cases
   - Solutions
   - Difficulty rating

---

## 🔐 **Security & Authentication**

### **How Login Works:**

1. **Google OAuth (Primary)**

   ```
   User clicks "Login with Google" →
   Redirected to Google →
   User approves →
   Google sends back user info →
   Backend creates/finds user →
   Issues JWT token →
   Frontend stores token →
   Token sent with every request
   ```

2. **JWT Tokens**
   - Secure, encrypted tokens
   - Contains user ID
   - Expires after 7 days
   - Backend verifies token on each request

### **Protected Routes:**

```javascript
// In backend
router.get('/profile', authenticateToken, userController.getProfile);
                       ↑
                  Checks JWT token first
```

---

## 🎯 **Key Features Breakdown**

### **1. Adaptive Difficulty** 🎚️

**Purpose**: Keep users challenged but not frustrated

**How it works:**

- Tracks performance in real-time
- After each answer, calculates new difficulty
- Adjusts next question accordingly
- Can be manually overridden

**Algorithm:**

```
If score > 85% AND improving trend:
  → Increase difficulty
Else if score < 50% AND declining trend:
  → Decrease difficulty
Else if stable (60-80%):
  → Keep same difficulty
```

### **2. Facial Expression Analysis** 😊

**Purpose**: Evaluate non-verbal communication

**Metrics tracked:**

- Eye contact with camera
- Smile frequency
- Head movement (steadiness)
- Looking away from screen
- Overall confidence score

**Uses:**

- TensorFlow.js for face detection
- MediaPipe for landmark tracking
- Calculated in real-time during interview

**Premium Feature!**

### **3. Coding Challenges** 💻

**Purpose**: Test programming skills

**Flow:**

```
1. User selects a coding problem
2. Writes code in Monaco editor
3. Clicks "Run Code"
4. Backend sends to Judge0 API
5. Judge0 executes in sandbox
6. Returns output
7. Backend checks against test cases
8. Shows results (passed/failed)
```

**Safety**: Code runs in Judge0's secure sandbox, not on your server!

### **4. Comprehensive Reports** 📈

**Purpose**: Track progress and improvement

**Includes:**

- Score trends over time
- Performance by topic
- Question type strengths
- Facial metrics summary
- Time management analysis
- Personalized recommendations

**Export formats:**

- PDF (professional looking)
- CSV (for spreadsheets)

---

## 🔧 **Services Explained (Backend)**

### **hybridQuestionService.js**

- **Purpose**: Best of both worlds
- **What it does**:
  - First tries database questions (fast)
  - Falls back to AI if needed
  - Personalizes based on user history

### **evaluationService.js**

- **Purpose**: Score answers
- **What it does**:
  - Keyword matching
  - Completeness check
  - Calls Python for advanced analysis

### **aiQuestionService.js**

- **Purpose**: Generate questions with AI
- **What it does**:
  - Calls OpenAI GPT-4
  - Creates contextual questions
  - Adapts to user level

### **transcriptionService.js**

- **Purpose**: Speech to text
- **What it does**:
  - Converts audio to text
  - Used for evaluating spoken answers

### **grokChatbotService.js**

- **Purpose**: AI assistant
- **What it does**:
  - Answers user questions
  - Provides hints (premium)
  - Encourages user

### **judge0Service.js**

- **Purpose**: Execute code safely
- **What it does**:
  - Sends code to Judge0 API
  - Gets execution results
  - Handles timeouts and errors

### **pdfGenerationService.js**

- **Purpose**: Create reports
- **What it does**:
  - Generates professional PDFs
  - Includes charts and graphs
  - Formats data nicely

---

## 🚀 **How Everything Starts**

### **Starting the Application:**

1. **Start Backend**

   ```bash
   cd server
   npm run dev
   # Runs on http://localhost:5000
   ```

2. **Start Frontend**

   ```bash
   cd client
   npm start
   # Runs on http://localhost:3000
   ```

3. **Start Python Service** (Optional but recommended)
   ```bash
   cd python-service
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python main.py
   # Runs on http://localhost:8000
   ```

### **Environment Variables Needed:**

**Backend (.env):**

```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
RAPIDAPI_KEY=your_rapidapi_key
PYTHON_SERVICE_URL=http://localhost:8000  # For Python service
```

**Frontend (.env):**

```bash
REACT_APP_API_URL=http://localhost:5000
```

**Python Service (.env):**

```bash
PORT=8000
OPENAI_API_KEY=your_openai_key
NODE_API_URL=http://localhost:5000
```

---

## 🎓 **Summary - The Big Picture**

**MockMate** is a 3-tier application:

1. **Frontend (React)**

   - What users interact with
   - Handles UI, video recording, charts
   - Ports: 3000 (dev), 3001 (alternative)

2. **Backend (Node.js)**

   - Main business logic
   - Manages database, auth, file uploads
   - Coordinates all features
   - Port: 5000

3. **Python AI Service (FastAPI)**
   - Specialized AI/ML operations
   - Advanced NLP and analytics
   - Optional but makes evaluation smarter
   - Port: 8000

### **Data Flow:**

```
User → Frontend → Backend → Database (MongoDB)
                     ↓
                Python Service (for AI features)
                     ↓
                OpenAI API (for AI generation)
                     ↓
                Judge0 API (for code execution)
                     ↓
                Cloudinary (for file storage)
```

### **Key Technologies:**

- **Frontend**: React, TailwindCSS, TensorFlow.js
- **Backend**: Node.js, Express, MongoDB, Passport
- **Python**: FastAPI, SpaCy, Transformers, OpenAI
- **External**: Judge0 (code), Cloudinary (files), OpenAI (AI)

### **Main Features:**

1. ✅ AI-powered interview practice
2. ✅ Video recording with facial analysis
3. ✅ Adaptive difficulty
4. ✅ Coding challenges
5. ✅ Comprehensive analytics
6. ✅ Progress tracking
7. ✅ AI chatbot assistant
8. ✅ Detailed feedback
9. ✅ Report exports (PDF/CSV)
10. ✅ Subscription management

---

## 🎯 **Next Steps to Understand More:**

1. **Look at a single feature flow** - Pick one feature (e.g., "Start Interview") and trace the code from frontend → backend → database

2. **Read the documentation files** - Check FEATURE_DOCUMENTATION.md, ADAPTIVE_DIFFICULTY_GUIDE.md

3. **Run the application** - Best way to understand is to use it!

4. **Check the code** - Start with:

   - `client/src/pages/InterviewPage.js` - See how interview UI works
   - `server/src/controllers/interviewController.js` - See backend logic
   - `server/src/services/hybridQuestionService.js` - See question generation

5. **Test API endpoints** - Use Postman or browser to call:
   - http://localhost:5000/api/health - Check if backend is running
   - http://localhost:8000/docs - See Python API documentation

---

**You now understand your entire application! 🎉**

Any specific part you want to dive deeper into? Let me know!
