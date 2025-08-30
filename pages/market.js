import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Top 11 cryptocurrencies by market cap with enhanced icons and colors
const cryptoList = [
  { id: 'bitcoin', name: 'Bitcoin/BTC', symbol: 'BTC', icon: '₿', color: 'from-orange-400 to-orange-600' },
  { id: 'ethereum', name: 'Ethereum/ETH', symbol: 'ETH', icon: 'Ξ', color: 'from-blue-400 to-blue-600' },
  { id: 'tether', name: 'Tether/USDT', symbol: 'USDT', icon: 'T', color: 'from-green-400 to-green-600' },
  { id: 'binancecoin', name: 'BNB/BNB', symbol: 'BNB', icon: 'B', color: 'from-yellow-400 to-yellow-600' },
  { id: 'solana', name: 'Solana/SOL', symbol: 'SOL', icon: 'S', color: 'from-purple-400 to-purple-600' },
  { id: 'cardano', name: 'Cardano/ADA', symbol: 'ADA', icon: 'A', color: 'from-blue-500 to-indigo-600' },
  { id: 'polkadot', name: 'Polkadot/DOT', symbol: 'DOT', icon: 'D', color: 'from-pink-400 to-pink-600' },
  { id: 'dogecoin', name: 'Dogecoin/DOGE', symbol: 'DOGE', icon: 'Ð', color: 'from-yellow-300 to-orange-400' },
  { id: 'avalanche-2', name: 'Avalanche/AVAX', symbol: 'AVAX', icon: 'A', color: 'from-red-400 to-red-600' },
  { id: 'chainlink', name: 'Chainlink/LINK', symbol: 'LINK', icon: 'L', color: 'from-blue-400 to-cyan-500' },
  { id: 'polygon', name: 'Polygon/MATIC', symbol: 'MATIC', icon: 'M', color: 'from-purple-500 to-indigo-600' }
];

const navTabs = [
    { label: 'HOME', icon: '🏠', route: '/exchange' },
    { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
    { label: 'MARKET', icon: '📊', route: '/market' },
    { label: 'FEATURES', icon: '✨', route: '/features' },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col">
      {/* Enhanced Header with Glassmorphism */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Quantex</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
          <button className="relative p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 0 1 15 0v5z"/>
            </svg>
          </button>
        </div>
      </header>
      
      {/* Enhanced Banner with Animation */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-pink-900/80 backdrop-blur-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center animate-bounce">
                <span className="text-2xl sm:text-3xl">📊</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Live Market Data
                </h1>
                <p className="text-sm text-blue-200/80">Real-time cryptocurrency prices and market insights</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-200/60">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
              <span>Updated every 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
      

      
      {/* Main Content */}
      <div className="flex-1 bg-black p-2 sm:p-4">
        {/* Enhanced Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-900/50 to-red-800/30 backdrop-blur-sm border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl mb-6 text-sm flex items-center gap-3">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">!</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-red-100 mb-1">Connection Error</div>
              <div className="text-red-200/80">{error}</div>
            </div>
          </div>
        )}
        
        {/* Enhanced Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2 animate-reverse-spin"></div>
              </div>
              <div className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Loading Market Data
              </div>
              <div className="text-sm text-gray-400">Fetching real-time cryptocurrency prices...</div>
              <div className="flex justify-center mt-4 space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Market Data Table */}
        {!loading && (
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">ASSET</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider">PRICE</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider">24H CHANGE</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider">24H VOLUME</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider">MARKET CAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {marketData.map((crypto, index) => {
                    const cryptoInfo = cryptoList.find(c => c.symbol === crypto.id.toUpperCase()) || cryptoList[0];
                    return (
                      <tr key={crypto.id} className="hover:bg-white/5 transition-all duration-300 group cursor-pointer">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${cryptoInfo.color} flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
                              <span className="text-white font-bold text-lg">{crypto.icon}</span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">{crypto.name}</div>
                              <div className="text-xs text-gray-400 uppercase">{crypto.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-white group-hover:text-green-300 transition-colors">${crypto.price}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            crypto.isPositive 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            <span className={`mr-1 ${crypto.isPositive ? '↗' : '↘'}`}></span>
                            {crypto.isPositive ? '+' : ''}{crypto.change}%
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-300 font-medium">${(parseFloat(crypto.volume) / 1000000).toFixed(2)}M</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-300 font-medium">${(parseFloat(crypto.marketCap) / 1000000000).toFixed(2)}B</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Enhanced Mobile Cards */}
            <div className="lg:hidden">
              <div className="p-4 space-y-4">
                {marketData.map((crypto, index) => {
                  const cryptoInfo = cryptoList.find(c => c.symbol === crypto.id.toUpperCase()) || cryptoList[0];
                  return (
                    <div key={crypto.id} className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${cryptoInfo.color} flex items-center justify-center mr-3 shadow-lg`}>
                            <span className="text-white font-bold text-lg">{crypto.icon}</span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{crypto.name}</div>
                            <div className="text-xs text-gray-400 uppercase">{crypto.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">${crypto.price}</div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            crypto.isPositive 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            <span className={`mr-1 ${crypto.isPositive ? '↗' : '↘'}`}></span>
                            {crypto.isPositive ? '+' : ''}{crypto.change}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">24h Volume</div>
                          <div className="text-sm font-semibold text-white">${(parseFloat(crypto.volume) / 1000000).toFixed(2)}M</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Market Cap</div>
                          <div className="text-sm font-semibold text-white">${(parseFloat(crypto.marketCap) / 1000000000).toFixed(2)}B</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced API Status */}
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-800/30 to-gray-700/20 backdrop-blur-sm rounded-2xl border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-sm text-green-400 font-medium">Live Data Stream</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/20"></div>
              <span className="text-xs text-gray-400">CoinMarketCap API</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span suppressHydrationWarning>Updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation - Mobile Responsive (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around bg-[#181c23] px-2 sm:px-4 py-2 border-t border-gray-800 overflow-x-auto z-10">
        {navTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.route)}
            className={`flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              router.pathname === tab.route
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="text-sm sm:text-base">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the navbar */}
      <div className="pb-16"></div>
    </div>
  );
}