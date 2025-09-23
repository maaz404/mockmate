import { useState, useRef, useCallback, useEffect } from 'react';
import videoService from '../services/videoService';

export const useVideoRecording = (interviewId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const startTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Start video recording session with the backend
  const startSession = useCallback(async () => {
    try {
      setError(null);
      await videoService.startRecordingSession(interviewId);
      setSessionStarted(true);
    } catch (err) {
      setError('Failed to start recording session');
    }
  }, [interviewId]);

  // Start recording for a question
  const startRecording = useCallback(async (stream) => {
    try {
      setError(null);
      recordedChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setHasRecorded(false);
        setRecordingDuration(0);
        startTimeRef.current = Date.now();
        
        // Update duration every second
        durationIntervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
          }
        }, 1000);
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        setHasRecorded(true);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (err) {
      setError('Failed to start recording');
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  // Upload recorded video for a specific question
  const uploadVideo = useCallback(async (questionIndex, facialAnalysisData = null) => {
    if (!hasRecorded || recordedChunksRef.current.length === 0) {
      setError('No recording to upload');
      return false;
    }

    try {
      setIsUploading(true);
      setError(null);

      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      await videoService.uploadVideo(interviewId, questionIndex, blob, recordingDuration, facialAnalysisData);
      
      // Clear recorded data after successful upload
      recordedChunksRef.current = [];
      setHasRecorded(false);
      setRecordingDuration(0);
      
      return true;
    } catch (err) {
      setError('Failed to upload video');
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [interviewId, hasRecorded, recordingDuration]);

  // Clear current recording
  const clearRecording = useCallback(() => {
    recordedChunksRef.current = [];
    setHasRecorded(false);
    setRecordingDuration(0);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return {
    isRecording,
    hasRecorded,
    isUploading,
    recordingDuration,
    error,
    sessionStarted,
    startSession,
    startRecording,
    stopRecording,
    uploadVideo,
    clearRecording
  };
};