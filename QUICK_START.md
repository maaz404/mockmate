# 🚀 MockMate Quick Start Guide

**Ready to test your simplified application? Follow these steps!**

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Verify MongoDB is Running

```powershell
# Check if MongoDB is running
mongosh --eval "db.serverStatus()"

# If not running, start it:
# mongod --dbpath C:\data\db
```

✅ You should see: `"ok": 1`

---

### Step 2: Setup Environment Variables

**Backend `.env` file:**

```powershell
cd server
notepad .env
```

Add these lines:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mockmate
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
NODE_ENV=development
```

**Frontend `.env` file:**

```powershell
cd client
notepad .env
```

Add these lines:

```
REACT_APP_API_BASE=http://localhost:5000/api
REACT_APP_ENV=development
```

---

### Step 3: Install Dependencies

```powershell
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ..\client
npm install
```

---

### Step 4: Seed Question Bank

```powershell
cd ..\server
node src/scripts/seedQuestions.js
```

✅ You should see: "✅ Successfully seeded X questions"

---

### Step 5: Start the Application

**Terminal 1 - Backend:**

```powershell
cd server
npm run dev
```

✅ You should see:

- "Server running on port 5000"
- "MongoDB connected successfully"

**Terminal 2 - Frontend:**

```powershell
cd client
npm start
```

✅ Browser should open at http://localhost:3000

---

## 🧪 Quick Test (2 minutes)

### Test 1: Register a User

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPass123!
4. Click "Register"

✅ You should be redirected to dashboard

---

### Test 2: Create an Interview

1. Click "Create Interview" or go to /interviews/create
2. Select:
   - Job Role: Software Engineer
   - Experience: Intermediate
   - Type: Technical
   - Questions: 5
3. Click "Create Interview"

✅ You should see 5 questions

---

### Test 3: Answer Questions

1. Click "Start Interview"
2. Type an answer (50+ words recommended):
   ```
   REST API is an architectural style for building web services
   that uses HTTP requests to access and manipulate resources.
   It follows principles like statelessness and client-server
   architecture.
   ```
3. Click "Submit Answer"

✅ You should see:

- Score (e.g., 75/100)
- Feedback with strengths and improvements
- Next question appears

---

### Test 4: Complete & View Results

1. Answer remaining questions
2. Click "Complete Interview"
3. View results page

✅ You should see:

- Overall score
- Per-question breakdown
- Feedback for each answer
- Time statistics

---

## 📖 Documentation Reference

After testing, explore these guides:

| Guide                               | When to Use                 |
| ----------------------------------- | --------------------------- |
| **SIMPLIFICATION_COMPLETE.md**      | Overview of everything done |
| **BACKEND_FRONTEND_INTEGRATION.md** | Understanding how it works  |
| **TESTING_CHECKLIST.md**            | Comprehensive testing       |
| **QUICK_REFERENCE.md**              | Development reference       |
| **SIMPLIFICATION_SUMMARY.md**       | Deep technical details      |

---

## 🐛 Something Not Working?

### MongoDB Connection Error

```powershell
# Start MongoDB
mongod --dbpath C:\data\db
```

### Frontend Can't Reach Backend

Check `.env` files have correct URLs:

- Backend: `PORT=5000`
- Frontend: `REACT_APP_API_BASE=http://localhost:5000/api`

### No Questions Appearing

```powershell
cd server
node src/scripts/seedQuestions.js
```

### JWT Authentication Error

Check `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in `server/.env`

---

## ✅ Success Indicators

You're all set if you see:

- ✅ No console errors in browser
- ✅ No errors in backend terminal
- ✅ MongoDB connected message
- ✅ User can register and login
- ✅ Interviews can be created
- ✅ Answers are evaluated with scores
- ✅ Results page shows feedback

---

## 🎉 You're Ready!

Your simplified MockMate application is running!

**What's Working:**

- ✅ 2-tier architecture (React + Node.js)
- ✅ Simple keyword-based evaluation
- ✅ Feature flags for future enhancements
- ✅ Zero Python dependencies
- ✅ Complete authentication
- ✅ Interview management
- ✅ Results and dashboard

**Next Steps:**

1. Follow TESTING_CHECKLIST.md for thorough testing
2. Enable features via feature flags as needed
3. Deploy to production when ready

---

**Need Help?** Check the comprehensive documentation in:

- SIMPLIFICATION_COMPLETE.md
- BACKEND_FRONTEND_INTEGRATION.md
- TESTING_CHECKLIST.md

**Happy Coding! 🚀**
