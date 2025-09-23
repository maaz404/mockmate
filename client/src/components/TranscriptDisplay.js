import React, { useState, useEffect } from 'react';
import videoService from '../services/videoService';

const TranscriptDisplay = ({ 
  interviewId, 
  questionIndex, 
  className = '' 
}) => {
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTranscription = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await videoService.getTranscription(interviewId, questionIndex);
        
        if (response.success) {
          setTranscription(response.data.transcription);
        } else {
          setError('Failed to load transcription');
        }
      } catch (err) {
        // Error fetching transcription
        setError('Failed to load transcription');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId && questionIndex !== undefined) {
      fetchTranscription();
    }
  }, [interviewId, questionIndex]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Transcription completed';
      case 'pending':
        return 'Transcribing video...';
      case 'failed':
        return 'Transcription failed';
      case 'not_started':
        return 'No transcription available';
      default:
        return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-gray-600">Loading transcription...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m-7.072 0a5 5 0 010-7.072M9 12h6m-3-3v6" />
            </svg>
            <span>Video Transcript</span>
          </h4>
          <div className="flex items-center space-x-2">
            {getStatusIcon(transcription?.status)}
            <span className="text-xs text-gray-500">
              {getStatusText(transcription?.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {transcription?.status === 'completed' && transcription?.text ? (
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {transcription.text}
              </p>
            </div>
            {transcription.generatedAt && (
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Transcribed on {new Date(transcription.generatedAt).toLocaleString()}
              </div>
            )}
          </div>
        ) : transcription?.status === 'pending' ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-blue-600">Processing transcription...</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments depending on video length
            </p>
          </div>
        ) : transcription?.status === 'failed' ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-600">Transcription failed</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Unable to process the video transcript
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m-7.072 0a5 5 0 010-7.072M9 12h6m-3-3v6" />
            </svg>
            <p className="text-gray-500">No transcript available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptDisplay;