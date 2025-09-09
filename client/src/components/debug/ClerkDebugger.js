// Debugging Clerk Issues - Add this temporarily to your App.js

import { useAuth, useUser } from "@clerk/clerk-react";

// Add this component to debug Clerk state
const ClerkDebugger = () => {
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  // eslint-disable-next-line no-console
  console.log("🔍 Clerk Debug Info:", {
    authLoaded,
    isSignedIn,
    userId,
    userLoaded,
    user: user
      ? { id: user.id, email: user.primaryEmailAddress?.emailAddress }
      : null,
    clerkKey: `${process.env.REACT_APP_CLERK_PUBLISHABLE_KEY?.substring(
      0,
      20
    )}...`,
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "white",
        padding: "10px",
        border: "1px solid #ccc",
        fontSize: "12px",
        zIndex: 9999,
      }}
    >
      <strong>Clerk Status:</strong>
      <br />
      Auth Loaded: {authLoaded ? "✅" : "❌"}
      <br />
      User Loaded: {userLoaded ? "✅" : "❌"}
      <br />
      Signed In: {isSignedIn ? "✅" : "❌"}
      <br />
      User ID: {userId || "None"}
    </div>
  );
};

export default ClerkDebugger;
