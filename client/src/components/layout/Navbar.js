import React from "react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { user } = useUser();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-gradient">
              MockMate
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Home
            </Link>
            <a
              href="/features"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Features
            </a>
            <a
              href="/pricing"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Pricing
            </a>
            <a
              href="/about"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              About
            </a>

            {/* Dashboard link for authenticated users */}
            <SignedIn>
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {/* Show when user is NOT signed in */}
            <SignedOut>
              <Link
                to="/login"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </SignedOut>

            {/* Show when user IS signed in */}
            <SignedIn>
              <div className="flex items-center space-x-3">
                {/* Welcome message */}
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {user?.firstName || "User"}!
                </span>

                {/* User button with dropdown menu */}
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonPopoverCard: "shadow-lg",
                      userButtonPopoverActionButton:
                        "text-gray-700 hover:bg-gray-100",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
