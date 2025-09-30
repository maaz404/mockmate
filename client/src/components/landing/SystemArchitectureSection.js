import React from "react";
import { motion } from "framer-motion";
import {
  Server,
  Database,
  Globe,
  Shield,
  Layers,
  Code,
  Workflow,
  GitBranch,
} from "lucide-react";

const SystemArchitectureSection = () => {
  const architectureComponents = [
    {
      name: "Frontend Layer",
      description: "React-based user interface with modern design patterns",
      icon: Globe,
      color: "primary",
      technologies: [
        "React 18.2.0 with Hooks",
        "Tailwind CSS for styling",
        "Framer Motion animations",
        "Responsive design principles",
        "Component-based architecture",
      ],
      connections: ["API Gateway", "Authentication Service"],
    },
    {
      name: "Backend Services",
      description: "Node.js server with Express.js framework",
      icon: Server,
      color: "green",
      technologies: [
        "Node.js runtime environment",
        "Express.js web framework",
        "RESTful API architecture",
        "Middleware implementation",
        "Error handling systems",
      ],
      connections: ["Database Layer", "External APIs"],
    },
    {
      name: "Database Layer",
      description: "MongoDB for scalable data storage and retrieval",
      icon: Database,
      color: "primary",
      technologies: [
        "MongoDB document database",
        "Mongoose ODM integration",
        "Schema validation",
        "Aggregation pipelines",
        "Indexing optimization",
      ],
      connections: ["Backend Services", "Data Analytics"],
    },
    {
      name: "Authentication",
      description: "Clerk-based user management and security",
      icon: Shield,
      color: "purple",
      technologies: [
        "Clerk authentication service",
        "JWT token management",
        "User session handling",
        "Role-based access control",
        "Security middleware",
      ],
      connections: ["Frontend Layer", "Backend Services"],
    },
    {
      name: "AI Integration",
      description: "Machine learning APIs for intelligent feedback",
      icon: Code,
      color: "accent",
      technologies: [
        "Natural Language Processing",
        "AI API integration",
        "Response analysis algorithms",
        "Feedback generation logic",
        "Performance scoring",
      ],
      connections: ["Backend Services", "Analytics Engine"],
    },
    {
      name: "Data Flow",
      description: "Asynchronous processing and real-time updates",
      icon: Workflow,
      color: "accent",
      technologies: [
        "Event-driven architecture",
        "Asynchronous processing",
        "Real-time data streaming",
        "State management",
        "Performance optimization",
      ],
      connections: ["All Components"],
    },
  ];

  const systemStats = [
    {
      metric: "6",
      label: "Core Layers",
      description: "Modular architecture components",
    },
    {
      metric: "8+",
      label: "API Endpoints",
      description: "RESTful service interfaces",
    },
    {
      metric: "5",
      label: "Data Models",
      description: "Normalized database schemas",
    },
    {
      metric: "3",
      label: "External APIs",
      description: "Third-party integrations",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      primary: "bg-primary-500/10 text-primary-600 border-primary-500/20",
      accent: "bg-accent-500/10 text-accent-600 border-accent-500/20",
      green: "bg-green-500/10 text-green-600 border-green-500/20",
      purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    };
    return colors[color] || colors.primary;
  };

  return (
    <section
      id="architecture"
      className="section-padding bg-white dark:bg-surface-900"
    >
      <div className="max-w-7xl mx-auto container-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-surface-100 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-full px-4 py-2 mb-6">
            <Layers
              size={16}
              className="text-primary-600 dark:text-primary-400"
            />
            <span className="text-surface-700 dark:text-surface-300 text-sm font-medium">
              System Design
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white mb-6">
            System <span className="gradient-text">Architecture</span>
          </h2>

          <p className="text-xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto">
            A comprehensive overview of the technical architecture, showcasing
            modern full-stack development practices and scalable system design
            principles implemented in MockMate.
          </p>
        </motion.div>

        {/* Architecture Components Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {architectureComponents.map((component, index) => {
            const Icon = component.icon;
            return (
              <motion.div
                key={component.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="card hover:shadow-surface-xl group-hover:-translate-y-1 transition-all duration-300 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl border ${getColorClasses(
                        component.color
                      )} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon size={24} />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">
                    {component.name}
                  </h3>

                  <p className="text-surface-600 dark:text-surface-300 mb-4 leading-relaxed">
                    {component.description}
                  </p>

                  {/* Technologies */}
                  <div className="space-y-2 mb-4">
                    {component.technologies.map((tech, techIndex) => (
                      <div
                        key={techIndex}
                        className="flex items-center text-sm text-surface-700 dark:text-surface-300"
                      >
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                        {tech}
                      </div>
                    ))}
                  </div>

                  {/* Connections */}
                  <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
                    <div className="text-xs text-surface-500 dark:text-surface-400 mb-2">
                      Connects to:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {component.connections.map((connection, connIndex) => (
                        <span
                          key={connIndex}
                          className="bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs px-2 py-1 rounded-full"
                        >
                          {connection}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* System Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-700 rounded-2xl p-8 border border-surface-200 dark:border-surface-700"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-full px-4 py-2 mb-4">
              <GitBranch
                size={16}
                className="text-primary-600 dark:text-primary-400"
              />
              <span className="text-surface-700 dark:text-surface-300 text-sm font-medium">
                Technical Specifications
              </span>
            </div>
            <h3 className="text-2xl font-bold text-surface-900 dark:text-white">
              System Overview & Metrics
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {systemStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-surface border border-surface-200 dark:border-surface-700"
              >
                <div className="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                  {stat.metric}
                </div>
                <div className="text-surface-800 dark:text-surface-200 font-medium mb-2">
                  {stat.label}
                </div>
                <div className="text-surface-600 dark:text-surface-400 text-sm">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SystemArchitectureSection;
