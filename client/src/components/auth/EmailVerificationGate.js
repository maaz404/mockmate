import React from "react";

/**
 * EmailVerificationGate - Simplified for session-based auth.
 * Google OAuth handles email verification, so this just renders children.
 * Kept for backward compatibility but can be removed if unused.
 */
const EmailVerificationGate = ({ children }) => {
  // With Google OAuth, email is already verified
  return children;
};

export default EmailVerificationGate;
