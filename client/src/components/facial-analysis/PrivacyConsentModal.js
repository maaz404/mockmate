import React, { useState } from "react";
import { motion } from "framer-motion";

const PrivacyConsentModal = ({ isOpen, onConsent, onDecline, _onClose }) => {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [understood, setUnderstood] = useState(false);

  if (!isOpen) return null;

  const canProceed = hasReadTerms && understood;

  const handleAccept = () => {
    if (canProceed) {
      onConsent();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-surface-900">
                Privacy & Consent
              </h2>
              <p className="text-surface-600">Facial Expression Analysis</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* What We Do Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">
              What We Analyze
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Eye contact percentage and gaze direction</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Head movement and posture stability</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Natural blink rate and facial expressions</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Overall confidence and presentation metrics</span>
              </li>
            </ul>
          </div>

          {/* Privacy Protection Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">
              Your Privacy is Protected
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start space-x-2">
                <svg
                  className="w-4 h-4 text-green-600 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  <strong>Local Processing Only:</strong> All analysis happens
                  in your browser - no video data leaves your device
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <svg
                  className="w-4 h-4 text-green-600 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  <strong>No Raw Data Stored:</strong> Only numeric scores and
                  percentages are saved, never facial images or video frames
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <svg
                  className="w-4 h-4 text-green-600 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  <strong>Full Control:</strong> You can disable this feature
                  anytime in your settings
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <svg
                  className="w-4 h-4 text-green-600 mt-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  <strong>Anonymous Analysis:</strong> Facial features are
                  analyzed mathematically, not stored as identifiable data
                </span>
              </li>
            </ul>
          </div>

          {/* How It Helps Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-3">
              How This Helps You
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>
                  Real-time confidence score to track your presentation skills
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>Personalized feedback tips to improve your delivery</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>
                  Session summary with actionable improvement recommendations
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>
                  Track your progress across multiple interview sessions
                </span>
              </li>
            </ul>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasReadTerms}
                onChange={(e) => setHasReadTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-surface-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-surface-700">
                I have read and understand how facial expression analysis works
                and what data is processed.
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-surface-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-surface-700">
                I understand that all processing happens locally in my browser
                and no facial data is transmitted or stored.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-surface-200">
            <button
              onClick={onDecline}
              className="flex-1 px-6 py-3 text-surface-700 bg-surface-100 hover:bg-surface-200 rounded-lg font-medium transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!canProceed}
              className={`flex-1 px-6 py-3 text-white rounded-lg font-medium transition-colors ${
                canProceed
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-surface-400 cursor-not-allowed"
              }`}
            >
              Accept & Enable
            </button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-surface-500 text-center pt-2">
            You can change these preferences anytime in your account settings.
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyConsentModal;
