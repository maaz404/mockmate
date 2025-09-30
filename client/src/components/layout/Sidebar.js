import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../ui/ConfirmDialog";
import DarkModeToggle from "../ui/DarkModeToggle";
import BrandLogo from "../ui/BrandLogo";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Tooltip state rendered as a single fixed element (prevents clipping behind main content)
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: "",
    top: 0,
    left: 0,
  });

  const showTooltip = (e, text) => {
    // Anchor to the nav link container center for precise vertical alignment
    // with the icon, and round to whole pixels to avoid subpixel drift.
    const container = e.currentTarget;
    const link = container.querySelector('a, [role="link"]') || container;
    const rect = link.getBoundingClientRect();

    setTooltip({
      visible: true,
      text,
      top: Math.round(rect.top + rect.height / 2),
      left: Math.round(rect.right + 12), // consistent gap next to icon
    });
  };

  const hideTooltip = () => setTooltip((prev) => ({ ...prev, visible: false }));
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    <div
      key={item.path}
      className="relative group"
      onMouseEnter={(e) => isCollapsed && showTooltip(e, item.name)}
      onMouseMove={(e) => isCollapsed && showTooltip(e, item.name)}
      onMouseLeave={hideTooltip}
      onFocus={(e) => isCollapsed && showTooltip(e, item.name)}
      onBlur={hideTooltip}
    >
      <Link
        to={item.path}
        onClick={() => setIsMobileOpen(false)} // Close mobile menu when clicking nav item
        className={`${
          isCollapsed
            ? "w-full h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
            : "sidebar-link items-center justify-start"
        } ${
          isActive(item.path)
            ? isCollapsed
              ? "bg-surface-100 dark:bg-surface-800"
              : "sidebar-link-active"
            : ""
        }`}
      >
        <span
          className={`flex-shrink-0 ${
            isActive(item.path)
              ? "text-primary-600 dark:text-primary-400"
              : "text-surface-800 dark:text-surface-300"
          }`}
        >
          {React.cloneElement(item.icon, {
            className: "w-[20px] h-[20px]",
          })}
        </span>
        {!isCollapsed && <span className="ml-1.5 truncate">{item.name}</span>}
      </Link>

      {/* Per-item tooltip removed; we render a single viewport-fixed tooltip below */}
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

      {/* Viewport-fixed tooltip to avoid clipping behind main content */}
      {isCollapsed && tooltip.visible && (
        <div
          className="fixed pointer-events-none z-[9999] -translate-y-1/2 transition-all duration-150 ease-out animate-tooltip-pop"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          <div className="relative bg-neutral-900 text-white px-3 py-1.5 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap flex items-center">
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 rotate-45 rounded-[2px]"></span>
            {tooltip.text}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full
          bg-[#F6FAFD] dark:bg-surface-900
          transition-all duration-300 shadow-none border-r border-surface-200 dark:border-surface-800
          flex flex-col overflow-hidden
          ${isCollapsed ? "w-16" : "w-52"}
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Header: logo with always-visible toggle arrow adjacent to it */}
        <div className="flex items-center h-12 px-2 border-b border-surface-300/60 dark:border-surface-700/60 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.02)]">
          {!isCollapsed ? (
            <>
              <Link to="/" className="flex items-center space-x-2">
                <BrandLogo size="sm" variant="mark" />
                <span className="brand-wordmark text-[15px] leading-none select-none">
                  MockMate
                </span>
              </Link>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-lg text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                aria-label="Collapse sidebar"
              >
                <svg
                  className="w-4 h-4"
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
          ) : (
            <div className="flex items-center justify-between w-full">
              <Link to="/" className="flex items-center justify-center">
                <BrandLogo size="xs" variant="mark" className="rounded-md" />
              </Link>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                aria-label="Expand sidebar"
              >
                <svg
                  className="w-4 h-4 rotate-180"
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
        <nav
          className={`flex-1 overflow-y-auto ${
            isCollapsed ? "px-2 py-1" : "px-3 py-4"
          } ${isCollapsed ? "space-y-1" : "space-y-4"}`}
        >
          {navigationItems.map((section) => (
            <div key={section.section}>
              {!isCollapsed && (
                <h3 className="px-2 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">
                  {section.section}
                </h3>
              )}
              <div className={isCollapsed ? "space-y-1.5" : "space-y-1"}>
                {section.items.map(renderNavItem)}
              </div>
            </div>
          ))}

          {/* Theme toggle removed from nav */}
        </nav>

        {/* User section */}
        <div
          className={`mt-auto border-t border-surface-200 dark:border-surface-800 ${
            isCollapsed ? "p-1 space-y-1" : "p-2 space-y-2"
          }`}
        >
          {/* Dark Mode Toggle - bottom placement like before */}
          {isCollapsed ? (
            <div
              className="flex items-center justify-center"
              onMouseEnter={(e) => showTooltip(e, "Toggle theme")}
              onMouseMove={(e) => showTooltip(e, "Toggle theme")}
              onMouseLeave={hideTooltip}
              onFocus={(e) => showTooltip(e, "Toggle theme")}
              onBlur={hideTooltip}
            >
              <div className="w-full h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-surface-100 dark:hover:bg-surface-800">
                <DarkModeToggle className="p-0 bg-transparent hover:bg-transparent focus:ring-0" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                Theme
              </span>
              <DarkModeToggle />
            </div>
          )}

          <SignedIn>
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center h-8" : "space-x-2 px-2 h-8"
              }`}
            >
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-[22px] h-[22px]",
                    userButtonPopoverCard: "shadow-lg",
                    userButtonPopoverActionButton:
                      "text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700",
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

            {/* Secondary Sign out action */}
            <div className={isCollapsed ? "px-1" : "px-2 mt-2"}>
              <button
                onClick={() => setConfirmOpen(true)}
                className={`${
                  isCollapsed
                    ? "w-full h-8 flex items-center justify-center rounded-lg"
                    : "w-full text-left px-3 py-2"
                } text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs font-medium`}
              >
                <span className="inline-flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7"
                    />
                  </svg>
                  {!isCollapsed && <span>Sign out</span>}
                </span>
              </button>
            </div>
            <ConfirmDialog
              open={confirmOpen}
              title="Sign out?"
              description="You will be redirected to the sign-in page."
              confirmText="Sign out"
              onClose={() => setConfirmOpen(false)}
              onConfirm={async () => {
                setConfirmOpen(false);
                try {
                  toast.success("Signed out");
                  await signOut({ redirectUrl: "/login" });
                } catch (_) {
                  toast.success("Signed out");
                  window.location.href = "/login";
                }
              }}
            />
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
