# 🚀 MockMate Features Setup Guide

**All main features have been enabled!** This guide will help you configure and use them.

---

## ✅ What's Been Enabled

### Frontend Features (`client/src/config/features.js`)

- ✅ **Video Recording** - Record interviews
- ✅ **Facial Analysis** - Emotion detection (TensorFlow.js)
- ✅ **AI Questions** - OpenAI-generated questions
- ✅ **Adaptive Difficulty** - Dynamic question difficulty
- ✅ **Coding Challenges** - Code execution with Judge0
- ✅ **Chatbot Assistant** - AI help during practice
- ✅ **Advanced Analytics** - Detailed performance insights
- ✅ **PDF Export** - Export results as PDF
- ✅ **CSV Export** - Export data as CSV
- ✅ **Transcript** - Real-time transcription
- ✅ **Audio Recording** - Voice recording

### Backend Features (`server/src/config/features.js`)

- ✅ All corresponding backend features enabled
- ✅ Advanced API routes uncommented
- ✅ Feature flag checks in controllers

---

## 🔧 Required Configuration

### 1. **OpenAI API Key** (Required for AI Features)

**Features that need it:**

- AI-Generated Questions
- Chatbot Assistant
- Advanced Evaluation

**Setup:**

1. Go to https://platform.openai.com/api-keys
2. Create an account or sign in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to `server/.env`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   OPENAI_MODEL=gpt-4
   ```

**Cost:** ~$0.02-0.10 per interview depending on length

---

### 2. **Cloudinary** (Required for Video Recording)

**Features that need it:**

- Video Recording
- Video Playback

**Setup:**

1. Go to https://cloudinary.com/
2. Sign up for free account (free tier: 25GB storage, 25GB bandwidth/month)
3. Go to Dashboard
4. Copy: Cloud Name, API Key, API Secret
5. Add to `server/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

**Cost:** Free tier sufficient for testing, ~$99/month for production

---

### 3. **Judge0** (Required for Coding Challenges)

**Features that need it:**

- Coding Challenges
- Code Execution

**Setup Option A - RapidAPI (Easiest):**

1. Go to https://rapidapi.com/judge0-official/api/judge0-ce
2. Sign up and subscribe (free tier: 50 requests/day)
3. Copy your RapidAPI key
4. Add to `server/.env`:
   ```env
   JUDGE0_API_KEY=your-rapidapi-key
   JUDGE0_HOST=judge0-ce.p.rapidapi.com
   ```

**Setup Option B - Self-Hosted (Free but complex):**

1. Install Docker
2. Run Judge0:
   ```bash
   docker run -p 2358:2358 judge0/judge0:latest
   ```
3. Add to `server/.env`:
   ```env
   JUDGE0_HOST=http://localhost:2358
   ```

**Cost:** Free tier or self-hosted = free, Pro = $10/month

---

## 🎯 Feature-by-Feature Guide

### 📹 Video Recording

**Status:** ✅ Enabled  
**Requires:** Cloudinary configuration  
**Location:** Interview page, automatically available

**How it works:**

1. User starts interview
2. Browser requests camera permission
3. Video recorded during interview
4. Automatically uploaded to Cloudinary
5. Playback available in results page

**Test it:**

```javascript
// Check if working:
1. Go to interview page
2. Look for camera preview
3. Start interview - recording should begin
4. Complete interview
5. View results - video should be playable
```

---

### 😊 Facial Expression Analysis

**Status:** ✅ Enabled  
**Requires:** Camera permission (no external API)  
**Location:** Interview page, during video recording

**How it works:**

1. TensorFlow.js loads facial detection model
2. Analyzes facial expressions in real-time
3. Detects: confidence, stress, engagement
4. Provides feedback in results

**Test it:**

```javascript
// Check if working:
1. Start interview with camera
2. Look for "Facial Analysis" indicator
3. Complete interview
4. Results should show emotion metrics
```

**Note:** Runs locally in browser, no API costs!

---

### 🤖 AI-Generated Questions

