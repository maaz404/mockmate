import React from "react";
import { motion } from "framer-motion";

const TrustBarSection = () => {
  const companies = [
    { name: "TechCorp", logo: "TC" },
    { name: "InnovateLabs", logo: "IL" },
    { name: "DataSystems", logo: "DS" },
    { name: "CloudFirst", logo: "CF" },
    { name: "StartupX", logo: "SX" },
    { name: "Enterprise Co", logo: "EC" },
  ];

  return (
    <section className="py-16 bg-surface-50 border-b border-surface-200">
      <div className="max-w-7xl mx-auto container-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-surface-600 font-medium mb-8">
            Trusted by candidates at top companies worldwide
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {companies.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-center"
              >
                <div className="group cursor-pointer">
                  <div className="w-16 h-16 bg-white rounded-xl shadow-surface border border-surface-200 flex items-center justify-center mb-2 group-hover:shadow-surface-md transition-shadow duration-200">
                    <span className="text-surface-700 font-bold text-lg">
                      {company.logo}
                    </span>
                  </div>
                  <div className="text-surface-600 text-sm font-medium text-center">
                    {company.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center border-t border-surface-200 pt-12"
        >
          <div>
            <div className="text-3xl lg:text-4xl font-bold text-surface-900 mb-2">
              50K+
            </div>
            <div className="text-surface-600 font-medium">
              Interviews Completed
            </div>
          </div>
          <div>
            <div className="text-3xl lg:text-4xl font-bold text-surface-900 mb-2">
              89%
            </div>
            <div className="text-surface-600 font-medium">Success Rate</div>
          </div>
          <div>
            <div className="text-3xl lg:text-4xl font-bold text-surface-900 mb-2">
              500+
            </div>
            <div className="text-surface-600 font-medium">Companies</div>
          </div>
          <div>
            <div className="text-3xl lg:text-4xl font-bold text-surface-900 mb-2">
              4.9/5
            </div>
            <div className="text-surface-600 font-medium">User Rating</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustBarSection;
