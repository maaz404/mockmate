import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";

const AuthContext = createContext();

// OPTIMIZATION: Define constants
const AUTH_CHECK_RETRY_DELAY = 2000; // 2 seconds
const MAX_AUTH_CHECK_RETRIES = 3;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Exposed via context for error displays
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);

  // IMPROVEMENT: Memoized fetch function with retry logic
  const fetchMe = useCallback(async (isRetry = false) => {
    // Don't show loading spinner on retry attempts
    if (!isRetry) {
      setLoading(true);
    }
    
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/auth/me`,
        { 
          withCredentials: true,
          timeout: 5000, // 5 second timeout
        }
      );
      
      if (res.data.authenticated) {
        setUser(res.data.user);
        setError(null);
        retryCountRef.current = 0; // Reset retry count on success
      } else {
        setUser(null);
      }
    } catch (e) {
      // IMPROVEMENT: Better error handling
      if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
        // Server is down or unreachable
        if (retryCountRef.current < MAX_AUTH_CHECK_RETRIES && !isRetry) {
          retryCountRef.current += 1;
          // OPTIMIZATION: Retry with exponential backoff
          retryTimeoutRef.current = setTimeout(() => {
            fetchMe(true);
          }, AUTH_CHECK_RETRY_DELAY * retryCountRef.current);
          
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn(`Auth check failed, retrying (${retryCountRef.current}/${MAX_AUTH_CHECK_RETRIES})...`);
          }
        } else {
          setError('Unable to connect to server. Please check your connection.');
        }
      } else if (e.response?.status === 401) {
        // Not authenticated - this is expected for logged out users
        setUser(null);
        setError(null);
      } else {
        // Other errors
        setError(e.message);
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
    
    // CLEANUP: Clear any pending retry timeouts
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchMe]);

  const loginWithGoogle = () => {
    // Redirect to backend OAuth entrypoint; relies on same-origin API base
    window.location.href = `${process.env.REACT_APP_API_BASE_URL}/auth/google`;
  };

    // Local sign in
    const loginWithEmail = async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/auth/signin`,
          { email, password },
          { withCredentials: true }
        );
        if (res.data.user) {
          setUser(res.data.user);
          setError(null);
        } else {
          setUser(null);
          setError(res.data.message || 'Sign in failed');
        }
      } catch (e) {
        setUser(null);
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };

    // Local sign up
    const signupWithEmail = async (email, password, firstName, lastName) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/auth/signup`,
          { email, password, firstName, lastName },
          { withCredentials: true }
        );
        if (res.data.user) {
          setUser(res.data.user);
          setError(null);
        } else {
          setUser(null);
          setError(res.data.message || 'Sign up failed');
        }
      } catch (e) {
        setUser(null);
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };

  const logout = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (e) {
      // IMPROVEMENT: Log but don't throw - still clear local state
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Logout error:', e);
      }
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    loading,
    error, // IMPROVEMENT: Expose error state for UI feedback
    loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
    logout,
    refresh: fetchMe,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};

// Default export for backwards compatibility
export default AuthProvider;