**Status:** ✅ Enabled  
**Requires:** OpenAI API key  
**Location:** Interview creation, question generation

**How it works:**

1. User creates interview with AI option
2. Backend calls OpenAI to generate questions
3. Questions tailored to job role and experience
4. Stored in database

**Test it:**

```javascript
// Check if working:
1. Create new interview
2. Select "AI-Generated Questions" option
3. Questions should be personalized
4. Check console - should see OpenAI API calls
```

---

### 📈 Adaptive Difficulty

**Status:** ✅ Enabled  
**Requires:** No external dependencies  
**Location:** Interview execution, automatic

**How it works:**

1. Monitors user performance
2. Adjusts difficulty based on scores
3. Easier questions if struggling
4. Harder questions if excelling

**API Endpoints:**

- `POST /api/interviews/:id/adaptive-question` - Get next question
- `PATCH /api/interviews/:id/adaptive-difficulty` - Update difficulty

**Test it:**

```javascript
// Check if working:
1. Start interview
2. Answer questions very well → harder questions
3. Answer poorly → easier questions
4. Check difficulty level in questions
```

---

### 💻 Coding Challenges

**Status:** ✅ Enabled  
**Requires:** Judge0 API configuration  
**Location:** Interview with "Coding" type

**How it works:**

1. User gets coding question
2. Types code in browser editor
3. Clicks "Run Code"
4. Code sent to Judge0 for execution
5. Results displayed (output, errors, etc.)

**Test it:**

```javascript
// Check if working:
1. Create interview with type="coding"
2. Get coding question
3. Write code (e.g., console.log("Hello"))
4. Click "Run Code"
5. Should see output
```

---

### 💬 Chatbot Assistant

**Status:** ✅ Already working  
**Requires:** OpenAI API key  
**Location:** Floating button bottom-right

**How it works:**

1. Click chatbot icon (bottom-right)
2. Ask questions about interview prep
3. AI assistant provides guidance
4. Context-aware responses

**Test it:**

- Should see floating chat icon
- Click to open
- Ask: "How do I prepare for behavioral questions?"
- Should get AI response

---

### 📊 Advanced Analytics

**Status:** ✅ Enabled  
**Requires:** No external dependencies  
**Location:** Dashboard, results page

**How it works:**

1. Tracks detailed metrics
2. Performance over time
3. Strengths and weaknesses
4. Comparison with previous interviews

**Features:**

- Score trends
- Category performance
- Time management stats
- Improvement suggestions

---

### 📄 PDF Export

**Status:** ✅ Enabled  
**Requires:** No external dependencies (uses built-in PDF library)  
**Location:** Results page "Export PDF" button

**How it works:**

1. User completes interview
2. Views results
3. Clicks "Export PDF"
4. PDF generated with:
   - Overall scores
   - Question-by-question breakdown
   - Feedback and suggestions
   - Charts and graphs

---

### 📊 CSV Export

**Status:** ✅ Enabled  
**Requires:** No external dependencies  
**Location:** Interview list, results page

**API Endpoint:**

- `GET /api/interviews/:id/metrics/export` - Download CSV

**How it works:**

1. Click "Export CSV"
2. Downloads CSV file with:
   - Interview metadata
   - Question responses
   - Scores
   - Timestamps

---

### 🎤 Transcript / Audio Recording

**Status:** ✅ Enabled  
**Requires:** Browser microphone permission  
**Location:** Interview page

**API Endpoint:**

- `GET /api/interviews/:id/transcripts` - Get transcripts

**How it works:**

1. Browser records audio during interview
2. Speech-to-text transcription (Web Speech API)
3. Transcripts stored with responses
4. Viewable in results

---

## 🔥 Quick Start Checklist

### Minimum Setup (Core Features Only)

- [x] MongoDB running
- [x] JWT secrets in `.env`
- [x] Basic evaluation works ✅

### With AI Features

