import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Top 11 cryptocurrencies by market cap
const cryptoList = [
  { id: 'bitcoin', name: 'Bitcoin/BTC', symbol: 'BTC', icon: '₿' },
  { id: 'ethereum', name: 'Ethereum/ETH', symbol: 'ETH', icon: 'Ξ' },
  { id: 'tether', name: 'Tether/USDT', symbol: 'USDT', icon: 'T' },
  { id: 'binancecoin', name: 'BNB/BNB', symbol: 'BNB', icon: 'B' },
  { id: 'solana', name: 'Solana/SOL', symbol: 'SOL', icon: 'S' },
  { id: 'cardano', name: 'Cardano/ADA', symbol: 'ADA', icon: 'A' },
  { id: 'polkadot', name: 'Polkadot/DOT', symbol: 'DOT', icon: 'D' },
  { id: 'dogecoin', name: 'Dogecoin/DOGE', symbol: 'DOGE', icon: 'Ð' },
  { id: 'avalanche-2', name: 'Avalanche/AVAX', symbol: 'AVAX', icon: 'A' },
  { id: 'chainlink', name: 'Chainlink/LINK', symbol: 'LINK', icon: 'L' },
  { id: 'polygon', name: 'Polygon/MATIC', symbol: 'MATIC', icon: 'M' }
];

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
  { label: 'TRADE', icon: '💱', route: '/trade' },
];

export default function MarketPage() {
  const router = useRouter();
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('market');

  // Fetch real-time price data from CoinMarketCap API
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the new efficient API endpoint that fetches all cryptocurrencies in one call
      const response = await fetch('/api/crypto/top-all', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const formattedData = data.data.map(crypto => ({
          id: crypto.symbol.toLowerCase(),
          name: `${crypto.symbol}/USDT`,
          icon: cryptoList.find(c => c.symbol === crypto.symbol)?.icon || '₿',
          price: parseFloat(crypto.price).toFixed(2),
          change: parseFloat(crypto.change || 0).toFixed(2),
          volume: parseFloat(crypto.volume_24h || 0).toFixed(0),
          marketCap: parseFloat(crypto.market_cap || 0).toFixed(0),
          isPositive: parseFloat(crypto.change || 0) >= 0,
        }));
        
        setMarketData(formattedData);
        setLoading(false);
      } else {
        console.error('Failed to fetch market data');
        setError('Failed to load market data. Retrying...');
        setLoading(false);
      }
      
    } catch (err) {
      console.error('Error in fetchMarketData:', err);
      setError('Failed to load market data. Retrying...');
      setLoading(false);
      
      // Retry after 10 seconds
      setTimeout(() => {
        fetchMarketData();
      }, 10000);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 120000); // Update every 120 seconds to avoid rate limits
    return () => clearInterval(interval);
  }, []);

  // Get top 3 cryptocurrencies for header
  const topCryptos = marketData.slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#181c23]">
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-2xl font-extrabold tracking-widest text-white bg-blue-900 px-2 py-1 rounded">Quantex</span>
        </div>
        <button className="relative">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
          <span className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full border-2 border-[#181c23]" />
        </button>
      </header>
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-3 sm:p-4 flex flex-col items-center rounded-b-2xl">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-2xl sm:text-4xl">📊</div>
          <div>
            <div className="text-base sm:text-lg font-bold">Live Market Data</div>
            <div className="text-xs text-blue-100">Real-time cryptocurrency prices and market information</div>
          </div>
        </div>
      </div>
      
      {/* Navigation - Mobile Responsive */}
      <nav className="flex bg-[#181c23] px-2 sm:px-4 py-2 border-b border-gray-800 overflow-x-auto">
        {navTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.route)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              router.pathname === tab.route
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="text-sm sm:text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Main Content */}
      <div className="flex-1 bg-black p-2 sm:p-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900 text-red-200 px-3 sm:px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-lg sm:text-xl mb-4">Loading market data...</div>
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        )}
        
        {/* Market Data Table - Mobile Responsive */}
        {!loading && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ASSET</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">PRICE</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">24H CHANGE</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">24H VOLUME</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">MARKET CAP</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {marketData.map((crypto, index) => (
                    <tr key={crypto.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{crypto.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-white">{crypto.name}</div>
                            <div className="text-xs text-gray-400">{crypto.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-white">${crypto.price}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-medium ${crypto.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {crypto.isPositive ? '+' : ''}{crypto.change}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-300">${(parseFloat(crypto.volume) / 1000000).toFixed(2)}M</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-300">${(parseFloat(crypto.marketCap) / 1000000000).toFixed(2)}B</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              <div className="p-4 space-y-4">
                {marketData.map((crypto, index) => (
                  <div key={crypto.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{crypto.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-white">{crypto.name}</div>
                          <div className="text-xs text-gray-400">{crypto.id}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">${crypto.price}</div>
                        <div className={`text-xs ${crypto.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {crypto.isPositive ? '+' : ''}{crypto.change}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-gray-400">Volume</div>
                        <div className="text-white">${(parseFloat(crypto.volume) / 1000000).toFixed(2)}M</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Market Cap</div>
                        <div className="text-white">${(parseFloat(crypto.marketCap) / 1000000000).toFixed(2)}B</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* API Status - Mobile Responsive */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-400">Connected to CoinMarketCap API</span>
            </div>
            <div className="text-xs text-gray-400">
              Last updated: <span suppressHydrationWarning>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 