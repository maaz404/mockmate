import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(0);

  const faqs = [
    {
      question: "What technologies power the MockMate platform?",
      answer:
        "MockMate is built using a modern full-stack architecture: React 18.2.0 with hooks for the frontend, Node.js with Express.js for the backend, MongoDB as the database, Clerk for authentication, and Tailwind CSS for responsive styling. The platform also integrates with AI APIs for natural language processing and feedback generation.",
    },
    {
      question: "How does the AI feedback system work technically?",
      answer:
        "The AI system processes user responses through natural language processing APIs, analyzing semantic content, coherence, and technical accuracy. The backend implements asynchronous processing with Node.js streams to handle real-time analysis, storing results in MongoDB and returning structured feedback through RESTful endpoints.",
    },
    {
      question: "What database design patterns are implemented?",
      answer:
        "The system uses MongoDB with Mongoose ODM for schema validation and data modeling. Key patterns include document embedding for related data, aggregation pipelines for analytics, proper indexing for query optimization, and data normalization where appropriate to maintain referential integrity.",
    },
    {
      question: "How is user authentication and security handled?",
      answer:
        "Authentication is managed through Clerk, providing JWT-based session management, role-based access control, and secure user registration/login flows. The backend implements security middleware for API protection, input validation, and error handling to prevent common security vulnerabilities.",
    },
    {
      question: "What development methodologies were followed?",
      answer:
        "The project follows modern software development practices including component-based architecture, RESTful API design, responsive web design principles, version control with Git, modular code organization, and comprehensive error handling throughout the application stack.",
    },
    {
      question: "How does the real-time processing work?",
      answer:
        "Real-time features are implemented using Node.js event-driven architecture with asynchronous processing. The system handles concurrent user sessions through non-blocking I/O operations, maintains state consistency, and provides immediate feedback through optimized API response times.",
    },
    {
      question: "What are the system's scalability considerations?",
      answer:
        "The architecture is designed for scalability with stateless backend services, database indexing for performance, component reusability in the frontend, efficient API design, and modular code structure that allows for easy feature expansion and maintenance.",
    },
    {
      question: "How is data visualization implemented?",
      answer:
        "The dashboard uses Chart.js integration with React components to visualize user performance metrics. Data is processed through MongoDB aggregation pipelines and served via API endpoints, with responsive charts that adapt to different screen sizes and provide interactive user analytics.",
    },
    {
      question: "What were the main technical challenges?",
      answer:
        "Key challenges included implementing real-time AI processing, managing asynchronous data flows, creating responsive UI components, integrating multiple APIs efficiently, designing scalable database schemas, and ensuring consistent user experience across different devices and browsers.",
    },
    {
      question: "How can the project be extended or improved?",
      answer:
        "Future enhancements could include implementing WebSocket connections for real-time updates, adding microservices architecture, incorporating machine learning models, expanding API functionality, adding comprehensive testing suites, and implementing DevOps practices for automated deployment.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? -1 : index);
  };

  return (
    <section id="faq" className="section-padding bg-surface-50">
      <div className="max-w-4xl mx-auto container-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-white border border-surface-200 rounded-full px-4 py-2 mb-6">
            <HelpCircle size={16} className="text-primary-600" />
            <span className="text-surface-700 text-sm font-medium">
              Technical Documentation
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            Technical <span className="gradient-text">Overview</span>
          </h2>

          <p className="text-xl text-surface-600">
            Comprehensive answers to technical questions about the system
            architecture, implementation details, and development methodologies
            used in the MockMate project.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl border border-surface-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-surface-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-surface-900 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openFAQ === index ? (
                    <Minus size={20} className="text-primary-600" />
                  ) : (
                    <Plus size={20} className="text-surface-400" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {openFAQ === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <div className="border-t border-surface-200 pt-4">
                        <p className="text-surface-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Still have questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <div className="bg-white rounded-2xl shadow-surface border border-surface-200 p-8">
            <h3 className="text-2xl font-bold text-surface-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-surface-600 mb-6">
              Our team is here to help you succeed. Reach out and we'll get back
              to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@mockmate.com" className="btn-primary">
                Contact Support
              </a>
              <a href="/help" className="btn-secondary">
                Help Center
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
