import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(0);

  const faqs = [
    {
      question: "How does MockMate's AI interview coaching work?",
      answer:
        "MockMate uses advanced AI to analyze your responses, body language, and speech patterns during practice interviews. It provides real-time feedback on areas like content quality, confidence, pacing, and eye contact. The AI learns from thousands of successful interviews to give you personalized recommendations for improvement.",
    },
    {
      question: "What types of interviews can I practice with MockMate?",
      answer:
        "You can practice various interview types including behavioral interviews, technical interviews, case studies, and industry-specific scenarios. We have questions from top companies across tech, finance, consulting, healthcare, and more. You can also practice different formats like phone interviews, video calls, and in-person simulations.",
    },
    {
      question:
        "How is MockMate different from other interview prep platforms?",
      answer:
        "MockMate stands out with its advanced AI coaching that provides instant, personalized feedback. Unlike generic practice platforms, our AI adapts to your specific industry, experience level, and target companies. We also offer real-time analysis, video recording capabilities, and comprehensive analytics to track your progress over time.",
    },
    {
      question: "Can I practice interviews for specific companies?",
      answer:
        "Yes! MockMate has curated question banks from hundreds of top companies including Google, Amazon, Microsoft, Goldman Sachs, McKinsey, and many more. You can filter questions by company, role, and difficulty level to practice exactly what you might encounter in your target interviews.",
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Yes, we offer a 7-day free trial of our Professional plan, giving you full access to all features including unlimited practice sessions, AI feedback, and industry-specific questions. No credit card is required to start your trial. You can also use our Starter plan for free with limited features.",
    },
    {
      question: "How much does MockMate cost?",
      answer:
        "We offer three plans: Starter (free with basic features), Professional ($29/month or $24/month annually), and Enterprise ($99/month or $79/month annually). The Professional plan is our most popular option, offering unlimited practice sessions and advanced AI feedback.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Absolutely! You can cancel your subscription at any time through your account settings. There are no long-term commitments or cancellation fees. If you cancel, you'll continue to have access to your plan features until the end of your current billing period.",
    },
    {
      question: "Does MockMate work on mobile devices?",
      answer:
        "Yes, MockMate is fully optimized for mobile devices. You can practice interviews, receive AI feedback, and track your progress on both iOS and Android devices through our responsive web app. We also have dedicated mobile apps available for download.",
    },
    {
      question: "How do I get started with MockMate?",
      answer:
        "Getting started is easy! Simply sign up for a free account, complete a brief profile setup to tell us about your goals and experience, and you can immediately start practicing with our AI coach. The platform will recommend a personalized learning path based on your information.",
    },
    {
      question: "What kind of support does MockMate provide?",
      answer:
        "We provide comprehensive support including email support for all users, live chat for Professional plan users, and dedicated account management for Enterprise customers. We also have extensive documentation, video tutorials, and a community forum where you can connect with other job seekers.",
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
              Frequently Asked Questions
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            Got Questions? We've Got{" "}
            <span className="gradient-text">Answers</span>
          </h2>

          <p className="text-xl text-surface-600">
            Find answers to common questions about MockMate's AI interview
            preparation platform.
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
