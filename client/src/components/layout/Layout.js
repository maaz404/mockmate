import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import OnboardingModal from "../onboarding/OnboardingModal";
import AuthLoadingSpinner from "../ui/AuthLoadingSpinner";

const Layout = ({ children }) => {
  const location = useLocation();
  const { isSignedIn, userProfile, loading, refreshProfile } = useAuthContext();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    if (isSignedIn && userProfile && !userProfile.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [isSignedIn, userProfile]);

  // Show loading spinner while auth is loading (but not for home page)
  if (loading && location.pathname !== "/") {
    return <AuthLoadingSpinner message="Loading your dashboard..." />;
  }

  // Routes that should show only navbar + footer (legacy public pages without sidebar)
  const legacyNavbarOnlyRoutes = [
    "/demo",
    "/coding-demo",
    "/video-demo"
  ];

  // Routes that should use sidebar layout (all pages except legacy demo pages)
  const useSidebarLayout = !legacyNavbarOnlyRoutes.includes(location.pathname);

  if (useSidebarLayout) {
    return (
      <div className="flex h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-200">
        <Sidebar />
        {/* Main content area with sidebar */}
        <div className="flex-1 flex flex-col ml-0 lg:ml-64">
          {/* Show navbar on public pages within sidebar layout */}
          {(location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register") && (
            <div className="lg:hidden">
              <Navbar />
            </div>
          )}
          <main className="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-900 transition-colors duration-200">
            <div className="h-full pt-16 lg:pt-0">{children}</div>
          </main>
          {/* Show footer on public pages within sidebar layout */}
          {(location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register") && (
            <Footer />
          )}
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
  }

  // Legacy layout for demo pages only
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-200">
      {/* Skip navigation link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-link"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 pt-16" tabIndex="-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
