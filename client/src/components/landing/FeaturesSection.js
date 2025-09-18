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
  MessageSquare 
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Practice",
      description: "Advanced AI analyzes your responses and provides personalized feedback to improve your interview performance.",
      color: "primary"
    },
    {
      icon: Video,
      title: "Mock Video Interviews",
      description: "Practice with realistic video interviews that simulate real company interview environments.",
      color: "accent"
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track your progress with detailed analytics and insights to identify areas for improvement.",
      color: "green"
    },
    {
      icon: Users,
      title: "Industry-Specific Questions",
      description: "Access curated questions from top companies across different industries and roles.",
      color: "blue"
    },
    {
      icon: Clock,
      title: "Real-Time Feedback",
      description: "Get instant feedback on your answers, body language, and communication skills during practice.",
      color: "orange"
    },
    {
      icon: Target,
      title: "Personalized Learning Path",
      description: "AI creates a customized learning path based on your goals, experience, and target companies.",
      color: "purple"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      primary: "bg-primary-500/10 text-primary-600 border-primary-500/20",
      accent: "bg-accent-500/10 text-accent-600 border-accent-500/20",
      green: "bg-green-500/10 text-green-600 border-green-500/20",
      blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      purple: "bg-purple-500/10 text-purple-600 border-purple-500/20"
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
              Powerful Features
            </span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            Everything You Need to{" "}
            <span className="gradient-text">Ace Interviews</span>
          </h2>
          
          <p className="text-xl text-surface-600 max-w-3xl mx-auto">
            MockMate combines cutting-edge AI technology with proven interview techniques to give you the confidence and skills needed to land your dream job.
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
                  <div className={`w-12 h-12 rounded-xl border ${getColorClasses(feature.color)} flex items-center justify-center mb-4`}>
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
                AI Interview Coach
              </span>
            </div>
            
            <h3 className="text-3xl lg:text-4xl font-bold text-surface-900 mb-6">
              Get Personalized Feedback from Your AI Interview Coach
            </h3>
            
            <p className="text-lg text-surface-600 mb-8">
              Our advanced AI analyzes your responses in real-time, providing specific feedback on content, delivery, and body language to help you improve with every practice session.
            </p>

            <div className="space-y-4">
              {[
                "Real-time speech analysis and feedback",
                "Body language and confidence scoring", 
                "Personalized improvement recommendations",
                "Progress tracking across sessions"
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
                    <div className="font-semibold text-surface-900">AI Coach</div>
                    <div className="text-surface-500 text-sm">Analyzing response...</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-700 font-medium text-sm">✓ Strong opening</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-yellow-700 font-medium text-sm">⚠ Add specific examples</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-blue-700 font-medium text-sm">💡 Improve eye contact</div>
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
              <div className="text-surface-900 font-semibold text-sm">89% Confidence</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;