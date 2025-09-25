import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import DarkModeToggle from "../ui/DarkModeToggle";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();

  const navigationItems = [
    {
      section: "Main",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
              />
            </svg>
          ),
        },
        {
          name: "Create Interview",
          path: "/interview/new",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          ),
        },
        {
          name: "Interview History",
          path: "/interviews",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      section: "Tools",
      items: [
        {
          name: "Question Bank",
          path: "/questions",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        },
        {
          name: "Mock Interview",
          path: "/mock-interview",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          ),
        },
        {
          name: "Practice Sessions",
          path: "/practice",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      section: "Resources",
      items: [
        {
          name: "Learning Materials",
          path: "/resources",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          ),
        },
        {
          name: "Reports & Analytics",
          path: "/reports",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      section: "Account",
      items: [
        {
          name: "Settings",
          path: "/settings",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ),
        },
        {
          name: "Help & Support",
          path: "/support",
          icon: (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
              />
            </svg>
          ),
        },
      ],
    },
  ];

  const isActive = (path) => location.pathname === path;

  const renderNavItem = (item) => (
    <div key={item.path} className="relative group">
      <Link
        to={item.path}
        onClick={() => setIsMobileOpen(false)} // Close mobile menu when clicking nav item
        className={`
          flex items-center px-1.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
          ${
            isActive(item.path)
              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-2 border-primary-500"
              : "text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800/50"
          }
          ${isCollapsed ? "justify-center px-3" : "justify-start"}
        `}
      >
        <span
          className={`flex-shrink-0 ${
            isActive(item.path)
              ? "text-primary-500 dark:text-primary-400"
              : "text-surface-500 dark:text-surface-400"
          }`}
        >
          {item.icon}
        </span>
        {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
      </Link>

      {/* Tooltip for collapsed sidebar */}
      {isCollapsed && (
        <div className="absolute left-14 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none z-50 group-hover:translate-x-1">
          <div className="bg-black text-white px-3 py-2 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap">
            {item.name}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-900 bg-opacity-75 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 shadow-md border border-surface-300 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white backdrop-blur-sm"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transition-all duration-300 overflow-y-auto shadow-lg
          ${isCollapsed ? "w-12" : "w-52"}
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center h-12 px-2 border-b border-surface-200 dark:border-surface-800">
          {!isCollapsed && (
            <>
              <Link to="/" className="flex items-center space-x-2 flex-1">
                <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <span className="text-base font-bold text-surface-900 dark:text-white">
                  MockMate
                </span>
              </Link>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                aria-label="Collapse sidebar"
              >
                <svg
                  className="w-4 h-4 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </>
          )}
          {isCollapsed && (
            <div className="flex items-center justify-between w-full">
              <Link to="/" className="flex items-center justify-center flex-1">
                <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
              </Link>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                aria-label="Expand sidebar"
              >
                <svg
                  className="w-4 h-4 transition-transform duration-200 rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-4">
          {navigationItems.map((section) => (
            <div key={section.section}>
              {!isCollapsed && (
                <h3 className="px-2 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">
                  {section.section}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map(renderNavItem)}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-surface-200 dark:border-surface-800 p-2 space-y-2">
          {/* Dark Mode Toggle - Always visible */}
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "justify-between px-2"
            }`}
          >
            {!isCollapsed && (
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                Theme
              </span>
            )}
            <DarkModeToggle />
          </div>

          <SignedIn>
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center" : "space-x-2 px-2"
              }`}
            >
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-7 h-7",
                    userButtonPopoverCard: "shadow-lg",
                    userButtonPopoverActionButton:
                      "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  },
                }}
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-900 dark:text-white truncate">
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                    {user?.primaryEmailAddress?.emailAddress || ""}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="px-2">
                <button className="w-full text-left px-3 py-2 text-xs text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-medium">
                  Upgrade to Pro
                </button>
              </div>
            )}
          </SignedIn>

          <SignedOut>
            {!isCollapsed && (
              <div className="space-y-2 px-2">
                <Link
                  to="/login"
                  className="block w-full text-center px-3 py-2 text-xs text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center px-3 py-2 text-xs text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}
          </SignedOut>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
