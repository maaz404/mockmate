import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api";

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);

    console.log("Submitting password reset request for:", email);

    try {
      const response = await apiService.post("/auth/request-password-reset", {
        email,
      });
      console.log("Password reset response:", response);
      setStatus(
        "If that email exists, a reset link has been sent to your inbox."
      );
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Error sending reset link. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-surface-900 py-12 px-4">
      <div className="bg-white dark:bg-surface-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          Reset your password
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-surface-700 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {status && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-700 dark:text-green-300">
              {status}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-primary-600 hover:underline text-sm"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
