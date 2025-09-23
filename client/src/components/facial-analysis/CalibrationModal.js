import React from 'react';
import { motion } from 'framer-motion';

const CalibrationModal = ({ 
  isOpen, 
  onClose, 
  progress = 0, 
  onStart,
  isCalibrating = false 
}) => {
  if (!isOpen) return null;

  const formatProgress = (prog) => Math.round(prog);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isCalibrating ? 'Calibrating...' : 'Facial Expression Analysis Setup'}
            </h3>
            
            {!isCalibrating ? (
              <>
                <p className="text-gray-600 mb-4">
                  We'll analyze your facial expressions and delivery during the interview to provide personalized feedback.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">What we'll measure:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Eye contact percentage</li>
                    <li>• Head stability and posture</li>
                    <li>• Natural blink rate</li>
                    <li>• Facial expressions</li>
                    <li>• Overall confidence score</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-green-800">
                      <p className="font-medium">Privacy Protected</p>
                      <p>All analysis happens locally in your browser. No video data is transmitted or stored.</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">
                  First, we need a 10-second calibration to establish your baseline. Look directly at the camera and remain still.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Please look directly at the camera and remain still for calibration.
                </p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Calibration Progress</span>
                    <span>{formatProgress(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </motion.div>
                  <span className="text-sm">Analyzing your baseline...</span>
                </div>
              </>
            )}
            
            <div className="flex space-x-3 mt-6">
              {!isCalibrating ? (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={onStart}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Start Calibration
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  disabled={progress < 100}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  Please wait...
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CalibrationModal;