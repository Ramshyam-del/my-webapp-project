import { Navbar } from '../component/Navbar';
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
          change: cryptoData.usd_24h_change?.toFixed(2) || getMockChange(),
        };
      });
      
      setCryptoData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      setError(true);
      setLoading(false);
      
      // Use mock data as fallback
      const mockData = homeCryptoList.map(crypto => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol,
        icon: crypto.icon,
        price: getMockPrice(crypto.symbol),
        change: getMockChange(),
      }));
      setCryptoData(mockData);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg sm:text-xl mb-4">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-lg sm:text-xl mb-4">Failed to load market data</div>
        <button 
          onClick={fetchCryptoData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
      {cryptoData.map((crypto) => (
        <div key={crypto.id} className="bg-gray-900 rounded-lg p-4 sm:p-6 hover:bg-gray-800 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-lg sm:text-xl mr-2">{crypto.icon}</span>
              <div>
                <div className="text-sm sm:text-base font-medium text-white">{crypto.name}</div>
                <div className="text-xs text-gray-400">{crypto.symbol}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-bold text-white">${crypto.price}</div>
            <div className={`text-sm ${parseFloat(crypto.change) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {parseFloat(crypto.change) >= 0 ? '+' : ''}{crypto.change}%
            </div>
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