# Clerk Authentication Setup Guide 🔐

## ⚠️ Current Issue: OAuth Callback Error

You're getting the error `This site can't be reached` with `clerk.shared.lcl.dev` because the Clerk keys are not properly configured for your domain.

## 🚀 Quick Fix - Option 1: Use Your Own Clerk Account (Recommended)

### Step 1: Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### Step 2: Get Your Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_...`)
3. Copy your **Secret Key** (starts with `sk_test_...`)

### Step 3: Update Environment Files

**Client (.env file):**

```bash
# Replace with your actual Clerk keys
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
```

**Server (.env file):**

```bash
# Replace with your actual Clerk keys
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
```

### Step 4: Configure OAuth Providers in Clerk

1. In Clerk dashboard, go to **User & Authentication > Social Connections**
2. Enable **Google** provider
3. Add these redirect URLs:
   - `http://localhost:3000`
   - `http://localhost:3001` (if using different port)
   - Your production domain when deploying

### Step 5: Restart Your Application

```bash
# Stop the current server and client
# Then restart both:
cd server && npm start
cd client && npm start
```

## 🛠️ Quick Fix - Option 2: Use Test Mode (Temporary)

If you want to test the app quickly without setting up Clerk:

### Update App.js to Skip Authentication

Add this temporary code to `src/App.js`:

```javascript
// Temporary: Skip Clerk for testing
const SKIP_AUTH = true;

if (SKIP_AUTH) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <strong>Development Mode:</strong> Authentication is temporarily
          disabled for testing.
        </div>
        <Router>
          <AuthProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* Add other routes as needed */}
              </Routes>
            </Layout>
          </AuthProvider>
        </Router>
      </div>
    </div>
  );
}
```

## 🔧 Troubleshooting Common Issues

### Issue 1: "This site can't be reached"

**Cause**: Clerk redirect URLs not configured properly  
**Solution**: Add your localhost URLs in Clerk dashboard under Social Connections

### Issue 2: "Invalid publishable key"

**Cause**: Using placeholder or expired keys  
**Solution**: Get fresh keys from Clerk dashboard

### Issue 3: "Clerk is not defined"

**Cause**: Environment variables not loaded  
**Solution**: Restart development server after updating .env

### Issue 4: CORS errors

**Cause**: Domain mismatch between frontend and Clerk  
**Solution**: Ensure domains match in Clerk settings

## 📋 Clerk Dashboard Configuration Checklist

### Application Settings

- [ ] Application name: MockMate
- [ ] Instance type: Development/Production
- [ ] Domain: `localhost:3000` (development)

### Social Connections (Google OAuth)

- [ ] Google provider enabled
- [ ] Client ID configured
- [ ] Client secret configured
- [ ] Redirect URLs added:
  - `http://localhost:3000`
  - `http://localhost:3001`

### API Keys

- [ ] Publishable key copied to client `.env`
- [ ] Secret key copied to server `.env`
- [ ] Keys are not placeholder values

### JWT Configuration

- [ ] JWT template configured (if using custom claims)
- [ ] Session settings configured

## 🌐 Environment Files Setup

**Client `.env` (required):**

```bash
# Get these from https://clerk.com/dashboard
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here

# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_BASE_URL=http://localhost:5000/api

# App Configuration
REACT_APP_APP_NAME=MockMate
REACT_APP_VERSION=1.0.0
```

**Server `.env` (required):**

```bash
# Get this from https://clerk.com/dashboard
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mockmate

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your_openai_key_here
```

## 🚀 Production Deployment

When deploying to production:

1. **Update Clerk Settings:**

   - Add production domain to redirect URLs
   - Switch to production keys
   - Update CORS settings

2. **Update Environment Variables:**

   - Use production Clerk keys
   - Update API URLs to production endpoints
   - Set secure JWT secrets

3. **Security Considerations:**
   - Enable HTTPS
   - Configure proper CORS policies
   - Set up rate limiting
   - Enable Clerk's security features

## 📞 Need Help?

If you're still having issues:

1. **Check Clerk Status**: [https://status.clerk.com](https://status.clerk.com)
2. **Clerk Documentation**: [https://clerk.com/docs](https://clerk.com/docs)
3. **Community Support**: [Clerk Discord](https://clerk.com/discord)

## 🎯 Quick Start Commands

```bash
# 1. Set up Clerk account and get keys
# 2. Update .env files with your keys
# 3. Restart servers

cd server
npm start

# In another terminal
cd client
npm start
```

The authentication should work perfectly once you have your own Clerk keys configured! 🚀
