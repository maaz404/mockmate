import React, { useState } from "react";
import { useSubscription } from "../../hooks/useSubscription";
import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";
import DarkModeToggle from "../ui/DarkModeToggle";
import BrandLogo from "../ui/BrandLogo";
import { navigationConfig } from "../../config/navigation";

// Clean rebuilt Sidebar component for session-based auth (sign-out handled via route/button)
const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { subscription } = useSubscription();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: "",
    top: 0,
    left: 0,
  });
  const location = useLocation();
  const { user } = useAuthContext();

  const showTooltip = (e, text) => {
    if (!isCollapsed) return;
    const container = e.currentTarget;
    const link = container.querySelector('a, [role="link"]') || container;
    const rect = link.getBoundingClientRect();
    setTooltip({
      visible: true,
      text,
      top: Math.round(rect.top + rect.height / 2),
      left: Math.round(rect.right + 12),
    });
  };
  const hideTooltip = () => setTooltip((t) => ({ ...t, visible: false }));

  // navigationItems come from central config
  const navigationItems = navigationConfig;

  const isActive = (path) => location.pathname === path;

  const renderNavItem = (item) => (
    <div
      key={item.path}
      className={`group relative ${isCollapsed ? "flex justify-center" : ""}`}
      onMouseEnter={(e) => showTooltip(e, item.name)}
      onMouseMove={(e) => showTooltip(e, item.name)}
      onMouseLeave={hideTooltip}
      onFocus={(e) => showTooltip(e, item.name)}
      onBlur={hideTooltip}
    >
      <Link
        to={item.path}
        onClick={() => setIsMobileOpen(false)}
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
          {React.cloneElement(item.icon, { className: "w-[20px] h-[20px]" })}
        </span>
        {!isCollapsed && <span className="ml-1.5 truncate">{item.name}</span>}
      </Link>
    </div>
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-900 bg-opacity-75 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

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

      {isCollapsed && tooltip.visible && (
        <div
          className="fixed pointer-events-none z-[9999] -translate-y-1/2 transition-all duration-150 ease-out animate-tooltip-pop"
          style={{ top: tooltip.top, left: tooltip.left }}
          role="tooltip"
          aria-hidden={!tooltip.visible}
        >
          <div className="relative bg-neutral-900 text-white px-3 py-1.5 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap flex items-center">
            <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 rotate-45 rounded-[2px]" />
            {tooltip.text}
          </div>
        </div>
      )}

      <div
        className={`fixed top-0 left-0 z-50 h-full bg-[#F6FAFD] dark:bg-surface-900 transition-all duration-300 shadow-none border-r border-surface-200 dark:border-surface-800 flex flex-col overflow-hidden ${
          isCollapsed ? "w-16" : "w-52"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
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

        <nav
          className={`flex-1 overflow-y-auto no-scrollbar ${
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
        </nav>

        <div
          className={`mt-auto border-t border-surface-200 dark:border-surface-800 ${
            isCollapsed ? "p-1 space-y-1" : "p-2 space-y-2"
          }`}
        >
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

          {user ? (
            <>
              <div
                className={`flex items-center ${
                  isCollapsed ? "justify-center h-8" : "space-x-2 px-2 h-8"
                }`}
              >
                <div className="w-[22px] h-[22px] rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                  {user.name ? user.name[0] : "U"}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-900 dark:text-white truncate">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                      {user.email || ""}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && subscription.isFree && (
                <div className="px-2">
                  <button className="w-full text-left px-3 py-2 text-xs text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-medium">
                    Upgrade to Pro
                  </button>
                </div>
              )}
              {!isCollapsed && (
                <div className="px-2 mt-2">
                  <button
                    className="block w-full text-center px-3 py-2 text-xs text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    onClick={async () => {
                      try {
                        await import("react-hot-toast").then((m) =>
                          m.default.success("Signed out")
                        );
                        const { logout } =
                          require("../../context/AuthContext.jsx").useAuthContext();
                        await logout();
                      } finally {
                        window.location.href = "/login";
                      }
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            !isCollapsed && (
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
            )
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
