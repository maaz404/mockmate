import React, { useState } from "react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calendar } from "lucide-react";
import DarkModeToggle from "../ui/DarkModeToggle";
import ConfirmDialog from "../ui/ConfirmDialog";
import toast from "react-hot-toast";
import BrandLogo from "../ui/BrandLogo";

const Navbar = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "Architecture", href: "#architecture" },
    { name: "Documentation", href: "#faq" },
    { name: "Project Info", href: "#about" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-surface-800"
    >
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
            <SignedOut>
              {navigation.map((item) => (
                <a key={item.name} href={item.href} className="nav-link-dark">
                  {item.name}
                </a>
              ))}
            </SignedOut>

            <SignedIn>
              <Link to="/dashboard" className="nav-link-dark">
                Dashboard
              </Link>
              <Link to="/interviews" className="nav-link-dark">
                Interviews
              </Link>
              <Link to="/mock-interview" className="nav-link-dark">
                Practice
              </Link>
            </SignedIn>
          </div>

          {/* CTA & User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            <SignedOut>
              <Link to="/login" className="nav-link-dark">
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary focus:ring-offset-surface-900"
              >
                Sign Up Free
              </Link>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center space-x-3">
                <span className="text-surface-300 text-sm">
                  Welcome, {user?.firstName}
                </span>
                <Link
                  to="/scheduled"
                  className="nav-link-dark flex items-center gap-1"
                  title="Scheduled"
                >
                  <Calendar size={18} />
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        "w-8 h-8 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900",
                    },
                  }}
                />
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="nav-link-dark"
                >
                  Sign out
                </button>
              </div>
            </SignedIn>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center space-x-2">
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
                <SignedOut>
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
                </SignedOut>
                <div className="pt-4 space-y-3">
                  <SignedOut>
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
                  </SignedOut>
                </div>

                <SignedIn>
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
                  <div className="pt-4 flex items-center space-x-3 px-2">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox:
                            "w-8 h-8 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900",
                        },
                      }}
                    />
                    <span className="text-surface-300 text-sm">
                      {user?.firstName}
                    </span>
                  </div>
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
                </SignedIn>
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
              toast.success("Signed out");
              await signOut({ redirectUrl: "/login" });
            } catch (_) {
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
