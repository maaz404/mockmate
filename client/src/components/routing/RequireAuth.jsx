import React from "react";
import { useAuthContext } from "../../context/AuthContext";

export default function RequireAuth({ children, fallback = null }) {
  const { loading, isAuthenticated, loginWithGoogle } = useAuthContext();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated)
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <h2>Sign in required</h2>
        <button onClick={loginWithGoogle}>Continue with Google</button>
        {fallback}
      </div>
    );
  return children;
}
