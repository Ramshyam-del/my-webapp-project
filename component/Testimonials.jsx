import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Professional Trader",
      location: "Singapore",
      avatar: "👩‍💼",
      rating: 5,
      text: "The platform's advanced analytics and real-time data have transformed my trading strategy. I've seen a 40% improvement in my portfolio performance since joining.",
      highlight: "40% improvement",
      gradient: "from-blue-400 to-cyan-500",
      bgGradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      id: 2,
      name: "Marcus Rodriguez",
      role: "Crypto Investor",
      location: "Miami, USA",
      avatar: "👨‍💻",
      rating: 5,
      text: "Outstanding security features and user experience. The customer support team is incredibly responsive and knowledgeable. Highly recommend for both beginners and pros.",
      highlight: "Outstanding security",
      gradient: "from-green-400 to-emerald-500",
      bgGradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      id: 3,
      name: "Elena Petrov",
      role: "DeFi Enthusiast",
      location: "London, UK",
      avatar: "👩‍🔬",
      rating: 5,
      text: "The variety of trading pairs and low fees make this my go-to platform. The mobile app is seamless, and I can trade on the go without any issues.",
      highlight: "Low fees & seamless",
      gradient: "from-purple-400 to-pink-500",
      bgGradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      id: 4,
      name: "David Kim",
      role: "Institutional Trader",
      location: "Seoul, South Korea",
      avatar: "👨‍💼",
      rating: 5,
      text: "Exceptional liquidity and execution speed. The API integration is robust and reliable for our automated trading strategies. Best platform we've used.",
      highlight: "Exceptional liquidity",
      gradient: "from-yellow-400 to-orange-500",
      bgGradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      id: 5,
      name: "Aisha Patel",
      role: "Blockchain Developer",
      location: "Mumbai, India",
      avatar: "👩‍💻",
      rating: 5,
      text: "The technical infrastructure is impressive. Fast transactions, minimal downtime, and excellent developer tools. Perfect for both trading and building.",
      highlight: "Impressive infrastructure",
      gradient: "from-indigo-400 to-blue-500",
      bgGradient: "from-indigo-500/20 to-blue-500/20"
    },
    {
      id: 6,
      name: "James Wilson",
      role: "Portfolio Manager",
      location: "Toronto, Canada",
      avatar: "👨‍📊",
      rating: 5,
      text: "Comprehensive portfolio management tools and detailed analytics help me make informed decisions. The risk management features are top-notch.",
      highlight: "Top-notch risk management",
      gradient: "from-teal-400 to-green-500",
      bgGradient: "from-teal-500/20 to-green-500/20"
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isInView, testimonials.length]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <motion.span
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1, duration: 0.3 }}
      >
        ★
      </motion.span>
    ));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section ref={ref} className="relative py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-r from-green-500/5 to-teal-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            What Our Users Say
          </motion.h2>
          <motion.p 
            className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Join thousands of satisfied traders who trust our platform for their cryptocurrency journey
          </motion.p>
        </motion.div>

        {/* Featured Testimonial */}
        <motion.div
          className="mb-16 sm:mb-20"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="relative max-w-4xl mx-auto">
            {/* Main Testimonial Card */}
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className={`relative group cursor-pointer`}
            >
              {/* Card Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonials[currentTestimonial].bgGradient} rounded-3xl backdrop-blur-xl border border-white/10 group-hover:border-white/20 transition-all duration-300`}></div>
              
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonials[currentTestimonial].bgGradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`}></div>
              
              {/* Card Content */}
              <div className="relative p-8 sm:p-12">
                {/* Quote Icon */}
                <div className="absolute top-6 left-6 text-4xl text-white/20">"
                </div>
                
                {/* User Info */}
                <div className="flex items-center mb-6">
                  <div className="text-4xl mr-4">{testimonials[currentTestimonial].avatar}</div>
                  <div>
                    <h3 className={`text-xl font-bold bg-gradient-to-r ${testimonials[currentTestimonial].gradient} bg-clip-text text-transparent`}>
                      {testimonials[currentTestimonial].name}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {testimonials[currentTestimonial].role} • {testimonials[currentTestimonial].location}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center space-x-1">
                    {renderStars(testimonials[currentTestimonial].rating)}
                  </div>
                </div>
                
                {/* Testimonial Text */}
                <blockquote className="text-lg sm:text-xl text-gray-100 leading-relaxed mb-4 italic">
                  {testimonials[currentTestimonial].text}
                </blockquote>
                
                {/* Highlight */}
                <div className={`inline-block px-4 py-2 bg-gradient-to-r ${testimonials[currentTestimonial].gradient} bg-opacity-20 rounded-full text-sm font-semibold text-white border border-white/20`}>
                  ✨ {testimonials[currentTestimonial].highlight}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Testimonial Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {testimonials.slice(0, 6).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              onClick={() => setCurrentTestimonial(index)}
              className={`relative group cursor-pointer ${currentTestimonial === index ? 'ring-2 ring-white/30' : ''}`}
            >
              {/* Card Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.bgGradient} rounded-2xl backdrop-blur-xl border border-white/10 group-hover:border-white/20 transition-all duration-300`}></div>
              
              {/* Card Content */}
              <div className="relative p-6">
                {/* User Info */}
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-3">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <h4 className={`font-semibold bg-gradient-to-r ${testimonial.gradient} bg-clip-text text-transparent`}>
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-400 text-xs">{testimonial.role}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: testimonial.rating }, (_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">★</span>
                    ))}
                  </div>
                </div>
                
                {/* Testimonial Text */}
                <p className="text-gray-200 text-sm leading-relaxed line-clamp-3">
                  {testimonial.text}
                </p>
                
                {/* Location */}
                <div className="mt-3 text-xs text-gray-400 flex items-center">
                  <span className="mr-1">📍</span>
                  {testimonial.location}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation Dots */}
        <div className="flex justify-center space-x-2 mb-12">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentTestimonial === index 
                  ? 'bg-white scale-125' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-white mb-1">4.9/5</div>
            <div className="text-gray-400 text-sm">Average Rating</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-white mb-1">99.9%</div>
            <div className="text-gray-400 text-sm">Uptime</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-2">🔒</div>
            <div className="text-2xl font-bold text-white mb-1">100%</div>
            <div className="text-gray-400 text-sm">Secure</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl mb-2">🌍</div>
            <div className="text-2xl font-bold text-white mb-1">24/7</div>
            <div className="text-gray-400 text-sm">Support</div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16 sm:mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.p 
            className="text-gray-400 text-lg mb-6"
            whileHover={{ scale: 1.05 }}
          >
            Ready to join our community of successful traders?
          </motion.p>
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            whileHover={{ 
              boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)",
              y: -2
            }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Journey
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;