import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Video,
  BarChart3,
  Users,
  Clock,
  Target,
  Sparkles,
  MessageSquare,
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Natural Language Processing",
      description:
        "Implemented intelligent text analysis using AI APIs to evaluate interview responses with semantic understanding and context awareness.",
      color: "primary",
    },
    {
      icon: Video,
      title: "Real-time Video Integration",
      description:
        "Built custom video recording and playback system with WebRTC APIs for seamless interview simulation and review capabilities.",
      color: "accent",
    },
    {
      icon: BarChart3,
      title: "Data Visualization & Analytics",
      description:
        "Developed comprehensive dashboard with Chart.js integration to visualize performance metrics and progress tracking over time.",
      color: "green",
    },
    {
      icon: Users,
      title: "Dynamic Question Management",
      description:
        "Created scalable question database with MongoDB aggregation pipelines for categorized, difficulty-based question retrieval.",
      color: "primary",
    },
    {
      icon: Clock,
      title: "Asynchronous Processing",
      description:
        "Implemented non-blocking backend architecture with Node.js event loop for real-time feedback and concurrent user sessions.",
      color: "accent",
    },
    {
      icon: Target,
      title: "Adaptive Algorithm Design",
      description:
        "Developed machine learning logic for personalized content delivery based on user performance patterns and learning objectives.",
      color: "success",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      primary: "bg-primary-500/10 text-primary-600 border-primary-500/20",
      accent: "bg-accent-500/10 text-accent-600 border-accent-500/20",
      success: "bg-success-500/10 text-success-600 border-success-500/20",
      green: "bg-green-500/10 text-green-600 border-green-500/20",
    };
    return colors[color] || colors.primary;
  };

  return (
    <section id="features" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-surface-100 rounded-full px-4 py-2 mb-6">
            <Sparkles size={16} className="text-primary-600" />
            <span className="text-surface-700 text-sm font-medium">
              Technical Implementation
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            Core System <span className="gradient-text">Architecture</span>
          </h2>

          <p className="text-xl text-surface-600 max-w-3xl mx-auto">
            MockMate demonstrates modern full-stack development practices with
            advanced algorithms, real-time processing, and scalable architecture
            designed for optimal performance and user experience.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="card hover:shadow-surface-xl group-hover:-translate-y-1 transition-all duration-300">
                  <div
                    className={`w-12 h-12 rounded-xl border ${getColorClasses(
                      feature.color
                    )} flex items-center justify-center mb-4`}
                  >
                    <Icon size={24} />
                  </div>

                  <h3 className="text-xl font-semibold text-surface-900 mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-surface-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2 mb-6">
              <MessageSquare size={16} className="text-primary-600" />
              <span className="text-primary-700 text-sm font-medium">
                System Demo
              </span>
            </div>

            <h3 className="text-3xl lg:text-4xl font-bold text-surface-900 mb-6">
              Advanced AI Processing & Feedback Engine
            </h3>

            <p className="text-lg text-surface-600 mb-8">
              The system employs natural language processing algorithms and
              machine learning models to analyze interview responses, providing
              comprehensive feedback through sophisticated data processing
              pipelines.
            </p>

            <div className="space-y-4">
              {[
                "NLP-based semantic analysis and scoring",
                "Real-time data processing with Node.js streams",
                "Machine learning model integration for insights",
                "MongoDB aggregation for performance analytics",
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  </div>
                  <span className="text-surface-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-8">
              <div className="bg-white rounded-xl shadow-surface-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-surface-900">
                      Processing Engine
                    </div>
                    <div className="text-surface-500 text-sm">
                      Analyzing semantic patterns...
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-700 font-medium text-sm">
                      ✓ Semantic coherence: 92%
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-yellow-700 font-medium text-sm">
                      ⚠ Technical depth improvement
                    </div>
                  </div>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <div className="text-primary-700 font-medium text-sm">
                      💡 Algorithm optimization potential
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-white rounded-lg shadow-surface-md p-3 border border-surface-200"
            >
              <div className="text-surface-900 font-semibold text-sm">
                Processing: 94ms
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
