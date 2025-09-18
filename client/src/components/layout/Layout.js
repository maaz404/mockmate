import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import EnhancedOnboardingModal from "../onboarding/EnhancedOnboardingModal";
import AuthLoadingSpinner from "../ui/AuthLoadingSpinner";

const Layout = ({ children }) => {
  const location = useLocation();
  const { isSignedIn, userProfile, loading } = useAuthContext();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    if (isSignedIn && userProfile && !userProfile.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [isSignedIn, userProfile]);

  // Show loading spinner while auth is loading
  if (loading) {
    return <AuthLoadingSpinner message="Loading your dashboard..." />;
  }

  // Define routes that should show the sidebar (authenticated pages)
  const sidebarRoutes = [
    "/dashboard",
    "/comprehensive-dashboard",
    "/interview",
    "/interviews",
    "/questions",
    "/mock-interview",
    "/practice",
    "/resources",
    "/reports",
    "/settings",
    "/support",
  ];

  // Check if current route should show sidebar
  const showSidebar = sidebarRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  // Routes that should show the old navbar (public pages)
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/features",
    "/pricing",
    "/about",
  ];
  const showNavbar = publicRoutes.includes(location.pathname);

  if (showSidebar) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        {/* Main content area with sidebar */}
        <div className="flex-1 flex flex-col ml-0 lg:ml-64">
          <main className="flex-1 overflow-y-auto">
            <div className="h-full pt-16 lg:pt-0">{children}</div>
          </main>
        </div>

        {/* Onboarding Modal */}
        <EnhancedOnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      </div>
    );
  }

  if (showNavbar) {
    return (
      <div className="min-h-screen bg-surface-50">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </div>
    );
  }

  // Default layout for other pages
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
