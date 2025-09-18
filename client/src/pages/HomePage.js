import React from "react";
import HeroSection from "../components/landing/HeroSection";
import TrustBarSection from "../components/landing/TrustBarSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import PricingSection from "../components/landing/PricingSection";
import FAQSection from "../components/landing/FAQSection";
import CTASection from "../components/landing/CTASection";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <HeroSection />
      <TrustBarSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default HomePage;
