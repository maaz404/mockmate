import React from "react";
import RequireAuth from "../routing/RequireAuth.jsx";

// Thin wrapper maintained for backward-compatibility with existing imports
const ProtectedRoute = ({ children, fallback = null }) => {
  return <RequireAuth fallback={fallback}>{children}</RequireAuth>;
};

export default ProtectedRoute;
