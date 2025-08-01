import { Navbar } from '../component/Navbar';
import { Herosection } from '../component/Herosection';
import { Features } from '../component/Features';
import { Roadmap } from '../component/Roadmap';
import { Tokenomics } from '../component/Tokenomics';
import { Footer } from '../component/Footer';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

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

// Cryptocurrency data for home page
const homeCryptoList = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: '🟡' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', icon: '🟦' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', icon: '🟦' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', icon: '🟣' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', icon: '🟣' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', icon: '🔗' },
];

// Crypto Price Component
const CryptoPrices = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getMockPrice = (symbol) => {
    const prices = {
      'BTC': (Math.random() * 20000 + 40000).toFixed(2),
      'ETH': (Math.random() * 1000 + 2000).toFixed(2),
      'BNB': (Math.random() * 100 + 300).toFixed(2),
      'SOL': (Math.random() * 50 + 100).toFixed(2),
      'ADA': (Math.random() * 0.5 + 0.5).toFixed(4),
      'DOT': (Math.random() * 10 + 5).toFixed(2),
      'MATIC': (Math.random() * 2 + 1).toFixed(3),
      'LINK': (Math.random() * 20 + 10).toFixed(2),
    };
    return prices[symbol] || (Math.random() * 100 + 10).toFixed(2);
  };

  const getMockChange = () => {
    return (Math.random() * 20 - 10).toFixed(2);
  };

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const cryptoIds = homeCryptoList.map(crypto => crypto.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const formattedData = homeCryptoList.map(crypto => {
        const cryptoData = data[crypto.id];
        if (!cryptoData || !cryptoData.usd) {
          // If API data is missing, use mock data
          return {
            id: crypto.id,
            name: crypto.name,
            symbol: crypto.symbol,
            icon: crypto.icon,
            price: getMockPrice(crypto.symbol),
            change: getMockChange(),
          };
        }
        
        return {
          id: crypto.id,
          name: crypto.name,
          symbol: crypto.symbol,
          icon: crypto.icon,
          price: cryptoData.usd.toFixed(2),
          change: cryptoData.usd_24h_change?.toFixed(2) || '0.00',
        };
      });
      
      setCryptoData(formattedData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching crypto data:', err);
      setError(true);
      
      // Always provide fallback data
      const mockData = homeCryptoList.map(crypto => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol,
        icon: crypto.icon,
        price: getMockPrice(crypto.symbol),
        change: getMockChange(),
      }));
      
      setCryptoData(mockData);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-8 md:py-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          🚀 Live Cryptocurrency Prices
        </h2>
        <p className="text-blue-100 text-lg">
          Real-time market data from global exchanges
        </p>
        {error && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-sm">
              ⚠️ Using demo data - API temporarily unavailable
            </p>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cryptoData.map((crypto) => (
            <motion.div
              key={crypto.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{crypto.icon}</span>
                  <div>
                    <div className="font-semibold text-white">{crypto.symbol}</div>
                    <div className="text-xs text-blue-200">{crypto.name}</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">${crypto.price}</div>
                <div className={`text-sm font-medium ${
                  parseFloat(crypto.change) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {parseFloat(crypto.change) >= 0 ? '+' : ''}{crypto.change}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="text-center mt-8">
        <a
          href="/exchange"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
        >
          View Full Exchange
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-700 via-cyan-600 to-purple-700">
      <Navbar />
      <main className="flex-1 flex flex-col gap-16 md:gap-24">
        <motion.section
          id="herosection"
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className={`pt-8 md:pt-16 pb-8 md:pb-16 mx-auto w-full max-w-5xl px-4 ${glass} scroll-mt-24`}
        >
          <Herosection />
        </motion.section>
        
        {/* Crypto Prices Section - Always Visible */}
        <section className="py-8 md:py-16 mx-auto w-full max-w-6xl px-4">
          <div className={`${glass} p-8`}>
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
          className={`py-8 md:py-16 mx-auto w-full max-w-5xl px-4 ${glass} scroll-mt-24`}
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