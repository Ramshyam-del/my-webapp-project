import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export const Herosection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800/20 via-gray-700/20 to-gray-600/20 animate-pulse"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(75, 85, 99, 0.2) 0%, transparent 50%)`
          }}
        ></div>
      </div>

      {/* Floating Elements */}
      <motion.div 
        className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full opacity-15 blur-xl"
        variants={floatingVariants}
        animate="animate"
      ></motion.div>
      <motion.div 
        className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full opacity-10 blur-2xl"
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 1 }}
      ></motion.div>
      <motion.div 
        className="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full opacity-20 blur-lg"
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 2 }}
      ></motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
              Power to the People
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-gradient-x">
              One Token at a Time
            </span>
          </motion.h1>
        </motion.div>

        <motion.p 
          variants={itemVariants}
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 max-w-4xl mb-8 sm:mb-12 leading-relaxed font-light"
        >
          Quantex is the <span className="text-cyan-400 font-semibold">next-gen community-powered</span> decentralized token — built for <span className="text-purple-400 font-semibold">fairness</span>, <span className="text-blue-400 font-semibold">transparency</span>, and <span className="text-pink-400 font-semibold">revolution</span>.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center"
        >
          <motion.a 
            href="#features" 
            className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Explore Features</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
          </motion.a>
          
          <motion.a 
            href="/market" 
            className="group relative bg-transparent border-2 border-purple-500 hover:bg-purple-500 text-purple-400 hover:text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 hover:scale-105"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">View Markets</span>
            <div className="absolute inset-0 bg-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
          </motion.a>
        </motion.div>

        {/* Stats Preview */}
        <motion.div 
          variants={itemVariants}
          className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-2">$2.4M+</div>
            <div className="text-sm text-gray-300">Total Volume</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">15K+</div>
            <div className="text-sm text-gray-300">Active Users</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold text-pink-400 mb-2">99.9%</div>
            <div className="text-sm text-gray-300">Uptime</div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};