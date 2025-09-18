import React from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 flex items-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-gradient-to-br from-transparent via-surface-800/5 to-transparent" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto container-padding">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-full px-4 py-2 mb-6"
            >
              <Sparkles size={16} className="text-primary-400" />
              <span className="text-surface-300 text-sm font-medium">
                AI-Powered Interview Preparation
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hero-title text-white mb-6"
            >
              Land Your Next Job in{" "}
              <span className="gradient-text">30 Days</span> with MockMate AI
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="hero-subtitle text-surface-400 mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              AI-powered tools to help you ace interviews, apply faster, and
              land offers with confidence. Practice with real interview
              questions from top companies.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
            >
              <SignedOut>
                <Link to="/register" className="btn-primary group">
                  Get Started Free
                  <ArrowRight
                    size={20}
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <button className="btn-secondary group">
                  <Play size={20} className="mr-2" />
                  Watch Demo
                </button>
              </SignedOut>

              <SignedIn>
                <Link to="/dashboard" className="btn-primary group">
                  Continue to Dashboard
                  <ArrowRight
                    size={20}
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <Link to="/mock-interview" className="btn-secondary">
                  Start Practice Session
                </Link>
              </SignedIn>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-6 text-surface-400 text-sm"
            >
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full border-2 border-surface-800 flex items-center justify-center text-xs font-bold text-white"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span>Join 50,000+ success stories</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span>4.9/5 from 2,000+ reviews</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Dashboard Mockup */}
              <div className="bg-surface-800 rounded-2xl shadow-2xl border border-surface-700 p-6 backdrop-blur-sm">
                <div className="bg-surface-900 rounded-xl p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">M</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          Mock Interview
                        </div>
                        <div className="text-surface-400 text-sm">
                          Software Engineer
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="bg-surface-800 rounded-lg p-4 mb-4">
                    <div className="text-primary-400 text-sm font-medium mb-2">
                      Question 1 of 5
                    </div>
                    <div className="text-white text-lg leading-relaxed">
                      "Tell me about a challenging project you worked on and how
                      you overcame the obstacles."
                    </div>
                  </div>

                  {/* AI Feedback */}
                  <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles size={16} className="text-primary-400" />
                      <span className="text-primary-400 font-medium text-sm">
                        AI Feedback
                      </span>
                    </div>
                    <div className="text-surface-300 text-sm">
                      Great structure! Consider adding more specific metrics
                      about the project impact...
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-accent-500/20 backdrop-blur-sm border border-accent-500/30 rounded-lg p-3"
              >
                <div className="text-accent-400 text-sm font-medium">
                  +89% Success Rate
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                className="absolute -bottom-4 -left-4 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-3"
              >
                <div className="text-green-400 text-sm font-medium">
                  Real-time Analysis
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
