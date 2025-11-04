import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import LoadingSpinner from "../ui/LoadingSpinner";
import OnboardingModal from "../onboarding/OnboardingModal";

const Layout = ({ children }) => {
  const location = useLocation();
  const { loading, refreshProfile } = useAuthContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Show loading spinner while auth is loading
  if (loading && location.pathname !== "/") {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <>
      {/* Sidebar - Always visible in Layout */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main content area with proper margin for sidebar and background */}
      <div
        className={`min-h-screen transition-all duration-300 bg-surface-50 dark:bg-gradient-to-br dark:from-surface-900 dark:via-surface-900 dark:to-surface-950 ${
          isSidebarCollapsed ? "ml-16" : "ml-52"
        }`}
      >
        <main>
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={async () => {
            await refreshProfile();
            setShowOnboarding(false);
          }}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
};

export default Layout;
