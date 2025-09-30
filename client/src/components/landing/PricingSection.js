import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for getting started with interview prep",
      price: { monthly: 0, annual: 0 },
      badge: null,
      icon: null,
      features: [
        "5 AI practice sessions per month",
        "Basic performance analytics",
        "General interview questions",
        "Email support",
        "Mobile app access",
      ],
      limitations: [
        "No industry-specific questions",
        "No video recording",
        "Limited feedback detail",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Professional",
      description: "Most popular choice for serious job seekers",
      price: { monthly: 29, annual: 24 },
      badge: "Most Popular",
      icon: Zap,
      features: [
        "Unlimited AI practice sessions",
        "Advanced performance analytics",
        "Industry-specific question banks",
        "Video recording and playback",
        "Real-time AI feedback",
        "Personalized learning paths",
        "Priority email & chat support",
        "Interview scheduling assistant",
        "Resume optimization tips",
      ],
      limitations: [],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For teams and organizations",
      price: { monthly: 99, annual: 79 },
      badge: "Best Value",
      icon: Crown,
      features: [
        "Everything in Professional",
        "Team management dashboard",
        "Custom question creation",
        "Advanced analytics & reporting",
        "White-label options",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
        "24/7 phone support",
        "Onboarding & training",
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  const getPrice = (plan) => {
    const price = isAnnual ? plan.price.annual : plan.price.monthly;
    return price === 0 ? "Free" : `$${price}`;
  };

  const getSavings = (plan) => {
    if (plan.price.monthly === 0) return null;
    const monthlyCost = plan.price.monthly * 12;
    const annualCost = plan.price.annual * 12;
    const savings = monthlyCost - annualCost;
    return savings > 0 ? `Save $${savings}/year` : null;
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

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-surface-100 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                !isAnnual
                  ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                  : "text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isAnnual
                  ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                  : "text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white"
              }`}
            >
              Annual
              <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                          /{isAnnual ? "month" : "month"}
                        </span>
                      )}
                    </div>

                    {/* Savings */}
                    {isAnnual && getSavings(plan) && (
                      <div className="text-green-600 dark:text-green-400 text-sm font-medium">
                        {getSavings(plan)}
                      </div>
                    )}
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
                      to={plan.name === "Enterprise" ? "/contact" : "/register"}
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
