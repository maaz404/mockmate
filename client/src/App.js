import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/layout/Layout";
import { LanguageProvider } from "./context/LanguageContext";
import Toast from "./components/ui/Toast";
import ChatbotWidget from "./components/ui/ChatbotWidget";
import AppRoutes from "./routes/AppRoutes";
import { FEATURES } from "./config/features";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <LanguageProvider>
            <Router>
              <Toast />
              <Layout>
                <AppRoutes />
              </Layout>
              {FEATURES.chatbot && <ChatbotWidget />}
            </Router>
          </LanguageProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
