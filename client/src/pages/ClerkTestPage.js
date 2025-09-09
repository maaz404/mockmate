import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

const ClerkTestPage = () => {
  const { isLoaded: authLoaded, isSignedIn, userId, getToken } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const [testResults, setTestResults] = useState({});
  const [apiTest, setApiTest] = useState(null);

  useEffect(() => {
    const runTests = async () => {
      const results = {};

      // Test 1: Environment Variables
      results.envVars = {
        clerkKey: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY
          ? "✅ Present"
          : "❌ Missing",
        apiBase:
          process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api",
      };

      // Test 2: Clerk Initialization
      results.clerk = {
        authLoaded: authLoaded ? "✅ Loaded" : "❌ Not Loaded",
        userLoaded: userLoaded ? "✅ Loaded" : "❌ Not Loaded",
        signedIn: isSignedIn ? "✅ Signed In" : "❌ Not Signed In",
        userId: userId || "None",
      };

      // Test 3: User Data
      if (user) {
        results.user = {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }

      // Test 4: Token Generation
      if (isSignedIn && authLoaded) {
        try {
          const token = await getToken();
          results.token = token ? "✅ Token Generated" : "❌ No Token";
        } catch (error) {
          results.token = `❌ Token Error: ${error.message}`;
        }
      }

      setTestResults(results);
    };

    runTests();
  }, [authLoaded, userLoaded, isSignedIn, userId, user, getToken]);

  // Test API Connection
  const testApiConnection = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/health");
      const data = await response.json();
      setApiTest({
        status: "✅ Connected",
        data,
        statusCode: response.status,
      });
    } catch (error) {
      setApiTest({
        status: "❌ Failed",
        error: error.message,
        statusCode: "N/A",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Clerk Authentication Test
        </h1>

        {/* Environment Variables */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">
            1. Environment Variables
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div>Clerk Key: {testResults.envVars?.clerkKey}</div>
            <div>API Base URL: {testResults.envVars?.apiBase}</div>
            <div className="text-xs text-gray-600 mt-2">
              Key Preview:{" "}
              {process.env.REACT_APP_CLERK_PUBLISHABLE_KEY?.substring(0, 30)}...
            </div>
          </div>
        </div>

        {/* Clerk Status */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">2. Clerk Status</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>Auth Loaded: {testResults.clerk?.authLoaded}</div>
            <div>User Loaded: {testResults.clerk?.userLoaded}</div>
            <div>Signed In: {testResults.clerk?.signedIn}</div>
            <div>User ID: {testResults.clerk?.userId}</div>
            <div>Token: {testResults.token || "Not tested yet"}</div>
          </div>
        </div>

        {/* User Data */}
        {testResults.user && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">3. User Data</h2>
            <div className="space-y-2 font-mono text-sm">
              <div>ID: {testResults.user.id}</div>
              <div>Email: {testResults.user.email}</div>
              <div>
                Name: {testResults.user.firstName} {testResults.user.lastName}
              </div>
            </div>
          </div>
        )}

        {/* API Test */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">4. API Connection Test</h2>
          <button
            onClick={testApiConnection}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
          >
            Test API Connection
          </button>

          {apiTest && (
            <div className="space-y-2 font-mono text-sm">
              <div>Status: {apiTest.status}</div>
              <div>Status Code: {apiTest.statusCode}</div>
              {apiTest.data && (
                <div>Response: {JSON.stringify(apiTest.data, null, 2)}</div>
              )}
              {apiTest.error && (
                <div className="text-red-600">Error: {apiTest.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Browser Info */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">5. Browser Environment</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>URL: {window.location.href}</div>
            <div>User Agent: {navigator.userAgent.substring(0, 100)}...</div>
            <div>Local Storage: {localStorage.length} items</div>
            <div>Cookies Enabled: {navigator.cookieEnabled ? "✅" : "❌"}</div>
          </div>
        </div>

        {/* Console Logs */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Debug Instructions</h2>
          <div className="text-sm space-y-2">
            <p>
              1. <strong>Check Console:</strong> Open DevTools (F12) → Console
              tab
            </p>
            <p>
              2. <strong>Check Network:</strong> DevTools → Network tab → Try to
              sign in
            </p>
            <p>
              3. <strong>Look for errors with:</strong>
            </p>
            <ul className="list-disc ml-6 mt-2">
              <li>clerk.accounts.dev domain</li>
              <li>CORS errors</li>
              <li>401/403 authentication errors</li>
              <li>Network connection failures</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-8">
          <a
            href="/login"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            → Go to Login Page
          </a>
          <a
            href="/"
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default ClerkTestPage;