- [ ] Add `OPENAI_API_KEY` to `server/.env`
- [ ] Restart backend server
- [ ] Test chatbot (should work immediately)
- [ ] Test AI questions (create interview with AI option)

### With Video Recording

- [ ] Sign up for Cloudinary
- [ ] Add credentials to `server/.env`
- [ ] Restart backend server
- [ ] Test camera permissions in browser
- [ ] Start interview and verify recording

### With Coding Challenges

- [ ] Get Judge0 API key from RapidAPI
- [ ] Add to `server/.env`
- [ ] Restart backend server
- [ ] Create coding interview
- [ ] Test code execution

---

## 🧪 Testing Each Feature

### Test Script

```javascript
// Run this in browser console on interview page
const testFeatures = {
  videoRecording: () => console.log("Camera stream:", !!navigator.mediaDevices),
  facialAnalysis: () => console.log("TensorFlow loaded:", !!window.tf),
  chatbot: () =>
    console.log(
      "Chatbot visible:",
      !!document.querySelector('[aria-label="Open AI Assistant"]')
    ),
  transcript: () =>
    console.log(
      "Speech recognition:",
      !!window.SpeechRecognition || !!window.webkitSpeechRecognition
    ),
};

Object.entries(testFeatures).forEach(([name, test]) => {
  console.log(`${name}:`, test());
});
```

---

## ⚠️ Common Issues

### Issue: OpenAI API errors

**Solution:**

1. Check API key is valid
2. Check account has credits
3. Check `OPENAI_API_KEY` in `.env` (no quotes)

### Issue: Video recording not working

**Solution:**

1. Check browser camera permission
2. Check Cloudinary credentials
3. Try HTTPS (camera requires secure context)

### Issue: Coding challenges fail

**Solution:**

1. Check Judge0 API key
2. Check rate limits (free tier: 50/day)
3. Try self-hosted Judge0

### Issue: Features not appearing

**Solution:**

1. Clear browser cache
2. Restart frontend: `npm start`
3. Check feature flags: both frontend & backend

---

## 📝 Environment Variables Summary

Copy `.env.example` to `.env` and fill in:

```env
# Required (Always)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mockmate
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Required for AI Features
OPENAI_API_KEY=sk-your-key

# Required for Video Recording
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret

# Required for Coding Challenges
JUDGE0_API_KEY=your-rapidapi-key
JUDGE0_HOST=judge0-ce.p.rapidapi.com
```

---

## 🚀 Next Steps

1. **Copy `.env.example` to `.env`**

   ```bash
   cp .env.example .env
   ```

2. **Fill in API keys** (at minimum: OPENAI_API_KEY)

3. **Restart servers**

   ```bash
   # Backend
   cd server
   npm run dev

   # Frontend
   cd client
   npm start
   ```

4. **Test features one by one**

   - Start with chatbot (easiest)
   - Then AI questions
   - Then video recording
   - Finally coding challenges

5. **Monitor console for errors**
   - Backend: Check terminal output
   - Frontend: Check browser console (F12)

---

## 💰 Cost Estimates

| Feature           | Setup Cost    | Monthly Cost |
| ----------------- | ------------- | ------------ |
| Basic features    | Free          | Free         |
| AI Questions      | Free (signup) | $5-20        |
| Chatbot           | Free (signup) | $10-30       |
| Video Recording   | Free (signup) | Free-$99     |
| Coding Challenges | Free (50/day) | Free-$10     |
| **Total**         | **Free**      | **$25-150**  |

**For development/testing:** Most have free tiers! ✨

---

## 📚 Additional Resources

- **OpenAI Docs:** https://platform.openai.com/docs
- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Judge0 Docs:** https://ce.judge0.com/
- **Feature Flags:** `server/src/config/features.js`
- **Frontend Config:** `client/src/config/features.js`

---

**Your MockMate application now has ALL main features enabled and ready to use!** 🎉

**Status:** ✅ Features enabled | ⏳ API keys needed | 🚀 Ready to test

Configure the API keys you need, restart the servers, and enjoy the full feature set!
