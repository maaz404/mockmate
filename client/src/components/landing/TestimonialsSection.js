import React from "react";
import { motion } from "framer-motion";
import {
  Target,
  Code,
  BookOpen,
  Lightbulb,
  Cpu,
  Database,
  CheckCircle,
} from "lucide-react";

const ProjectInfoSection = () => {
  const projectInfo = [
    {
      icon: Target,
      title: "Project Objectives",
      content:
        "Develop a comprehensive full-stack interview preparation platform that demonstrates modern web development practices, AI integration, and scalable system architecture.",
      category: "Academic Goals",
      color: "primary",
    },
    {
      icon: Code,
      title: "Technical Implementation",
      content:
        "Built using React.js frontend with Node.js/Express backend, MongoDB database, Clerk authentication, and AI API integration for real-time feedback processing.",
      category: "Development Stack",
      color: "accent",
    },
    {
      icon: BookOpen,
      title: "Learning Outcomes",
      content:
        "Gained expertise in full-stack development, API design, database optimization, user authentication, real-time processing, and modern UI/UX principles.",
      category: "Skills Acquired",
      color: "green",
    },
    {
      icon: Lightbulb,
      title: "Innovation & Challenges",
      content:
        "Overcame challenges in real-time video processing, AI response analysis, user data synchronization, and creating responsive, accessible user interfaces.",
      category: "Problem Solving",
      color: "blue",
    },
    {
      icon: Cpu,
      title: "System Architecture",
      content:
        "Implemented microservices architecture with RESTful APIs, JWT authentication, MongoDB aggregation pipelines, and asynchronous processing for optimal performance.",
      category: "Technical Design",
      color: "orange",
    },
    {
      icon: Database,
      title: "Data Management",
      content:
        "Designed normalized database schemas, implemented efficient queries, created data validation layers, and established proper indexing for performance optimization.",
      category: "Database Design",
      color: "purple",
    },
  ];

  const achievements = [
    {
      metric: "1,500+",
      label: "Lines of Code",
      description: "Across frontend and backend",
    },
    {
      metric: "15+",
      label: "React Components",
      description: "Reusable and modular",
    },
    {
      metric: "8",
      label: "API Endpoints",
      description: "RESTful backend services",
    },
    {
      metric: "100%",
      label: "Academic Success",
      description: "Comprehensive implementation",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      primary: "bg-primary-500/10 text-primary-600 border-primary-500/20",
      accent: "bg-accent-500/10 text-accent-600 border-accent-500/20",
      green: "bg-green-500/10 text-green-600 border-green-500/20",
      blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    };
    return colors[color] || colors.primary;
  };

  return (
    <section className="section-padding bg-surface-50">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-white border border-surface-200 rounded-full px-4 py-2 mb-6">
            <Target size={16} className="text-primary-600" />
            <span className="text-surface-700 text-sm font-medium">
              Project Overview
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            Academic Project{" "}
            <span className="gradient-text">Documentation</span>
          </h2>

          <p className="text-xl text-surface-600 max-w-3xl mx-auto">
            A comprehensive final year project demonstrating advanced web
            development skills, modern software architecture, and practical
            application of computer science principles.
          </p>
        </motion.div>

        {/* Project Info Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {projectInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-surface border border-surface-200 p-6 hover:shadow-surface-lg group-hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  {/* Icon and Category */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl border ${getColorClasses(
                        info.color
                      )} flex items-center justify-center`}
                    >
                      <Icon size={24} />
                    </div>
                    <div className="bg-surface-100 text-surface-600 text-xs font-medium px-3 py-1 rounded-full">
                      {info.category}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-surface-900 mb-3">
                    {info.title}
                  </h3>
                  <p className="text-surface-700 leading-relaxed flex-grow">
                    {info.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Project Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl shadow-surface border border-surface-200 p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <CheckCircle size={20} className="text-green-600" />
              <span className="text-surface-800 font-semibold">
                Project Achievements
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                >
                  <div className="text-3xl font-bold text-surface-900 mb-2">
                    {achievement.metric}
                  </div>
                  <div className="text-surface-800 font-medium mb-1">
                    {achievement.label}
                  </div>
                  <div className="text-surface-600 text-sm">
                    {achievement.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectInfoSection;
