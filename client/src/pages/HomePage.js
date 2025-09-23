import React from "react";
import HeroSection from "../components/landing/HeroSection";
import TrustBarSection from "../components/landing/TrustBarSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import SystemArchitectureSection from "../components/landing/SystemArchitectureSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import PricingSection from "../components/landing/PricingSection";
import FAQSection from "../components/landing/FAQSection";
import CTASection from "../components/landing/CTASection";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <HeroSection />
      <TrustBarSection />
      <FeaturesSection />
      <SystemArchitectureSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default HomePage;
