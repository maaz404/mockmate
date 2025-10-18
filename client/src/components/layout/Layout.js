import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import OnboardingModal from "../onboarding/OnboardingModal";
import AuthLoadingSpinner from "../ui/AuthLoadingSpinner";

const Layout = ({ children }) => {
  const location = useLocation();
  const { loading, refreshProfile } = useAuthContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check if user needs onboarding
  // useEffect(() => {
  //   if (isSignedIn && userProfile && !userProfile.onboardingCompleted) {
  //     setShowOnboarding(true);
  //   }
  // }, [isSignedIn, userProfile]);

  // Show loading spinner while auth is loading (but not for home page)
  if (loading && location.pathname !== "/") {
    return <AuthLoadingSpinner message="Loading your dashboard..." />;
  }

  // Footer is hidden in sidebar layout; no special auth path handling needed here.

  return (
    <div className="flex min-h-screen bg-white dark:bg-surface-900 transition-colors duration-200">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      {/* Main content area with sidebar */}
      <div
        className={`flex-1 flex flex-col ml-0 ${
          isSidebarCollapsed ? "lg:ml-12" : "lg:ml-52"
        } transition-all duration-300`}
      >
        {/* Top Navbar removed for consistency with sidebar layout */}
        <main className="flex-1 bg-white dark:bg-surface-900 transition-colors duration-200">
          <div
            key={location.pathname}
            className="pt-16 lg:pt-0 animate-fade-up"
          >
            {children}
          </div>
        </main>
        {/* Footer intentionally hidden across sidebar layout for a cleaner, consistent UI */}
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={async () => {
          await refreshProfile();
          setShowOnboarding(false);
        }}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
};

export default Layout;
