import React from "react";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    project: [
      { name: "Features", href: "#features" },
      { name: "Architecture", href: "#architecture" },
      { name: "Live Demo", href: "/register" },
      { name: "Technical Docs", href: "#faq" },
    ],
    information: [
      { name: "Project Overview", href: "#about" },
      { name: "Technologies Used", href: "#features" },
      { name: "System Design", href: "#architecture" },
      { name: "Academic Goals", href: "#about" },
    ],
    resources: [
      { name: "Technical FAQ", href: "#faq" },
      { name: "User Guide", href: "/help" },
      { name: "API Documentation", href: "/api" },
      { name: "Source Code", href: "#" },
    ],
    academic: [
      { name: "Project Report", href: "#" },
      { name: "Development Log", href: "#" },
      { name: "Learning Outcomes", href: "#about" },
      { name: "Future Enhancements", href: "#faq" },
    ],
  };

  const socialLinks = [
    { name: "GitHub", icon: Github, href: "#" },
    { name: "Project Demo", icon: Twitter, href: "/register" },
    {
      name: "Technical Docs",
      icon: Linkedin,
      href: "#faq",
    },
    { name: "Contact", icon: Mail, href: "mailto:project@mockmate.dev" },
  ];

  return (
    <footer className="bg-surface-900 text-surface-300">
      <div className="max-w-7xl mx-auto container-padding section-padding">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-white">MockMate</span>
            </div>
            <p className="text-surface-400 mb-6 max-w-md">
              A comprehensive full-stack web application demonstrating modern
              development practices, AI integration, and sophisticated system
              architecture as a final year academic project.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 bg-surface-800 rounded-lg flex items-center justify-center hover:bg-surface-700 transition-colors duration-200 group"
                    aria-label={social.name}
                  >
                    <Icon
                      size={18}
                      className="text-surface-400 group-hover:text-white transition-colors"
                    />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Project Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Project</h3>
            <ul className="space-y-3">
              {footerLinks.project.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-surface-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Information Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Information</h3>
            <ul className="space-y-3">
              {footerLinks.information.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-surface-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-surface-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Academic Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Academic</h3>
            <ul className="space-y-3">
              {footerLinks.academic.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-surface-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-surface-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-surface-400 text-sm">
              © {currentYear} MockMate Academic Project. Developed as final year
              computer science project by Maaz Sheikh.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a
                href="#faq"
                className="text-surface-400 hover:text-white transition-colors duration-200"
              >
                Technical Docs
              </a>
              <a
                href="#about"
                className="text-surface-400 hover:text-white transition-colors duration-200"
              >
                Project Info
              </a>
              <a
                href="/cookies"
                className="text-surface-400 hover:text-white transition-colors duration-200"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
