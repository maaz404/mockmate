import React from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";



const HomePage = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 px-4 md:px-0 pt-20 pb-12 flex items-center justify-center">
          <div className="w-full max-w-4xl mx-auto">
            {/* Hero Section */}
            <section className="bg-white rounded-3xl shadow-lg border border-slate-200 px-8 py-12 mb-10 flex flex-col items-center text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                MockMate
                <span className="ml-2 text-3xl align-middle">🎓</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-6 max-w-2xl">
                The academic, AI-powered platform for mastering interviews. Practice, get feedback, and track your progress—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/register" className="btn-primary px-8 py-3 text-lg">Get Started Free</a>
                <a href="/login" className="btn-secondary px-8 py-3 text-lg">Sign In</a>
              </div>
            </section>

            {/* Features Section */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Why MockMate?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-100 rounded-xl p-6 flex flex-col items-start shadow-sm border border-slate-200">
                  <span className="font-semibold text-slate-800 mb-2">AI-powered Interview Questions</span>
                  <span className="text-slate-500 text-sm">Practice with intelligent, adaptive questions tailored to your skills.</span>
                </div>
                <div className="bg-slate-100 rounded-xl p-6 flex flex-col items-start shadow-sm border border-slate-200">
                  <span className="font-semibold text-slate-800 mb-2">Real-time Feedback</span>
                  <span className="text-slate-500 text-sm">Get instant, actionable feedback on your answers and performance.</span>
                </div>
                <div className="bg-slate-100 rounded-xl p-6 flex flex-col items-start shadow-sm border border-slate-200">
                  <span className="font-semibold text-slate-800 mb-2">Progress Tracking</span>
                  <span className="text-slate-500 text-sm">Monitor your growth and identify areas for improvement.</span>
                </div>
                <div className="bg-slate-100 rounded-xl p-6 flex flex-col items-start shadow-sm border border-slate-200">
                  <span className="font-semibold text-slate-800 mb-2">Industry-specific Practice</span>
                  <span className="text-slate-500 text-sm">Choose from technical, behavioral, and system design interviews.</span>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Frequently Asked Questions</h2>
              <ul className="space-y-4 max-w-2xl mx-auto text-left">
                <li className="text-slate-700"><strong>How does MockMate work?</strong><br />MockMate uses AI to generate interview questions and provide feedback based on your answers.</li>
                <li className="text-slate-700"><strong>Is it free to use?</strong><br />Yes, you can get started for free and access core features.</li>
                <li className="text-slate-700"><strong>What types of interviews can I practice?</strong><br />Technical, behavioral, system design, and more.</li>
              </ul>
            </section>

            {/* Final Call to Action */}
            <section className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8 flex flex-col items-center justify-center shadow-md border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to ace your next interview?</h2>
              <p className="text-slate-700 mb-4">Sign up now and start practicing with AI-powered questions and feedback.</p>
              <a href="/register" className="btn-primary px-8 py-3 text-lg">Get Started Free</a>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
