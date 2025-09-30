import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-white dark:bg-black flex items-center overflow-hidden transition-colors duration-200">
      {/* Curve graphic accent (bottom-right) */}
      <svg
        className="pointer-events-none absolute right-0 bottom-[-10vh] w-[70vw] h-[50vh] hidden md:block"
        viewBox="0 0 800 300"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
        </defs>
        <path
          d="M-20 260 C 120 140, 360 120, 520 180 C 640 220, 720 160, 840 40"
          stroke="url(#curveGradient)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {[
          { x: 200, y: 170, c: "#FDBA74" },
          { x: 420, y: 160, c: "#FDE68A" },
          { x: 640, y: 140, c: "#F0ABFC" },
        ].map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="24" fill={n.c} opacity="0.35" />
            <circle cx={n.x} cy={n.y} r="14" fill="white" />
          </g>
        ))}
      </svg>

      <div className="relative z-10 max-w-5xl mx-auto container-padding text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-full px-4 py-2 mb-8 shadow-sm"
        >
          <Sparkles size={16} className="text-primary-500" />
          <span className="text-surface-700 dark:text-surface-300 text-[16px] font-medium">
            AI-Powered Job Search & Interview Coach
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-extrabold tracking-tight text-surface-900 dark:text-white max-w-5xl mx-auto text-[32px] sm:text-[40px] md:text-[56px] lg:text-[56px] xl:text-[56px] leading-[1.2]"
        >
          Land Your Next Job in{" "}
          <span className="text-surface-900">30 Days*</span>
          <br />
          or Less with MockMate.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-[18px] sm:text-[20px] text-surface-600 dark:text-surface-400 max-w-3xl mx-auto whitespace-normal md:whitespace-nowrap"
        >
          AI-powered tools to help you ace interviews, apply faster, and land
          offers with confidence.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-[16px] text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover-lift hover-press bg-gradient-primary group"
            aria-label="Get started with MockMate"
          >
            Get started with Interview Copilot
            <ArrowRight
              size={20}
              className="ml-2 group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
