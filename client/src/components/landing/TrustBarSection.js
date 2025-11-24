import React from "react";
import { motion } from "framer-motion";
import { Code2, Database, Brain, Shield, Globe, Server } from "lucide-react";

const TechStackSection = () => {
  const technologies = [
    {
      name: "React",
      icon: Code2,
      description: "Frontend Framework",
      color: "text-primary-500",
    },
    {
      name: "Node.js",
      icon: Server,
      description: "Backend Runtime",
      color: "text-green-500",
    },
    {
      name: "MongoDB",
      icon: Database,
      description: "NoSQL Database",
      color: "text-green-600",
    },
    {
      name: "Express.js",
      icon: Globe,
      description: "Web Framework",
      color: "text-surface-700 dark:text-surface-300",
    },
    {
      name: "JWT + OAuth",
      icon: Shield,
      description: "Authentication",
      color: "text-purple-500",
    },
    {
      name: "AI Integration",
      icon: Brain,
      description: "Machine Learning",
      color: "text-accent-500",
    },
  ];

  const projectStats = [
    {
      value: "15+",
      label: "Components",
      description: "Reusable React components",
    },
    {
      value: "8",
      label: "API Routes",
      description: "RESTful endpoints",
    },
    {
      value: "5",
      label: "Data Models",
      description: "MongoDB schemas",
    },
    {
      value: "3",
      label: "Core Features",
      description: "Interview, Analysis, Reports",
    },
  ];

  return (
    <section className="py-16 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto container-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-surface-600 dark:text-surface-400 font-medium mb-8">
            Built with modern web technologies and best practices
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center justify-start w-full"
              >
                <div className="group cursor-pointer flex flex-col items-center text-center w-full">
                  <div className="w-16 h-16 bg-white dark:bg-surface-800 rounded-xl shadow-surface border border-surface-200 dark:border-surface-700 flex items-center justify-center mb-2 group-hover:shadow-surface-md transition-all duration-200 group-hover:scale-105 mx-auto">
                    <tech.icon
                      size={28}
                      className={`${tech.color} group-hover:scale-110 transition-transform`}
                      aria-label={tech.name}
                      role="img"
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <div className="text-surface-800 dark:text-surface-200 text-sm font-semibold leading-tight mb-1">
                      {tech.name}
                    </div>
                    <div className="text-surface-600 dark:text-surface-400 text-xs leading-snug">
                      {tech.description}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Project Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center border-t border-surface-200 dark:border-surface-700 pt-12"
        >
          {projectStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <div className="text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                {stat.value}
              </div>
              <div className="text-surface-800 dark:text-surface-200 font-medium mb-1">
                {stat.label}
              </div>
              <div className="text-surface-600 dark:text-surface-400 text-sm">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TechStackSection;
