import React, { createContext, useContext, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setAuthToken } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the token function for API calls
    setAuthToken(getToken);
  }, [getToken]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
