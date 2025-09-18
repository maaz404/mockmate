import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

const CTASection = () => {
  const benefits = [
    "Start practicing in under 2 minutes",
    "Get instant AI feedback on your responses",
    "Access 1000+ interview questions",
    "Join 50,000+ successful candidates",
  ];

  return (
    <section className="relative section-padding bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto container-padding text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 bg-surface-800/50 backdrop-blur-sm border border-surface-700 rounded-full px-4 py-2 mb-8"
        >
          <Sparkles size={16} className="text-primary-400" />
          <span className="text-surface-300 text-sm font-medium">
            Ready to Transform Your Career?
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl lg:text-6xl font-bold text-white mb-6"
        >
          Start Your Success Story <span className="gradient-text">Today</span>
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-surface-400 mb-8 max-w-2xl mx-auto"
        >
          Join thousands of candidates who've landed their dream jobs with
          MockMate's AI-powered interview preparation. Your next opportunity is
          just one practice session away.
        </motion.p>

        {/* Benefits List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto"
        >
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3 text-left">
              <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
              <span className="text-surface-300">{benefit}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <SignedOut>
            <Link
              to="/register"
              className="btn-primary text-lg py-4 px-8 group"
            >
              Start Free Trial
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Link>

            <Link to="/login" className="btn-secondary text-lg py-4 px-8">
              Sign In
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              to="/dashboard"
              className="btn-primary text-lg py-4 px-8 group"
            >
              Continue to Dashboard
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Link>

            <Link
              to="/mock-interview"
              className="btn-secondary text-lg py-4 px-8"
            >
              Start Practice Session
            </Link>
          </SignedIn>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-surface-400 text-sm"
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
            <span>Trusted by 50,000+ users</span>
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
            <span>4.9/5 rating</span>
          </div>

          <div className="text-green-400">✓ No credit card required</div>
        </motion.div>

        {/* Final Note */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-surface-500 text-sm mt-8"
        >
          Free 7-day trial • Cancel anytime • Used by candidates at Google,
          Apple, Microsoft, and 500+ companies
        </motion.p>
      </div>
    </section>
  );
};

export default CTASection;
