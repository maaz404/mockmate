import React from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at TechCorp",
      avatar: "SC",
      content: "MockMate's AI feedback helped me identify and fix my interview weaknesses. I landed my dream job at a top tech company after just 2 weeks of practice!",
      rating: 5,
      highlight: "Landed dream job"
    },
    {
      name: "David Rodriguez",
      role: "Product Manager at StartupX",
      avatar: "DR", 
      content: "The personalized learning path was a game-changer. MockMate adapted to my experience level and focused on areas where I needed the most improvement.",
      rating: 5,
      highlight: "Personalized approach"
    },
    {
      name: "Emily Thompson",
      role: "Data Scientist at DataSystems",
      avatar: "ET",
      content: "Real-time feedback during practice sessions made all the difference. I went from nervous and unprepared to confident and articulate in my interviews.",
      rating: 5,
      highlight: "Boosted confidence"
    },
    {
      name: "Michael Park",
      role: "UX Designer at InnovateLabs",
      avatar: "MP",
      content: "The industry-specific questions helped me prepare for exactly what companies were looking for. I received multiple offers after using MockMate.",
      rating: 5,
      highlight: "Multiple offers"
    },
    {
      name: "Jessica Wang",
      role: "Marketing Manager at CloudFirst",
      avatar: "JW",
      content: "MockMate's analytics showed me exactly where I was losing points in interviews. The detailed feedback helped me improve systematically.",
      rating: 5,
      highlight: "Systematic improvement"
    },
    {
      name: "Alex Johnson",
      role: "Frontend Developer at Enterprise Co",
      avatar: "AJ",
      content: "The mock video interviews felt so realistic that when I had my actual interview, it felt like just another practice session. Highly recommend!",
      rating: 5,
      highlight: "Realistic practice"
    }
  ];

  return (
    <section className="section-padding bg-surface-50">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-white border border-surface-200 rounded-full px-4 py-2 mb-6">
            <Quote size={16} className="text-primary-600" />
            <span className="text-surface-700 text-sm font-medium">
              Success Stories
            </span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            What Our Users Say About{" "}
            <span className="gradient-text">MockMate</span>
          </h2>
          
          <p className="text-xl text-surface-600 max-w-3xl mx-auto">
            Join thousands of successful candidates who landed their dream jobs with MockMate's AI-powered interview preparation.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-surface border border-surface-200 p-6 hover:shadow-surface-lg group-hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <blockquote className="text-surface-700 leading-relaxed mb-6 flex-grow">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-surface-900">
                        {testimonial.name}
                      </div>
                      <div className="text-surface-600 text-sm">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  
                  {/* Highlight Badge */}
                  <div className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                    {testimonial.highlight}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-white rounded-2xl shadow-surface border border-surface-200 p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-surface-900 mb-2">2,000+</div>
                <div className="text-surface-600 font-medium">Happy Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-surface-900 mb-2">4.9/5</div>
                <div className="text-surface-600 font-medium">Average Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-surface-900 mb-2">89%</div>
                <div className="text-surface-600 font-medium">Success Rate</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;