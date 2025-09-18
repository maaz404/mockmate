## 🔐 Quick Fix for Clerk OAuth Error

### The Problem

You're getting a "This site can't be reached" error because the Clerk OAuth callback URL is pointing to `clerk.shared.lcl.dev` which is not accessible.

### Immediate Solution

**Option 1: Set Up Your Own Clerk Account (5 minutes)**

1. **Go to Clerk:** https://clerk.com
2. **Create Account:** Sign up (it's free)
3. **Create Application:**
   - Name: MockMate
   - Choose "React" as framework
4. **Get Keys:** Copy the Publishable Key and Secret Key
5. **Update .env file:**

Update `client/.env`:

```bash
REACT_APP_CLERK_PUBLISHABLE_KEY=your_key_here
```

Update `server/.env` (create if doesn't exist):

```bash
CLERK_SECRET_KEY=your_secret_key_here
```

6. **Configure OAuth:**

   - In Clerk Dashboard → Social Connections → Enable Google
   - Add redirect URL: `http://localhost:3000`

7. **Restart servers:**

```bash
# Stop current servers and restart
cd server && npm start
cd client && npm start
```

**Option 2: Use Development Mode (Immediate fix)**

If you want to test the app immediately without setting up Clerk:

1. **Add this to the top of `src/App.js`:**

```javascript
// Set to true to skip authentication for testing
const DEVELOPMENT_MODE = true;

if (DEVELOPMENT_MODE) {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3">
          <strong>Development Mode:</strong> Authentication disabled for testing
        </div>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/comprehensive-dashboard"
              element={<ComprehensiveDashboard />}
            />
            <Route
              path="/interview/create"
              element={<InterviewCreationPage />}
            />
            <Route path="/settings" element={<EnhancedSettingsPage />} />
          </Routes>
        </Layout>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}
```

### Why This Happens

- Clerk keys are placeholder/test values
- OAuth redirect URLs not configured for localhost
- Test environment pointing to invalid domains

### Production Notes

- Always use your own Clerk keys in production
- Configure proper domain redirects
- Enable HTTPS for production deployments

Need help? The setup process is very straightforward and takes just a few minutes!
