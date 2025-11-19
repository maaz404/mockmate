import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Check, Loader2, Crown, Star, Shield } from "lucide-react";
import axios from "axios";

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plans = [
    {
      name: "Free",
      price: "₨0",
      period: "forever",
      description: "Perfect for getting started with mock interviews",
      features: [
        "10 interviews per month",
        "Basic interview feedback",
        "Video recording & playback",
        "Behavioral questions",
        "Coding challenges",
        "Email support",
      ],
      cta: "Current Plan",
      popular: false,
      disabled: true,
      icon: Star,
    },
    {
      name: "Premium",
      price: "₨1,500",
      period: "per month",
      description: "Unlock unlimited interviews and advanced features",
      features: [
        "Unlimited interviews",
        "Advanced AI feedback",
        "Facial emotion analysis",
        "Speech pattern analysis",
        "Personalized recommendations",
        "Priority support",
        "Export detailed reports",
        "Calendar scheduling",
        "Custom interview scenarios",
      ],
      cta: "Upgrade to Premium",
      popular: true,
      disabled: false,
      icon: Crown,
    },
  ];

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Please log in to upgrade");
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/payments/create-checkout-session`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Backend wraps response in { success: true, data: { sessionId, url } }
      if (response.data.success && response.data.data?.url) {
        window.location.href = response.data.data.url;
      } else {
        setError("Failed to create checkout session. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      // Handle expired token
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Your session has expired. Please log in again.");
        localStorage.removeItem("accessToken");
        setTimeout(() => {
          navigate("/login", { state: { from: "/pricing" } });
        }, 2000);
      } else {
        setError(
          err.response?.data?.message || "Failed to start checkout process"
        );
      }
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/payments/create-portal-session`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      // Backend wraps response in { success: true, data: { url } }
      if (response.data.success && response.data.data?.url) {
        window.location.href = response.data.data.url;
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to open subscription portal"
      );
      setLoading(false);
    }
  };

  const isPremium = user?.subscription?.plan === "premium";

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-black">
      {/* Hero Section */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-surface-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>

          <p className="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
            Start practicing for free or unlock unlimited interviews with
            Premium
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4">
            <p className="text-error-700 dark:text-error-400 text-center font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Current Plan Banner */}
        {user && (
          <div className="mb-8 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                {isPremium ? (
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <Crown className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700">
                    <Star className="w-5 h-5 text-surface-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Current Plan
                  </p>
                  <p className="text-lg font-semibold text-surface-900 dark:text-white">
                    {isPremium ? "Premium" : "Free"}
                    {!isPremium && user.interviewsRemaining !== undefined && (
                      <span className="ml-2 text-sm font-normal text-surface-600 dark:text-surface-400">
                        ({user.interviewsRemaining} interviews remaining)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={index}
                className={`relative bg-white dark:bg-surface-800 rounded-2xl p-8 transition-all duration-200 ${
                  plan.popular
                    ? "border-2 border-primary-500 shadow-lg hover:shadow-xl"
                    : "border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-primary-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Icon & Plan Name */}
                <div className="flex items-center space-x-3 mb-4">
                  <div
                    className={`p-3 rounded-xl ${
                      plan.popular
                        ? "bg-primary-100 dark:bg-primary-900/30"
                        : "bg-surface-100 dark:bg-surface-700"
                    }`}
                  >
                    <IconComponent
                      className={`w-6 h-6 ${
                        plan.popular
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-surface-600 dark:text-surface-400"
                      }`}
                    />
                  </div>
                  <h2 className="text-2xl font-semibold font-heading text-surface-900 dark:text-white">
                    {plan.name}
                  </h2>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-surface-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="ml-2 text-surface-600 dark:text-surface-400">
                      / {plan.period}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-surface-600 dark:text-surface-400 mb-8">
                  {plan.description}
                </p>

                {/* Features List */}
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                      </div>
                      <span className="ml-3 text-surface-700 dark:text-surface-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.name === "Free" ? (
                  <button
                    disabled={!isPremium}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                      isPremium
                        ? "btn-secondary"
                        : "bg-surface-100 dark:bg-surface-700 text-surface-400 dark:text-surface-500 cursor-not-allowed"
                    }`}
                    onClick={isPremium ? handleManageSubscription : undefined}
                  >
                    {isPremium ? "Downgrade to Free" : "Current Plan"}
                  </button>
                ) : (
                  <button
                    onClick={
                      isPremium ? handleManageSubscription : handleUpgrade
                    }
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-xl font-semibold btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Processing...
                      </>
                    ) : isPremium ? (
                      "Manage Subscription"
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Money-back guarantee */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-surface-100 dark:bg-surface-800 px-6 py-3 rounded-full border border-surface-200 dark:border-surface-700">
            <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-surface-700 dark:text-surface-300 text-sm font-medium">
              7-Day Money-Back Guarantee
            </span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading text-surface-900 dark:text-white mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-surface-600 dark:text-surface-400">
              Everything you need to know about our pricing
            </p>
          </div>
          <div className="grid gap-6">
            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg text-surface-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                Yes! You can cancel your Premium subscription at any time.
                You'll continue to have access until the end of your billing
                period.
              </p>
            </div>
            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg text-surface-900 dark:text-white mb-2">
                What happens when I downgrade?
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                When you downgrade to Free, you'll return to the 5 interviews
                per month limit. Your interview history will be preserved.
              </p>
            </div>
            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg text-surface-900 dark:text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                We offer a 7-day money-back guarantee. If you're not satisfied
                with Premium, contact us within 7 days for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
