import Navbar from '../component/Navbar';
import { Herosection } from '../component/Herosection';
import { Features } from '../component/Features';
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

// Cryptocurrency data for home page - Reduced for production stability
const homeCryptoList = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: '🟡' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', icon: '🟦' },
];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Loading...</div>
            <div className="text-white text-lg font-bold">--</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
      {(Array.isArray(cryptoData) ? cryptoData : []).slice(0, 4).map((crypto) => (
        <div key={crypto.symbol} className="bg-gray-800 rounded-lg p-3 sm:p-4 hover:bg-gray-700 transition-colors">
          <div className="text-gray-400 text-sm">{crypto.name}</div>
          <div className="text-lg sm:text-xl font-bold text-white">
            ${parseFloat(crypto.price || 0).toFixed(2)}
          </div>
          <div className={`text-xs ${parseFloat(crypto.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {parseFloat(crypto.change24h || 0) >= 0 ? '+' : ''}{parseFloat(crypto.change24h || 0).toFixed(2)}%
          </div>
        </div>
      ))}
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
        <motion.section
          id="roadmap"
          custom={3}
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
          custom={4}
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