# MockMate - AI-Powered Interview Practice Platform

![MockMate Logo](https://img.shields.io/badge/MockMate-v2.0.0-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![UI Status](https://img.shields.io/badge/UI-FinalRound%20Style-purple.svg)

MockMate is a comprehensive AI-powered interview practice application that helps job seekers prepare for technical and behavioral interviews through realistic simulations and detailed feedback.

## 🎨 Recent Updates

Over the past few days we delivered major stability and feature work across the stack:

- UI Polish & Theming
   - Modern dark theme with teal accents, refined typography, and responsive layout
   - Hover-only scrollbars, improved cards, and dashboard-wide consistency
   - Favicons, manifest polish, and accessibility improvements (focus, aria-live)

- Onboarding Experience
   - Presets, smart defaults from recent activity, and live session preview
   - Gentle validation and micro-coaching with an advanced disclosure for facial analysis
   - Autosave + Reset to defaults (one-click) with local persistence

- Coding & Judge0 Integration
   - Secure multi-language execution via Judge0 (RapidAPI) with health endpoint
   - Local JS-only fallback when Judge0 is not configured; UI disables other langs
   - Expanded harnesses: JS/Python/Java; limited C++ support; explicit C guidance
   - API: `/api/coding/health`, `/api/coding/test`, session flows
   - Guide: see JUDGE0_SETUP_GUIDE.md

- Interview Intelligence
   - Adaptive difficulty with history tracking and dynamic next-question selection
   - AI evaluation with robust fallback scoring and follow-up generation
   - Hybrid question generation (templates + AI) with DB fallbacks

- Dev Productivity & Stability
   - Mock auth fallback (development) to run without Clerk tokens
   - Clerk global middleware skipped in mock mode; route-level auth injects test user
   - Clear server health `/api/health` and coding health `/api/coding/health`

📖 Useful docs: [UI Redesign Summary](UI_REDESIGN_SUMMARY.md) • [Judge0 Setup](JUDGE0_SETUP_GUIDE.md) • [Clerk Setup](CLERK_SETUP_GUIDE.md)

## 🚀 Features

- **AI-Generated Questions**: Personalized interview questions based on role, experience, and industry
- **Video Practice**: Record yourself with webcam integration for comprehensive practice
- **Facial Expression Analysis**: Real-time analysis of facial expressions and body language
- **Detailed Feedback**: AI-powered evaluation of responses with actionable insights
- **Performance Analytics**: Track progress over time with comprehensive reports
- **Coding Challenges**: In-browser code editor (Monaco) with multi-language support via Judge0; JS local fallback
- **Multiple Interview Types**: Behavioral, technical, and mixed interview formats
- **User Management**: Secure authentication and profile management

## 🛠️ Tech Stack

### Frontend

- **React.js** - Modern JavaScript library for building user interfaces
- **Tailwind CSS** - Utility-first CSS framework for rapid UI evelopment
- **React Router** - Declarative routing for React applications
- **Axios** - HTTP client for API requests
- **React Hook Form** - Performant forms with easy validation
- **Framer Motion** - Production-ready motion library for React
- **react-hot-toast**, **lucide-react** for UI affordances

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework for Node.js
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - MongoDB object modeling for Node.js
- **Clerk** - Authentication (skipped in dev with mock fallback)
- **OpenAI API** - AI-powered question generation and response evaluation

### Additional Tools

- **WebRTC** - Real-time communication for video/audio recording
- **Face-api.js** - Face detection and expression analysis
- **Monaco Editor** - Code editor for technical interviews
- **Judge0 (RapidAPI)** - Sandboxed code execution (multi-language)
- **Socket.io** - Real-time bidirectional event-based communication
- **Cloudinary** - Cloud-based media management
- **Stripe** - Payment processing for subscriptions

## 📁 Project Structure

```
mockmate/
├── client/                 # React frontend
│   ├── public/            # Public assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── landing/   # 🆕 Landing page sections
│   │   │   │   ├── HeroSection.js
│   │   │   │   ├── TrustBarSection.js
│   │   │   │   ├── FeaturesSection.js
│   │   │   │   ├── TestimonialsSection.js
│   │   │   │   ├── PricingSection.js
│   │   │   │   ├── FAQSection.js
│   │   │   │   └── CTASection.js
│   │   │   ├── layout/    # 🔄 Redesigned layout components
│   │   │   │   ├── Navbar.js (dark theme)
│   │   │   │   └── Footer.js (professional)
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── dashboard/ # Dashboard components
│   │   │   └── ui/        # Shared UI components
│   │   ├── pages/         # Page components
│   │   │   └── HomePage.js # 🆕 Complete redesign
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions
│   │   └── assets/        # Static assets
│   ├── package.json
│   ├── tailwind.config.js # 🔄 Enhanced with dark theme
│   └── index.css         # 🔄 Updated with Inter font
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── services/      # Business logic services
│   │   ├── utils/         # Utility functions
│   │   └── config/        # Configuration files
│   ├── package.json
│   └── .env.example
├── package.json           # Root package.json for workspace management
├── README.md
└── UI_REDESIGN_SUMMARY.md # 🆕 Detailed redesign documentation
```

🆕 = New files | 🔄 = Recently updated

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

## 🚦 API Endpoints (selected)

### Health

- `GET /api/health` - Server health
- `GET /api/coding/health` - Judge0 availability and languages

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Interviews

- `POST /api/interviews` - Create interview session
- `GET /api/interviews` - Get user interviews
- `GET /api/interviews/:id` - Get specific interview

### Questions

- `POST /api/questions/generate` - Generate AI questions

### Reports
### Coding

- `POST /api/coding/test` - Stateless code execution for a predefined challenge
- `POST /api/coding/session` - Create coding session (scoped to an interview)
- `GET /api/coding/session/:sessionId/current` - Get current challenge
- `POST /api/coding/session/:sessionId/submit` - Submit solution
- `POST /api/coding/session/:sessionId/next` - Advance to next challenge
- `GET /api/coding/session/:sessionId/status` - Session progress
- `POST /api/coding/session/:sessionId/complete` - End session

- `POST /api/reports/generate` - Generate performance report
- `GET /api/reports` - Get user reports

## 🎨 UI Components

The application uses a custom design system built with Tailwind CSS:

- **Colors**: Primary (blue), Secondary (purple), Success (green), Warning (yellow), Error (red)
- **Typography**: Inter font family with custom font weights
- **Components**: Cards, buttons, form inputs, modals, and more
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: Focus management, aria-live announcements in onboarding

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
