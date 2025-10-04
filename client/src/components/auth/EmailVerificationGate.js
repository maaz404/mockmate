import React from "react";
import { useUser } from "@clerk/clerk-react";

/**
 * Blocks access to protected content until primary email is verified.
 * Shows resend + refresh controls.
 */
const EmailVerificationGate = ({ children }) => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null; // let outer loading handle it
  const email = user?.primaryEmailAddress;
  const status = email?.verification?.status; // 'verified' | 'unverified' | 'pending' | etc.

  if (status === "verified" || !email) {
    return children;
  }

  async function resend() {
    try {
      await email.prepareVerification({ strategy: "email_code" });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Resend verification failed", e);
    }
  }

  async function refresh() {
    try {
      await user.reload();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("User reload failed", e);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-900 px-4">
      <div className="max-w-md w-full surface-elevated dark:bg-surface-800/50 p-8 text-center">
        <h1 className="text-xl font-semibold mb-3 text-surface-900 dark:text-surface-50">
          Verify your email
        </h1>
        <p className="text-sm text-surface-600 dark:text-surface-300 mb-6">
          We sent a verification code/link to
          <span className="font-medium"> {email.emailAddress}</span>. Complete
          verification to continue.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={resend}
            className="btn-primary py-2 text-sm disabled:opacity-50"
          >
            Resend Verification Email
          </button>
          <button
            onClick={refresh}
            className="btn-secondary py-2 text-sm disabled:opacity-50"
          >
            I Verified – Refresh Status
          </button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 text-[11px] text-surface-500 dark:text-surface-400 font-mono">
            status: {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationGate;