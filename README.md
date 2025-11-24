# MockMate - AI-Powered Interview Practice Platform

![MockMate Logo](https://img.shields.io/badge/MockMate-v2.0.0-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![UI Status](https://img.shields.io/badge/UI-FinalRound%20Style-purple.svg)

MockMate is a comprehensive AI-powered interview practice application that helps job seekers prepare for technical and behavioral interviews through realistic simulations and detailed feedback.

## 🚀 Recent & Incremental Batches

This project has evolved through iterative "batches" of enhancements. Highlights of the last three batches:

### Batch 1 – Subscription & Core Infrastructure

- Centralized plan configuration (Free = 5 interviews / month, Premium = unlimited via `null`).
- Quota tracking & idempotent consumption (`consumeFreeInterview`) with automatic monthly reset helpers.
- Bootstrap endpoint (`GET /api/bootstrap`) returning `subscription` at root and inside analytics for fast client hydration.
- Dev self-upgrade endpoint (`POST /api/dev/upgrade-self`) for promoting a mock/dev user to premium locally.

### Batch 2 – Adaptive Difficulty & Global Facial Metrics

- Adaptive difficulty seeding + runtime question progression.
- Difficulty history timeline + lightweight sparkline visualization.
- Interview completion stores a global facial metrics snapshot (eyeContact, blinkRate, smilePercentage, headSteadiness, offScreenPercentage, confidenceScore, environmentQuality).
- Premium gating for facial metrics panel.
- Transcript polling endpoint & viewer.

### Batch 3 – Precision Control, Granular Metrics & Export

- Explicit adaptive difficulty override: `PATCH /api/interviews/:id/adaptive-difficulty`.
- Per-question facial metrics ingestion (sent with `submitAnswer`).
- Metrics export: CSV & PDF (`GET /api/interviews/:id/metrics/export[?format=pdf]`).
- Sparkline feature flag via `REACT_APP_ENABLE_SPARKLINE` (default on) + minimum history threshold.
- Per-question difficulty + score logging appended to `difficultyHistory` when manually overridden.

📖 Related docs: [UI Redesign Summary](UI_REDESIGN_SUMMARY.md) • [Judge0 Setup](JUDGE0_SETUP_GUIDE.md) • [Clerk Setup](CLERK_SETUP_GUIDE.md) • [ADAPTIVE_DIFFICULTY_GUIDE.md](ADAPTIVE_DIFFICULTY_GUIDE.md)

## 🚀 Core Features

### 🎯 Interview Experience

- **AI-Generated Questions**: Hybrid question generation combining template-based and AI-powered personalization
- **Multiple Interview Types**: Behavioral, technical, system design, and mixed interview formats
- **Adaptive Difficulty**: Dynamic question progression with manual override capability and visual history
- **Video Practice**: Full webcam integration with recording capabilities
- **Real-Time Transcription**: Live speech-to-text with incremental polling support
- **Follow-Up Questions**: Contextual AI-driven follow-ups based on user responses

### 💡 AI & Intelligence

- **Grok AI Chatbot**: Integrated AI assistant providing real-time coaching and feature guidance
- **Multi-Provider AI**: Support for Anthropic, OpenAI, and xAI with intelligent fallback
- **RAG System**: Retrieval-Augmented Generation for context-aware responses
- **Advanced Analysis**: Multi-dimensional performance scoring with strengths/weaknesses identification
- **Emotion Analysis**: DeepFace-powered facial expression tracking (real-time + session summaries)

### 👨‍💻 Coding Challenges

- **Multi-Language Support**: 70+ languages via Judge0 integration
- **In-Browser IDE**: Monaco Editor with syntax highlighting
- **Automated Testing**: Test case validation and execution
- **Code Review**: AI-powered code quality analysis
- **Local Fallback**: JavaScript execution without external APIs

### 📊 Analytics & Insights

- **Comprehensive Dashboards**: Progress tracking, skill assessment, and goal management
- **Performance Reports**: Detailed session summaries with category breakdowns
- **Facial Metrics**: Per-question and global emotion tracking (eye contact, confidence, head stability)
- **Export Capabilities**: CSV and PDF reports for sharing with recruiters
- **Adaptive Sparklines**: Visual difficulty progression tracking

### 💳 Subscription & Monetization

- **Stripe Integration**: Secure payment processing
- **Tiered Plans**: Free (5 interviews/month) and Premium (unlimited)
- **Quota Management**: Automatic monthly resets with idempotent consumption
- **Premium Features**: Advanced analytics, PDF exports, unlimited interviews

### 🔐 Security & Authentication

- **Clerk Integration**: Enterprise-grade authentication with mock dev fallback
- **Role-Based Access**: User profile management and permissions
- **Secure Sessions**: JWT-based authentication with refresh tokens

## 🛠️ Tech Stack

### Frontend

- **React.js 18** - Modern UI library with hooks and concurrent features
- **Tailwind CSS** - Utility-first CSS with dark mode support
- **React Router v6** - Client-side routing with protected routes
- **Axios** - Promise-based HTTP client
- **Framer Motion** - Advanced animations and transitions
- **Monaco Editor** - VS Code's editor for in-browser coding
- **Recharts** - Composable charting library for analytics
- **React Hook Form** - Performant form validation
- **lucide-react** - Modern icon library
- **react-hot-toast** - Elegant notifications

### Backend

- **Node.js 16+** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Clerk** - Authentication and user management
- **pdfkit** - Server-side PDF generation
- **Bull** - Redis-based queue for background jobs

### AI & Machine Learning

- **Anthropic Claude** - Primary AI provider for question generation
- **OpenAI GPT** - Secondary AI provider
- **xAI Grok** - Chatbot and coaching assistance
- **DeepFace** - Facial emotion recognition (Python microservice)
- **OpenAI Embeddings** - Vector embeddings for RAG

### External Services

- **Judge0 CE** - Multi-language code execution (70+ languages)
- **Stripe** - Payment processing and subscription management
- **Cloudinary** - Video and media storage
- **RapidAPI** - Judge0 API gateway

### Development Tools

- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **nodemon** - Development auto-reload

## 📁 Project Structure

```
mockmate/
├── client/                      # React frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/        # Landing page sections
│   │   │   ├── layout/         # Navbar, Footer, Sidebar
│   │   │   ├── auth/           # Login, Register, Profile
│   │   │   ├── dashboard/      # Analytics widgets
│   │   │   ├── calendar/       # Session scheduling
│   │   │   ├── ui/             # ChatbotWidget, modals
│   │   │   ├── facial-analysis/ # Emotion tracking UI
│   │   │   └── common/         # Reusable components
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── InterviewPage.js           # Main interview conductor
│   │   │   ├── InterviewResultsPage.js    # Detailed results
│   │   │   ├── SessionSummaryPage.js      # Analytics dashboard
│   │   │   ├── CodingChallengeDemo.js     # Code execution demo
│   │   │   ├── ScheduledSessionsPage.js   # Calendar integration
│   │   │   └── QuestionBankPage.js        # Question library
│   │   ├── services/
│   │   │   ├── api.js                     # Axios configuration
│   │   │   ├── interviewService.js        # Interview CRUD
│   │   │   ├── codingService.js           # Judge0 integration
│   │   │   ├── stripeService.js           # Payments
│   │   │   └── emotionService.js          # Facial analysis
│   │   ├── context/
│   │   │   ├── AuthContext.js             # User authentication
│   │   │   └── ThemeContext.js            # Dark/light mode
│   │   ├── hooks/                         # Custom React hooks
│   │   ├── utils/                         # Helper functions
│   │   └── routes/                        # Route configuration
│   └── package.json
├── server/                      # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── interviewController.js     # Core interview logic
│   │   │   ├── codingController.js        # Code execution
│   │   │   ├── stripeController.js        # Subscription webhooks
│   │   │   └── chatbotController.js       # Grok AI endpoints
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Interview.js               # Interview sessions
│   │   │   ├── CodingSession.js           # Code challenges
│   │   │   ├── Subscription.js            # Stripe subscriptions
│   │   │   └── Question.js                # Question templates
│   │   ├── services/                      # 🔥 Core business logic
│   │   │   ├── aiProviders/               # Multi-provider AI
│   │   │   │   ├── anthropicProvider.js
│   │   │   │   ├── openaiProvider.js
│   │   │   │   └── xaiProvider.js
│   │   │   ├── advancedAnalysisService.js # Performance scoring
│   │   │   ├── advancedFeedbackService.js # Detailed evaluations
│   │   │   ├── aiQuestionService.js       # AI question generation
│   │   │   ├── codingChallengeService.js  # Code challenge logic
│   │   │   ├── codeReviewService.js       # AI code analysis
│   │   │   ├── embeddingService.js        # Vector embeddings
│   │   │   ├── emotionService.js          # Emotion aggregation
│   │   │   ├── evaluationService.js       # Answer scoring
│   │   │   ├── grokChatbotService.js      # AI chatbot
│   │   │   ├── hybridQuestionService.js   # Template + AI questions
│   │   │   ├── judge0Service.js           # Code execution
│   │   │   ├── pdfGenerationService.js    # PDF reports
│   │   │   ├── ragService.js              # RAG for chatbot
│   │   │   ├── sessionSummaryService.js   # Analytics
│   │   │   ├── stripeService.js           # Payments
│   │   │   ├── transcriptionService.js    # Speech-to-text
│   │   │   └── translationService.js      # Multi-language
│   │   ├── routes/                        # Express routes
│   │   ├── middleware/
│   │   │   ├── auth.js                    # JWT validation
│   │   │   ├── proPlan.js                 # Subscription checks
│   │   │   └── errorHandler.js
│   │   ├── data/
│   │   │   ├── questionTemplates.json     # 19+ role templates
│   │   │   └── codingChallenges.json      # Predefined challenges
│   │   ├── scripts/
│   │   │   └── validateTemplates.js       # Template validator
│   │   └── config/                        # Environment configs
│   └── package.json
├── server/emotion_service/      # 🐍 Python microservice
│   ├── app.py                   # Flask API for DeepFace
│   └── requirements.txt         # Python dependencies
├── subscriptionPlans.json       # Stripe plan configuration
└── README.md
```

🔥 = Critical services | 🐍 = Python microservice

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mockmate
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   npm install

   # Install all project dependencies
   npm run install:all
   ```

3. **Environment Setup**

   ```bash
   # Copy environment file
   cd server
   cp .env.example .env
   ```

   Edit `server/.env` with your configuration (minimal for dev):

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=<your mongodb uri>
   CLIENT_URL=http://localhost:3000

   # Dev auth fallback (no Clerk required in dev)
   MOCK_AUTH_FALLBACK=true

   # Optional: Judge0 for multi-language code execution
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   RAPIDAPI_KEY=<your rapidapi key>

   # Optional: OpenAI
   OPENAI_API_KEY=<your openai api key>
   ```

4. **Start Development Servers**

   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start individually
   npm run client:dev    # Frontend only (http://localhost:3000)
   npm run server:dev    # Backend only (http://localhost:5000)
   ```

## 📝 Available Scripts

### Root Level

- `npm run dev` - Start both client and server in development mode
- `npm run install:all` - Install dependencies for both client and server
- `npm run client:dev` - Start only the frontend development server
- `npm run server:dev` - Start only the backend development server

### Client

- `npm start` - Start the React development server
- `npm run build` - Create production build
- `npm test` - Run tests

### Server

- `npm run dev` - Start server with nodemon for development
- `npm start` - Start server in production mode
- `npm test` - Run server tests

## 🔧 Configuration

### Environment Variables

#### Server (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mockmate

MOCK_AUTH_FALLBACK=true # dev only to bypass Clerk

# Judge0 (optional for multi-language code execution)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
RAPIDAPI_KEY=your_rapidapi_key

# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key

# Feature Flags / Performance
ENABLE_ADAPTIVE_SPARKLINE=true
SPARKLINE_MIN_POINTS=3

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Database Setup

1. **Local MongoDB**

   - Install MongoDB Community Edition
   - Start MongoDB service
   - Create a database named 'mockmate'

2. **MongoDB Atlas (Cloud)**
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a cluster and get connection string
   - Add your IP address to whitelist
   - Update MONGODB_URI in .env file

## 🔧 Core Modules

### 1. 🎯 Hybrid Question Service

**File**: `server/src/services/hybridQuestionService.js`

Intelligent question generation combining template-based and AI-powered approaches:

- 19+ job role templates (software engineer, data analyst, cloud architect, etc.)
- Role normalization with alias support
- Difficulty-aware question selection
- Category balancing (technical, behavioral, system design)
- Fallback handling for unknown roles
- Question validation and deduplication

### 2. 🤖 Multi-Provider AI System

**Directory**: `server/src/services/aiProviders/`

- **Anthropic Claude**: Primary provider for question generation and evaluation
- **OpenAI GPT**: Secondary provider with automatic fallback
- **xAI Grok**: Specialized for chatbot and real-time coaching
- Unified interface with error handling
- Rate limit management
- Cost tracking per provider

### 3. 💬 Grok AI Chatbot

**File**: `server/src/services/grokChatbotService.js`

Context-aware AI assistant:

- Real-time interview coaching
- Feature guidance and onboarding
- User context integration (role, experience, current page)
- Conversation history management
- Streaming response support
- RAG integration for accurate answers

### 4. 🔍 RAG Service (Retrieval-Augmented Generation)

**File**: `server/src/services/ragService.js`

Enhances chatbot accuracy with document retrieval:

- Vector embeddings using OpenAI
- In-memory vector store (FAISS-like)
- Cosine similarity search
- Document chunking and indexing
- Source citation in responses

### 5. 😊 Emotion Analysis Service

**Files**: `server/emotion_service/app.py` + `server/src/services/emotionService.js`

DeepFace-powered facial expression tracking:

- Real-time emotion detection (Flask microservice)
- Per-question metrics (eye contact, confidence, smile)
- Session-level aggregation
- Emotion timeline generation
- Premium-gated analytics

### 6. 💻 Coding Challenge Service

**File**: `server/src/services/codingChallengeService.js`

Comprehensive code execution and evaluation:

- 70+ language support via Judge0
- Test case validation
- Execution time tracking
- Memory usage monitoring
- AI-powered code review
- Local JavaScript fallback

### 7. 📊 Advanced Analysis Service

**File**: `server/src/services/advancedAnalysisService.js`

Multi-dimensional performance evaluation:

- Skill assessment across categories
- Time management analysis
- Difficulty progression tracking
- Strengths and weaknesses identification
- Personalized action plans
- Readiness score calculation
- Benchmark comparisons

### 8. 📈 Session Summary Service

**File**: `server/src/services/sessionSummaryService.js`

Comprehensive session analytics:

- Aggregate score calculations
- Category performance breakdown
- Response time analysis
- Performance highlights
- Overall assessment and recommendations

### 9. 💳 Stripe Integration

**File**: `server/src/services/stripeService.js`

Complete subscription management:

- Customer creation and management
- Subscription lifecycle handling
- Webhook processing
- Quota tracking and resets
- Payment intent creation
- Invoice management

### 10. 📝 Transcription Service

**File**: `server/src/services/transcriptionService.js`

Real-time speech-to-text:

- Incremental transcript updates
- Timestamp synchronization
- Multi-format support
- Browser-based Web Speech API integration
- Polling endpoint for live updates

## 🚦 API Endpoints

### Health & Configuration

- `GET /api/health` - Server health check
- `GET /api/bootstrap` - Client hydration (auth, subscription, analytics)
- `GET /api/coding/health` - Judge0 status and supported languages

### Authentication (Clerk)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get authenticated user
- `POST /api/auth/logout` - User logout

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/dev/upgrade-self` - (Dev) Upgrade to premium

### Interviews

- `POST /api/interviews` - Create interview session
- `GET /api/interviews` - Get user interviews
- `GET /api/interviews/:id` - Get specific interview
- `PUT /api/interviews/:id/start` - Start interview (activates quota & timing)
- `POST /api/interviews/:id/answer/:questionIndex` - Submit answer or skip
  - Answer: `{ answer: string, timeSpent?, facialMetrics? }`
  - Skip: `{ skip: true, timeSpent? }`
- `POST /api/interviews/:id/followup/:questionIndex` - Generate follow-up questions
- `POST /api/interviews/:id/adaptive-question` - Fetch adaptive question
- `PATCH /api/interviews/:id/adaptive-difficulty` - Override difficulty
- `POST /api/interviews/:id/complete` - Complete interview (save metrics)
- `GET /api/interviews/:id/transcripts` - Poll transcripts
- `GET /api/interviews/:id/metrics/export` - Export CSV
- `GET /api/interviews/:id/metrics/export?format=pdf` - Export PDF

### Chatbot (Grok AI)

- `POST /api/chatbot/chat` - Send message to AI assistant
- `GET /api/chatbot/suggestions` - Get contextual suggestions
- `POST /api/chatbot/feedback` - Submit feedback on responses

### Questions

- `POST /api/questions/generate` - Generate AI questions
- `GET /api/questions/templates` - Get role templates
- `GET /api/questions/bank` - Browse question library

### Coding Challenges

- `POST /api/coding/test` - Test code execution
- `POST /api/coding/session` - Create coding session
- `GET /api/coding/session/:id/current` - Get current challenge
- `POST /api/coding/session/:id/submit` - Submit solution
- `POST /api/coding/session/:id/next` - Advance to next
- `GET /api/coding/session/:id/status` - Session progress
- `POST /api/coding/session/:id/complete` - End session

### Reports & Analytics

- `POST /api/reports/generate` - Generate performance report
- `GET /api/reports` - Get user reports
- `GET /api/reports/:id/session-summary` - Comprehensive analytics
- `GET /api/reports/:id/export-pdf` - PDF export (Premium)

## 🎨 UI Components

The application uses a custom design system built with Tailwind CSS:

- **Colors**: Primary (blue), Secondary (purple), Success (green), Warning (yellow), Error (red)
- **Typography**: Inter font family with custom font weights
- **Components**: Cards, buttons, form inputs, modals, and more
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: Focus management, aria-live announcements in onboarding

## 📊 Subscription & Quotas

| Plan    | Monthly Interviews | Marker                             |
| ------- | ------------------ | ---------------------------------- |
| Free    | 5                  | Numeric countdown (resets monthly) |
| Premium | Unlimited          | `interviewsRemaining: null`        |

`consumeFreeInterview()` is idempotent & safe against double-start races. Use `GET /api/bootstrap` to retrieve the current plan & remaining quota.

Dev upgrade (mock mode):

```bash
curl -X POST http://localhost:5000/api/dev/upgrade-self \\
   -H "Authorization: Bearer test"
```

## 🧠 Adaptive Difficulty & Scoring

Heuristic thresholds (simplified):

- Score < 45 → Recommend easier
- Score ≥ 75 → Recommend harder
- Mid-range → Stay same

History entry shape:

```json
{
  "questionIndex": 2,
  "difficulty": "intermediate",
  "score": 68,
  "timestamp": "2025-10-07T12:34:56.000Z"
}
```

Manual override appends `{ score: null }` preserving an auditable trail.

## 🪞 Facial Metrics

Two levels of capture:

- Global snapshot (on completion): `interview.metrics.{ eyeContactScore, blinkRate, smilePercentage, headSteadiness, offScreenPercentage, environmentQuality, confidenceScore }`
- Per-question (on answer): `questions[n].facial.{ eyeContact, blinkRate, smilePercentage, headSteadiness, offScreenPercentage, confidenceScore, capturedAt }`

Premium-only panels in the UI surface live metrics and the adaptive difficulty sparkline (configurable via `REACT_APP_ENABLE_SPARKLINE`).

## 📤 Metrics Export

CSV Example:

```csv
questionIndex,category,difficulty,score,timeSpent,eyeContact,blinkRate,smilePercentage,headSteadiness,offScreen,confidence
0,"technical",intermediate,62,55,0.82,18,24,0.91,0.03,0.74
```

Client consumption hint (React):

```js
const blob = await adaptiveService
  .exportMetricsCsv(interviewId)
  .then((r) => r.data);
// createObjectURL & download
```

PDF export is a lightweight tabular report (no external rendering service needed).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Maaz Sheikh**

- Final Year Project - MockMate
- AI-Powered Interview Preparation Platform

## 🙏 Acknowledgments

- OpenAI for providing the GPT API
- React community for excellent documentation
- Tailwind CSS for the amazing utility-first framework
- All open-source contributors who made this project possible

---

**Happy Interviewing! 🎯**
