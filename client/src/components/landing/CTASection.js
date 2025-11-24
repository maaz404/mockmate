import React from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Code,
  FileText,
  Play,
  Award,
  Star,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

const ProjectShowcaseSection = () => {
  const { user } = useAuthContext();

  const projectHighlights = [
    "Full-stack development with modern technologies",
    "Advanced AI integration and real-time processing",
    "Responsive design with comprehensive user experience",
    "Academic project demonstrating technical expertise",
  ];

  const projectLinks = [
    {
      title: "Live Demo",
      description: "Experience the platform",
      icon: Play,
      link: "/register",
      type: "primary",
    },
    {
      title: "Technical Documentation",
      description: "View system architecture",
      icon: FileText,
      link: "#architecture",
      type: "secondary",
    },
    {
      title: "Project Overview",
      description: "Academic documentation",
      icon: BookOpen,
      link: "#features",
      type: "outline",
    },
  ];

  return (
    <section className="relative section-padding bg-surface-50 dark:bg-gradient-to-br dark:from-surface-900 dark:via-surface-800 dark:to-surface-900 overflow-hidden transition-colors duration-200">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/5 dark:bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto container-padding text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 bg-surface-200/50 dark:bg-surface-800/50 backdrop-blur-sm border border-surface-300 dark:border-surface-700 rounded-full px-4 py-2 mb-8"
        >
          <Award size={16} className="text-primary-600 dark:text-primary-400" />
          <span className="text-surface-700 dark:text-surface-300 text-sm font-medium">
            Final Year Academic Project
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl lg:text-6xl font-bold text-surface-900 dark:text-white mb-6"
        >
          Explore the <span className="gradient-text">Project</span>
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-surface-600 dark:text-surface-400 mb-8 max-w-2xl mx-auto"
        >
          A comprehensive demonstration of modern web development practices,
          showcasing full-stack architecture, AI integration, and sophisticated
          user interface design in an interview preparation platform.
        </motion.p>

        {/* Project Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto"
        >
          {projectHighlights.map((highlight, index) => (
            <div key={index} className="flex items-center space-x-3 text-left">
              <Star
                size={20}
                className="text-primary-600 dark:text-primary-400 flex-shrink-0"
              />
              <span className="text-surface-700 dark:text-surface-300">
                {highlight}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Project Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          {projectLinks.map((link, index) => {
            const Icon = link.icon;
            const buttonClass =
              link.type === "primary"
                ? "btn-primary py-3 px-6 group inline-flex items-center justify-center"
                : link.type === "secondary"
                ? "btn-secondary py-3 px-6 inline-flex items-center justify-center"
                : "btn-outline py-3 px-6 inline-flex items-center justify-center";

            return (
              <motion.div
                key={link.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                {link.link.startsWith("#") ? (
                  <a href={link.link} className={buttonClass}>
                    <Icon size={20} className="mr-2" />
                    <span className="font-semibold">{link.title}</span>
                  </a>
                ) : (
                  <Link to={link.link} className={buttonClass}>
                    <Icon size={20} className="mr-2" />
                    <span className="font-semibold">{link.title}</span>
                  </Link>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Authentication-specific CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-8"
        >
          {!user && (
            <div className="bg-surface-800/30 backdrop-blur-sm border border-surface-700 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-surface-300 mb-4">
                Experience the full platform capabilities
              </p>
              <Link to="/register" className="btn-primary w-full group">
                Access Platform Demo
                <ExternalLink
                  size={16}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          )}

          {user && (
            <div className="bg-surface-800/30 backdrop-blur-sm border border-surface-700 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-surface-300 mb-4">
                Continue exploring the platform
              </p>
              <Link to="/dashboard" className="btn-primary w-full group">
                Go to Dashboard
                <ExternalLink
                  size={16}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          )}
        </motion.div>

        {/* Technical Specifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-surface-400 text-sm"
        >
          <div className="flex items-center space-x-2">
            <Code size={16} className="text-primary-400" />
            <span>React + Node.js + MongoDB</span>
          </div>

          <div className="flex items-center space-x-2">
            <Award size={16} className="text-green-400" />
            <span>Academic Excellence</span>
          </div>

          <div className="flex items-center space-x-2">
            <Star size={16} className="text-yellow-400" />
            <span>Full-Stack Implementation</span>
          </div>
        </motion.div>

        {/* Final Note */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-surface-500 text-sm mt-8"
        >
          Developed as a comprehensive final year project demonstrating advanced
          web development skills and modern software engineering practices.
        </motion.p>
      </div>
    </section>
  );
};

export default ProjectShowcaseSection;
