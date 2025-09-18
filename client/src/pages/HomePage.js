import React, { useState } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const HomePage = () => {
  const { user } = useUser();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const features = [
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: "AI-Powered Questions",
      description:
        "Get personalized questions tailored to your role, experience, and target companies using advanced AI technology.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      title: "Real-time Feedback",
      description:
        "Practice with live video recording and receive instant AI feedback on your responses, body language, and presentation.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Performance Analytics",
      description:
        "Track your progress with detailed analytics, identify improvement areas, and measure your growth over time.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      title: "Comprehensive Library",
      description:
        "Access thousands of curated questions across all industries, roles, and difficulty levels to match your needs.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Lightning Fast Setup",
      description:
        "Start practicing in seconds. No lengthy setup required - just pick your role and begin your interview prep journey.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Proven Results",
      description:
        "Join thousands of successful candidates who landed their dream jobs after practicing with MockMate.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content:
        "MockMate helped me prepare for technical interviews at FAANG companies. The AI feedback was incredibly detailed and helped me improve my communication skills.",
      avatar: "SC",
    },
    {
      name: "Michael Rodriguez",
      role: "Product Manager at Microsoft",
      content:
        "The behavioral question practice was a game-changer. I felt so much more confident going into my interviews after using MockMate for just two weeks.",
      avatar: "MR",
    },
    {
      name: "Emily Johnson",
      role: "Data Scientist at Netflix",
      content:
        "The analytics feature showed me exactly where I needed to improve. I saw a 40% improvement in my interview scores within a month.",
      avatar: "EJ",
    },
  ];

  const stats = [
    { value: "50,000+", label: "Successful Interviews" },
    { value: "95%", label: "Success Rate" },
    { value: "1M+", label: "Questions Practiced" },
    { value: "500+", label: "Companies Represented" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-8">
                🎯 Trusted by 50,000+ job seekers
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
                Land Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                  Dream Job
                </span>
                in 30 Days
              </h1>

              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                Master interviews with AI-powered practice sessions, get instant
                feedback, and build unshakeable confidence. Join the thousands
                who've transformed their careers.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <SignedOut>
                  <Link
                    to="/register"
                    className="bg-white text-gray-900 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 text-lg"
                  >
                    Start Free Trial →
                  </Link>
                  <button
                    onClick={() => setIsVideoPlaying(true)}
                    className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-200 text-lg flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Watch Demo
                  </button>
                </SignedOut>

                <SignedIn>
                  <div className="mb-4">
                    <p className="text-blue-100 mb-4 text-lg">
                      Welcome back, {user?.firstName}! Ready to ace your next
                      interview?
                    </p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="bg-white text-gray-900 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-2xl text-lg"
                  >
                    Continue Practicing →
                  </Link>
                  <Link
                    to="/interview/new"
                    className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-200 text-lg"
                  >
                    Start New Interview
                  </Link>
                </SignedIn>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-blue-200">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-gray-900"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span>Join 50,000+ success stories</span>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  {!isVideoPlaying ? (
                    <>
                      <button
                        onClick={() => setIsVideoPlaying(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/30 transition-colors z-10"
                      >
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-900 ml-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>
                      <div className="relative z-0 text-center">
                        <div className="text-4xl mb-4">🎯</div>
                        <p className="text-white font-semibold">
                          See MockMate in Action
                        </p>
                        <p className="text-white/80 text-sm">
                          2 min demo video
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-800 rounded-2xl flex items-center justify-center">
                      <p className="text-white">Demo video would play here</p>
                    </div>
                  )}
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  95% Success Rate
                </div>
                <div className="absolute -bottom-4 -left-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  AI Powered
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="">
                <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform combines cutting-edge AI technology
              with proven interview strategies to give you the competitive edge
              you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How MockMate Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and see results in days. Our streamlined
              process makes interview prep effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Choose Your Path
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Select your target role, experience level, and companies you're
                interviewing with. Our AI customizes everything to your specific
                needs.
              </p>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Software Engineer
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Mid-level (3-5 years)
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  FAANG Companies
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Practice & Improve
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Practice with AI-generated questions tailored to your profile.
                Get real-time feedback on your answers, body language, and
                speaking pace.
              </p>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">Question</div>
                  <div className="text-sm text-gray-900">
                    "Tell me about a challenging project..."
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xs text-orange-600 mb-1">
                    AI Feedback
                  </div>
                  <div className="text-sm text-gray-900">
                    Great STAR structure! Consider adding more quantifiable
                    results.
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Land Your Job
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Track your improvement with detailed analytics. Feel confident
                and prepared when you walk into your real interview.
              </p>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-green-600 font-semibold text-lg">
                    95% Improvement
                  </div>
                  <div className="text-sm text-gray-600">
                    Ready for your interview!
                  </div>
                  <div className="mt-2 bg-green-500 h-2 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real people, real results. See how MockMate helped these
              professionals land their dream jobs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex text-yellow-400 mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Start free, upgrade when you're ready. No hidden fees, no long-term
            contracts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Free Plan
              </h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $0<span className="text-lg text-gray-600">/month</span>
              </div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>5 practice interviews</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Basic AI feedback</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Standard question library</span>
                </li>
              </ul>
              <SignedOut>
                <Link to="/register" className="btn-secondary w-full py-3">
                  Get Started Free
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard" className="btn-secondary w-full py-3">
                  Current Plan
                </Link>
              </SignedIn>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl p-8 border-2 border-orange-400 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-4">Pro Plan</h3>
              <div className="text-4xl font-bold mb-6">
                $29<span className="text-lg text-orange-100">/month</span>
              </div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Unlimited practice interviews</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Advanced AI feedback & analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Company-specific questions</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Video analysis & coaching</span>
                </li>
              </ul>
              <button className="bg-white text-orange-600 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-all duration-200 w-full">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <SignedOut>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join 50,000+ professionals who've already improved their interview
              skills with MockMate. Start your free trial today and see results
              within days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-gray-900 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-xl text-lg"
              >
                Start Free Trial →
              </Link>
              <a
                href="mailto:support@mockmate.ai"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-200 text-lg"
              >
                Contact Sales
              </a>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Start in 30 seconds
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Cancel anytime
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Welcome Back, {user?.firstName}! 🎯
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              You're part of an exclusive community of high-achievers. Let's
              continue building your interview confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="bg-white text-gray-900 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-xl text-lg"
              >
                Continue Practice →
              </Link>
              <Link
                to="/interview/new"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-200 text-lg"
              >
                Start New Interview
              </Link>
            </div>
          </SignedIn>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
