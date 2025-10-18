import React, { useState, useEffect, useRef } from "react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calendar, Play, Video, ArrowLeft } from "lucide-react";
import DarkModeToggle from "../ui/DarkModeToggle";
import ConfirmDialog from "../ui/ConfirmDialog";
import toast from "react-hot-toast";
import BrandLogo from "../ui/BrandLogo";
import {
  onDemoState,
  triggerDemoPrimaryAction,
  clearDemoState,
} from "../../utils/demoState";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [demoState, setDemoState] = useState(null);
  const [hideDemoPill, setHideDemoPill] = useState(false);
  const pillRef = useRef(null);

  // Listen for demo state updates (coding / video demos)
  useEffect(() => {
    const unsub = onDemoState((e) => setDemoState(e.detail));
    return () => unsub();
  }, []);

  // Auto-clear demo state when leaving demo routes
  useEffect(() => {
    if (
      !location.pathname.includes("coding-demo") &&
      !location.pathname.includes("video-demo")
    ) {
      setDemoState(null);
      clearDemoState();
    }
  }, [location.pathname]);

  // Hide demo pill after 5 seconds of inactivity
  useEffect(() => {
    const inDemo =
      demoState ||
      location.pathname.includes("coding-demo") ||
      location.pathname.includes("video-demo");
    if (!inDemo) return;
    setHideDemoPill(false);
    const id = setTimeout(() => {
      const el = pillRef.current;
      if (!el) return;
      const isFocused =
        document.activeElement === el || el.contains(document.activeElement);
      if (!el.matches(":hover") && !isFocused) {
        setHideDemoPill(true);
      }
    }, 5000);
    return () => clearTimeout(id);
  }, [demoState, location.pathname]);

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "Architecture", href: "#architecture" },
    { name: "Documentation", href: "#faq" },
    { name: "Project Info", href: "#about" },
  ];

  // Demo mode active if demoState present OR route matches known demos
  const routeDemoMode =
    location.pathname.includes("coding-demo") ||
    location.pathname.includes("video-demo");
  const activeDemoState =
    demoState ||
    (routeDemoMode
      ? {
          mode: location.pathname.includes("coding-demo") ? "coding" : "video",
          title: location.pathname.includes("coding-demo")
            ? "Coding Challenge Demo"
            : "Video Recording Demo",
          subtitle: "Interactive preview",
        }
      : null);

  const isDemo = Boolean(activeDemoState);
  const progressPct = Math.round((activeDemoState?.progress || 0) * 100);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={[
        "fixed top-0 left-0 right-0 z-50 border-b border-surface-800",
        "bg-black/70 backdrop-blur-sm transition-colors duration-300",
      ].join(" ")}
    >
      {/* Thin progress accent (minimal) */}
      {isDemo && typeof activeDemoState.progress === "number" && (
        <div
          className="absolute top-0 inset-x-0 h-0.5 bg-surface-700/60 overflow-hidden group"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          title={`${progressPct}% complete`}
        >
          <div
            className="h-full bg-teal-400 transition-all duration-500 group-hover:bg-teal-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-black"
              aria-label="MockMate home"
            >
              <BrandLogo size="md" />
              <span className="hidden md:inline-block brand-wordmark text-sm leading-none select-none">
                MockMate
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!user && (
              <>
                {navigation.map((item) => (
                  <a key={item.name} href={item.href} className="nav-link-dark">
                    {item.name}
                  </a>
                ))}
              </>
            )}

            {user && (
              <>
                <Link to="/dashboard" className="nav-link-dark">
                  Dashboard
                </Link>
                <Link to="/interviews" className="nav-link-dark">
                  Interviews
                </Link>
                <Link to="/mock-interview" className="nav-link-dark">
                  Practice
                </Link>
              </>
            )}
          </div>

          {/* CTA & User Actions OR Demo Toolbar */}
          <div className="hidden md:flex items-center space-x-4">
            {isDemo && (
              <div className="flex items-center gap-2 pr-4 mr-4 border-r border-white/10">
                <span
                  ref={pillRef}
                  tabIndex={0}
                  onMouseEnter={() => setHideDemoPill(false)}
                  onFocus={() => setHideDemoPill(false)}
                  className={[
                    "px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide outline-none transition-all duration-300",
                    "bg-teal-600/20 text-teal-300 border border-teal-500/30",
                    hideDemoPill
                      ? "opacity-0 pointer-events-none translate-x-1"
                      : "opacity-100",
                  ].join(" ")}
                  aria-label="Demo mode active"
                >
                  DEMO
                </span>
                <span className="text-xs font-medium text-surface-200 max-w-[12rem] truncate">
                  {activeDemoState.title}
                </span>
                {activeDemoState.primaryActionLabel && (
                  <button
                    onClick={triggerDemoPrimaryAction}
                    className="text-xs font-medium px-3 py-1.5 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1 transition-colors"
                  >
                    {activeDemoState.mode === "coding" ? (
                      <Play size={12} />
                    ) : (
                      <Video size={12} />
                    )}
                    {activeDemoState.primaryActionLabel}
                  </button>
                )}
                <button
                  onClick={() => nav("/")}
                  className="text-xs font-medium px-2 py-1 rounded-md text-surface-300 hover:text-white hover:bg-white/5 flex items-center gap-1 transition-colors"
                  title="Exit demo"
                >
                  <ArrowLeft size={12} /> Exit
                </button>
              </div>
            )}
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {!user && (
              <>
                <Link to="/login" className="nav-link-dark">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary focus:ring-offset-surface-900"
                >
                  Sign Up Free
                </Link>
              </>
            )}

            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-surface-300 text-sm">
                  Welcome, {user?.name || user?.email}
                </span>
                <Link
                  to="/scheduled"
                  className="nav-link-dark flex items-center gap-1"
                  title="Scheduled"
                >
                  <Calendar size={18} />
                </Link>
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="nav-link-dark"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center space-x-2">
            {isDemo && (
              <span
                className={[
                  "px-2 py-0.5 text-[10px] font-medium rounded bg-teal-600/30 text-teal-200 border border-teal-500/30 transition-opacity duration-300",
                  hideDemoPill
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100",
                ].join(" ")}
              >
                {progressPct ? `${progressPct}%` : "DEMO"}
              </span>
            )}
            {/* Mobile Dark Mode Toggle */}
            <DarkModeToggle />
            <Link
              to="/scheduled"
              className="text-surface-300 hover:text-white transition-colors p-2 rounded-lg"
              title="Scheduled"
            >
              <Calendar size={22} />
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-surface-300 hover:text-white transition-colors p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-black"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-surface-700"
              role="menu"
              aria-label="Mobile navigation"
            >
              <div className="py-4 space-y-4">
                {!user && (
                  <>
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="block nav-link-dark"
                        onClick={() => setIsMobileMenuOpen(false)}
                        role="menuitem"
                      >
                        {item.name}
                      </a>
                    ))}
                  </>
                )}
                <div className="pt-4 space-y-3">
                  {!user && (
                    <>
                      <Link
                        to="/login"
                        className="block nav-link-dark"
                        onClick={() => setIsMobileMenuOpen(false)}
                        role="menuitem"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="block btn-primary text-center focus:ring-offset-surface-900"
                        onClick={() => setIsMobileMenuOpen(false)}
                        role="menuitem"
                      >
                        Sign Up Free
                      </Link>
                    </>
                  )}
                </div>
                {user && (
                  <>
                    <Link
                      to="/dashboard"
                      className="block nav-link-dark"
                      onClick={() => setIsMobileMenuOpen(false)}
                      role="menuitem"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/interviews"
                      className="block nav-link-dark"
                      onClick={() => setIsMobileMenuOpen(false)}
                      role="menuitem"
                    >
                      Interviews
                    </Link>
                    <Link
                      to="/mock-interview"
                      className="block nav-link-dark"
                      onClick={() => setIsMobileMenuOpen(false)}
                      role="menuitem"
                    >
                      Practice
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setConfirmOpen(true);
                      }}
                      className="mt-3 block w-full text-left nav-link-dark px-2"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Confirm dialog */}
        <ConfirmDialog
          open={confirmOpen}
          title="Sign out?"
          description="You will be redirected to the sign-in page."
          confirmText="Sign out"
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false);
            try {
              await logout();
            } finally {
              toast.success("Signed out");
              navigate("/login");
            }
          }}
        />
      </div>
    </motion.nav>
  );
};

export default Navbar;
