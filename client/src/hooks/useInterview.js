import { useState, useCallback } from "react";
import { interviewService } from "../services/mockmate";
import { toast } from "react-hot-toast";

/**
 * Custom hook for managing interview sessions
 * Handles interview creation, management, and state
 */
export const useInterview = () => {
  const [interviews, setInterviews] = useState([]);
  const [currentInterview, setCurrentInterview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a new interview session
  const createInterview = useCallback(async (interviewData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await interviewService.createInterview(interviewData);

      if (response.success) {
        setCurrentInterview(response.data);
        toast.success("Interview session created successfully!");
        return response.data;
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all user interviews
  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await interviewService.getInterviews();

      if (response.success) {
        setInterviews(response.data);
        return response.data;
      }
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch interviews:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get specific interview
  const fetchInterview = useCallback(async (interviewId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await interviewService.getInterview(interviewId);

      if (response.success) {
        setCurrentInterview(response.data);
        return response.data;
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit interview response
  const submitResponse = useCallback(async (interviewId, responseData) => {
    try {
      setError(null);

      const response = await interviewService.submitResponse(
        interviewId,
        responseData
      );

      if (response.success) {
        toast.success("Response submitted successfully!");
        return response.data;
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Reset interview state
  const resetInterview = useCallback(() => {
    setCurrentInterview(null);
    setError(null);
  }, []);

  return {
    // State
    interviews,
    currentInterview,
    loading,
    error,

    // Actions
    createInterview,
    fetchInterviews,
    fetchInterview,
    submitResponse,
    resetInterview,

    // Utilities
    hasInterviews: interviews.length > 0,
    interviewCount: interviews.length,
  };
};
