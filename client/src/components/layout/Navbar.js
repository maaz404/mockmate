import React, { useState } from "react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import DarkModeToggle from "../ui/DarkModeToggle";

const Navbar = () => {
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      className="fixed top-0 left-0 right-0 z-50 bg-surface-900/95 backdrop-blur-lg border-b border-surface-700"
    >
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
              aria-label="MockMate home"
            >
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg" aria-hidden="true">M</span>
              </div>
              <span className="text-xl font-bold text-white">MockMate</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <SignedOut>
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-surface-300 hover:text-white focus:text-white transition-colors duration-200 font-medium rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
                >
                  {item.name}
                </a>
              ))}
            </SignedOut>

            <SignedIn>
              <Link
                to="/dashboard"
                className="text-surface-300 hover:text-white focus:text-white transition-colors duration-200 font-medium rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
              >
                Dashboard
              </Link>
              <Link
                to="/mock-interview"
                className="text-surface-300 hover:text-white focus:text-white transition-colors duration-200 font-medium rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
              >
                Practice
              </Link>
            </SignedIn>
          </div>

          {/* CTA & User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />
            
            <SignedOut>
              <Link
                to="/login"
                className="text-surface-300 hover:text-white focus:text-white transition-colors duration-200 font-medium rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
              >
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
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Dark Mode Toggle */}
            <DarkModeToggle />
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-surface-300 hover:text-white transition-colors p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
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
                      className="block text-surface-300 hover:text-white focus:text-white transition-colors duration-200 font-medium py-2 px-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
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
                      className="block text-surface-300 hover:text-white focus:text-white transition-colors duration-200 font-medium py-2 px-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
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
                    className="block text-surface-300 hover:text-white focus:text-white transition-colors duration-200 font-medium py-2 px-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/mock-interview"
                    className="block text-surface-300 hover:text-white focus:text-white transition-colors duration-200 font-medium py-2 px-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    Practice
                  </Link>
                  <div className="pt-4 flex items-center space-x-3 px-2">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900",
                        },
                      }}
                    />
                    <span className="text-surface-300 text-sm">
                      {user?.firstName}
                    </span>
                  </div>
                </SignedIn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
