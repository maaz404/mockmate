import React, { useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import AuthLoadingSpinner from "../../components/ui/AuthLoadingSpinner";

const LoginPage = () => {
  const { user, loginWithGoogle, loginWithEmail, loading, error } =
    useAuthContext();
  const navigate = useNavigate();

  // BUGFIX: If already logged in, redirect to dashboard
  // Note: navigate is stable in React Router v6, but we include it to satisfy eslint
  // Only trigger redirect when user changes from null to authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]); // Deliberately omit navigate - it's stable

  // Local form state (must be at top level, not inside any condition)
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  if (loading) {
    return <AuthLoadingSpinner message="Initializing authentication..." />;
  }

  const handleLocalLogin = (e) => {
    e.preventDefault();
    loginWithEmail(email, password);
  };

  if (loading) {
    return <AuthLoadingSpinner message="Initializing authentication..." />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="font-heading mt-6 text-center text-3xl font-bold text-surface-900 dark:text-surface-50">
          Sign in to MockMate
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-300">
          Welcome back to your interview preparation journey
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 dark:bg-surface-800/60 backdrop-blur-sm border border-surface-200 dark:border-surface-700 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 flex flex-col items-center">
          <form
            className="w-full flex flex-col gap-4"
            onSubmit={handleLocalLogin}
          >
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg py-3"
              disabled={loading}
            >
              Sign in
            </button>
          </form>
          <div className="w-full flex items-center my-4">
            <hr className="flex-grow border-surface-300 dark:border-surface-700" />
            <span className="mx-2 text-xs text-surface-500">OR</span>
            <hr className="flex-grow border-surface-300 dark:border-surface-700" />
          </div>
          <button
            onClick={loginWithGoogle}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm normal-case font-medium rounded-lg py-3 transition-all duration-200 flex items-center justify-center"
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
              <g>
                <path
                  fill="#4285F4"
                  d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.69 30.77 0 24 0 14.82 0 6.71 5.13 2.69 12.56l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"
                />
                <path
                  fill="#34A853"
                  d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9.04h12.42c-.54 2.9-2.18 5.36-4.65 7.04l7.18 5.59C43.98 37.13 46.1 31.27 46.1 24.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.67 28.76c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.86 16.18 0 20.01 0 24c0 3.99.86 7.82 2.69 11.29l7.98-6.2z"
                />
                <path
                  fill="#EA4335"
                  d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.18-5.59c-2.01 1.35-4.59 2.14-8.72 2.14-6.38 0-11.87-3.63-13.33-8.76l-7.98 6.2C6.71 42.87 14.82 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </g>
            </svg>
            Sign in with Google
          </button>
          {error && (
            <div className="mt-4 text-red-500 text-sm text-center">{error}</div>
          )}
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-surface-600 dark:text-surface-300">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
