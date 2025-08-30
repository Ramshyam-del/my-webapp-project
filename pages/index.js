import Navbar from '../component/Navbar';
import { Herosection } from '../component/Herosection';
import { Features } from '../component/Features';
import { Statistics } from '../component/Statistics';
import { Testimonials } from '../component/Testimonials';
import { Roadmap } from '../component/Roadmap';
import { Tokenomics } from '../component/Tokenomics';
import Footer from '../component/Footer';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const glass = "backdrop-blur-md bg-white/20 border border-white/20 rounded-2xl shadow-xl";
const sectionVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: 'easeOut',
    },
  }),
};

// Cryptocurrency data for home page - Enhanced with colors and icons
const homeCryptoList = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: 'from-orange-400 to-yellow-500', bgColor: 'from-orange-500/20 to-yellow-500/20' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'from-blue-400 to-purple-500', bgColor: 'from-blue-500/20 to-purple-500/20' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: '🟡', color: 'from-yellow-400 to-orange-500', bgColor: 'from-yellow-500/20 to-orange-500/20' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', icon: '🟦', color: 'from-purple-400 to-pink-500', bgColor: 'from-purple-500/20 to-pink-500/20' },
];

// Helper function to get crypto styling
const getCryptoStyling = (symbol) => {
  const crypto = homeCryptoList.find(c => c.symbol === symbol);
  return crypto || { icon: '💎', color: 'from-gray-400 to-gray-500', bgColor: 'from-gray-500/20 to-gray-600/20' };
};

// Crypto Price Component
const CryptoPrices = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crypto/top-all');
      
      if (response.ok) {
        const payload = await response.json();
        const list = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload?.data) ? payload.data : []);
        if (list.length > 0) {
          setCryptoData(list);
        } else {
          // Fallback data when payload structure is unexpected
          setCryptoData([
            { symbol: 'BTC', name: 'Bitcoin', price: 43250.50, change24h: 2.45 },
            { symbol: 'ETH', name: 'Ethereum', price: 2650.75, change24h: 1.87 },
            { symbol: 'BNB', name: 'BNB', price: 312.40, change24h: 0.92 },
            { symbol: 'SOL', name: 'Solana', price: 98.25, change24h: 3.21 },
            { symbol: 'XRP', name: 'XRP', price: 0.5245, change24h: 1.23 },
            { symbol: 'TRX', name: 'TRON', price: 0.0892, change24h: 0.78 }
          ]);
        }
      } else {
        console.error('Failed to fetch crypto data');
        // Use fallback data for production
        setCryptoData([
          { symbol: 'BTC', name: 'Bitcoin', price: 43250.50, change24h: 2.45 },
          { symbol: 'ETH', name: 'Ethereum', price: 2650.75, change24h: 1.87 },
          { symbol: 'BNB', name: 'BNB', price: 312.40, change24h: 0.92 },
          { symbol: 'SOL', name: 'Solana', price: 98.25, change24h: 3.21 },
          { symbol: 'XRP', name: 'XRP', price: 0.5245, change24h: 1.23 },
          { symbol: 'TRX', name: 'TRON', price: 0.0892, change24h: 0.78 }
        ]);
      }
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      // Use fallback data for production
      setCryptoData([
        { symbol: 'BTC', name: 'Bitcoin', price: 43250.50, change24h: 2.45 },
        { symbol: 'ETH', name: 'Ethereum', price: 2650.75, change24h: 1.87 },
        { symbol: 'BNB', name: 'BNB', price: 312.40, change24h: 0.92 },
        { symbol: 'SOL', name: 'Solana', price: 98.25, change24h: 3.21 },
        { symbol: 'XRP', name: 'XRP', price: 0.5245, change24h: 1.23 },
        { symbol: 'TRX', name: 'TRON', price: 0.0892, change24h: 0.78 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 px-2 sm:px-0">
        {[1, 2, 3, 4].map((i) => (
          <motion.div 
            key={i} 
            className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full"></div>
                <div className="w-12 h-4 bg-gray-700 rounded"></div>
              </div>
              <div className="h-6 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-16"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl animate-enhanced-pulse"></div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 px-2 sm:px-0">
        {[1, 2, 3, 4].map((i) => (
          <motion.div 
            key={i} 
            className="relative bg-gradient-to-br from-red-900/20 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-sm">!</div>
              <div className="text-red-400 text-xs">Error</div>
            </div>
            <div className="text-gray-400 text-sm mb-1">Connection Failed</div>
            <div className="text-white text-lg font-bold">--</div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 px-2 sm:px-0">
      {(Array.isArray(cryptoData) ? cryptoData : []).slice(0, 4).map((crypto, index) => {
        const styling = getCryptoStyling(crypto.symbol);
        const isPositive = parseFloat(crypto.change24h || 0) >= 0;
        
        return (
          <motion.div 
            key={crypto.symbol} 
            className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            whileHover={{ 
              scale: 1.05, 
              y: -5,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${styling.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 bg-gradient-to-r ${styling.color} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                  {styling.icon}
                </div>
                <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  {crypto.symbol}
                </div>
              </div>
              
              {/* Name */}
              <div className="text-gray-300 text-sm font-medium mb-2">{crypto.name}</div>
              
              {/* Price */}
              <div className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                ${parseFloat(crypto.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              
              {/* Change */}
              <div className="flex items-center space-x-1">
                <div className={`text-sm font-semibold ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositive ? '↗' : '↘'}
                </div>
                <div className={`text-sm font-bold ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositive ? '+' : ''}{parseFloat(crypto.change24h || 0).toFixed(2)}%
                </div>
              </div>
            </div>
            
            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-700 via-cyan-600 to-purple-700">
      <Navbar />
      <main className="flex-1 flex flex-col gap-8 sm:gap-12 md:gap-16 lg:gap-24">
        <motion.section
          id="herosection"
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className={`pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 lg:pb-16 mx-auto w-full max-w-5xl px-3 sm:px-4 ${glass} scroll-mt-20 sm:scroll-mt-24`}
        >
          <Herosection />
        </motion.section>
        
        {/* Crypto Prices Section - Always Visible */}
        <section className="py-6 sm:py-8 md:py-12 lg:py-16 mx-auto w-full max-w-6xl px-3 sm:px-4">
          <div className={`${glass} p-4 sm:p-6 md:p-8`}>
            <CryptoPrices />
          </div>
        </section>
        
        <motion.section
          id="features"
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className={`py-6 sm:py-8 md:py-12 lg:py-16 mx-auto w-full max-w-5xl px-3 sm:px-4 ${glass} scroll-mt-20 sm:scroll-mt-24`}
        >
          <Features />
        </motion.section>
        
        {/* Statistics Section */}
        <motion.section
          id="statistics"
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className="w-full"
        >
          <Statistics />
        </motion.section>
        
        {/* Testimonials Section */}
        <motion.section
          id="testimonials"
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className="w-full"
        >
          <Testimonials />
        </motion.section>
        
        <motion.section
          id="roadmap"
          custom={5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className={`py-8 md:py-16 mx-auto w-full max-w-5xl px-4 ${glass} scroll-mt-24`}
        >
          <Roadmap />
        </motion.section>
        <motion.section
          id="tokenomics"
          custom={6}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className={`py-8 md:py-16 mx-auto w-full max-w-5xl px-4 ${glass} scroll-mt-24`}
        >
          <Tokenomics />
        </motion.section>
      </main>
      <Footer />
    </div>
  );
}