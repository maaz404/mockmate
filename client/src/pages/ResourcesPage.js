import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, MessageSquare, Briefcase } from "lucide-react";

const ResourcesPage = () => {
  const resources = [
    {
      title: "Interview Tips",
      description: "Essential tips for acing your interviews",
      icon: MessageSquare,
      link: "/question-bank",
      linkText: "Learn More",
    },
    {
      title: "Common Questions",
      description: "Most frequently asked interview questions",
      icon: BookOpen,
      link: "/question-bank",
      linkText: "View Questions",
    },
    {
      title: "Career Guides",
      description: "Role-specific interview preparation guides",
      icon: Briefcase,
      link: "/question-bank",
      linkText: "Browse Guides",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-200">
      <main className="px-6 py-8 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-surface-900 dark:text-surface-50">
            Learning Resources
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Guides, tips, and materials to help you succeed in interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <div
                key={index}
                className="card flex flex-col hover:shadow-surface-lg transition-all duration-200"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon
                    size={24}
                    className="text-primary-600 dark:text-primary-400"
                  />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  {resource.title}
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-6 flex-grow">
                  {resource.description}
                </p>
                <Link
                  to={resource.link}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium self-start group"
                >
                  {resource.linkText}
                  <ArrowRight
                    size={16}
                    className="ml-1 group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ResourcesPage;
