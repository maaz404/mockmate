import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';

const OnboardingTester = () => {
  const { isSignedIn, userId } = useAuth();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testOnboardingEndpoint = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in first");
      return;
    }

    setTesting(true);
    setResult(null);

    const testData = {
      professionalInfo: {
        currentRole: "Test Developer",
        experience: "intermediate",
        industry: "Technology", 
        company: "Test Company",
        targetRoles: ["Senior Developer", "Tech Lead"],
        skills: ["JavaScript", "React", "Node.js"],
      },
      preferences: {
        preferredLanguages: ["English"],
        interviewTypes: ["technical", "behavioral"],
        difficulty: "intermediate",
        sessionDuration: 30,
      },
    };

    try {
      // eslint-disable-next-line no-console
      console.log("Testing onboarding endpoint with:", testData);
      
      const response = await apiService.post("/users/onboarding/complete", testData);
      
      setResult({
        success: true,
        data: response.data,
        message: "✅ Onboarding endpoint working correctly!"
      });
      
      toast.success("Test successful! Onboarding endpoint is working.");
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Onboarding test failed:", error);
      
      setResult({
        success: false,
        error: error.response?.data || error.message,
        message: "❌ Onboarding endpoint failed",
        status: error.response?.status || 'Network Error'
      });
      
      toast.error(`Test failed: ${error.response?.status || 'Network Error'}`);
    } finally {
      setTesting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <h3 className="font-semibold text-yellow-800">⚠️ Onboarding Tester</h3>
        <p className="text-yellow-700">Please sign in to test the onboarding endpoint.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 m-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🧪 Onboarding API Tester
        </h3>
        <span className="text-sm text-gray-500">User: {userId}</span>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600">
          This will test the onboarding endpoint with sample data to make sure everything works.
        </p>

        <button
          onClick={testOnboardingEndpoint}
          disabled={testing}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? "Testing..." : "Test Onboarding Endpoint"}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className="font-semibold mb-2">{result.message}</h4>
            
            {result.success ? (
              <div className="text-sm text-green-800 font-mono">
                <div>✅ Status: Success</div>
                <div>📝 Message: {result.data?.message}</div>
                <div>👤 User ID: {result.data?.user?.clerkId}</div>
                <div>🎯 Profile Updated: {result.data?.user?.onboardingCompleted ? 'Yes' : 'No'}</div>
              </div>
            ) : (
              <div className="text-sm text-red-800 font-mono">
                <div>❌ Status: {result.status}</div>
                <div>🔍 Error: {JSON.stringify(result.error, null, 2)}</div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Test Data Being Sent:</strong>
          <pre className="mt-1 text-xs overflow-x-auto">
{JSON.stringify({
  professionalInfo: {
    currentRole: "Test Developer",
    experience: "intermediate", 
    industry: "Technology",
    company: "Test Company",
    targetRoles: ["Senior Developer"],
    skills: ["JavaScript", "React"]
  },
  preferences: {
    preferredLanguages: ["English"],
    interviewTypes: ["technical", "behavioral"],
    difficulty: "intermediate",
    sessionDuration: 30
  }
}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTester;
