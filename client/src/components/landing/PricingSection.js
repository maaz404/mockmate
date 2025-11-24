import React from "react";
import { motion } from "framer-motion";
import { Check, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PricingSection = () => {
  const plans = [
    {
      name: "Free",
      description: "Perfect for getting started with interview prep",
      price: { monthly: 0, annual: 0 },
      badge: null,
      icon: null,
      features: [
        "10 AI practice interviews per month",
        "Basic performance analytics",
        "General interview questions",
        "Email support",
        "Video recording and playback",
        "Real-time AI feedback",
      ],
      limitations: [
        "Limited to 10 interviews per month",
        "Basic analytics only",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Premium",
      description: "Unlimited interviews and advanced features",
      price: { monthly: 1500, annual: 1500 },
      badge: "Most Popular",
      icon: Zap,
      features: [
        "Unlimited AI practice sessions",
        "Advanced performance analytics",
        "Industry-specific question banks",
        "Video recording and playback",
        "Real-time AI feedback",
        "Emotion analysis during interviews",
        "Detailed performance reports",
        "Multi-language support",
        "Priority support",
        "Export interview results",
      ],
      limitations: [],
      cta: "Upgrade to Premium",
      popular: true,
    },
  ];

  const getPrice = (plan) => {
    return plan.price.monthly === 0 ? "Free" : `Rs ${plan.price.monthly}`;
  };

  return (
    <section
      id="pricing"
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
          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white mb-6">
            Choose Your <span className="gradient-text">Success Plan</span>
          </h2>

          <p className="text-xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto mb-8">
            Invest in your career with plans designed to help you land your
            dream job faster and with more confidence.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${plan.popular ? "lg:scale-105" : ""}`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div
                  className={`card h-full flex flex-col ${
                    plan.popular
                      ? "border-primary-200 dark:border-primary-400/30 shadow-surface-xl"
                      : "border-surface-200 dark:border-surface-700"
                  }`}
                >
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-4">
                      {Icon && (
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mr-3">
                          <Icon size={24} className="text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white">
                          {plan.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-surface-600 dark:text-surface-300 mb-4">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-surface-900 dark:text-white">
                        {getPrice(plan)}
                      </span>
                      {plan.price.monthly > 0 && (
                        <span className="text-surface-600 dark:text-surface-300 text-lg">
                          /month
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex-grow mb-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-5 h-5 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check
                              size={12}
                              className="text-green-600 dark:text-green-400"
                            />
                          </div>
                          <span className="text-surface-700 dark:text-surface-300 text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div>
                    <Link
                      to={plan.name === "Premium" ? "/pricing" : "/dashboard"}
                      className={`w-full inline-flex items-center justify-center py-3 px-6 rounded-xl font-semibold transition-all duration-200 group ${
                        plan.popular ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight
                        size={16}
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-surface-600 dark:text-surface-400">
            Have questions about our plans?{" "}
            <a
              href="#faq"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Check our FAQ
            </a>{" "}
            or{" "}
            <a
              href="#contact"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              contact our team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
