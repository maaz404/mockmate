import React from "react";
import HeroSection from "../components/landing/HeroSection";
import TechStackSection from "../components/landing/TrustBarSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import ProjectInfoSection from "../components/landing/TestimonialsSection";
import SystemArchitectureSection from "../components/landing/SystemArchitectureSection";
import FAQSection from "../components/landing/FAQSection";
import ProjectShowcaseSection from "../components/landing/CTASection";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <HeroSection />
      <TechStackSection />
      <FeaturesSection />
      <ProjectInfoSection />
      <SystemArchitectureSection />
      <FAQSection />
      <ProjectShowcaseSection />
    </div>
  );
};

export default HomePage;
