import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
  { label: 'TRADE', icon: '💱', route: '/trade' },
];

export default function ExchangePage() {
  const router = useRouter();
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Fetch real-time price data from Binance API
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const cryptoList = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'];
      const formattedData = [];
      
      // Fetch data for each cryptocurrency from Binance
      for (const symbol of cryptoList) {
        try {
          const response = await fetch(`http://localhost:4001/api/trading/price/${symbol}USDT`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
          });
          
          if (response.ok) {
            const data = await response.json();
            formattedData.push({
              symbol: symbol,
              price: parseFloat(data.price).toFixed(2),
              change: parseFloat(data.priceChangePercent).toFixed(2),
              isPositive: parseFloat(data.priceChangePercent) >= 0,
            });
          } else {
            // Fallback to direct Binance API
            const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
              signal: AbortSignal.timeout(8000),
            });
            
            if (binanceResponse.ok) {
              const binanceData = await binanceResponse.json();
              formattedData.push({
                symbol: symbol,
                price: parseFloat(binanceData.lastPrice).toFixed(2),
                change: parseFloat(binanceData.priceChangePercent).toFixed(2),
                isPositive: parseFloat(binanceData.priceChangePercent) >= 0,
              });
            } else {
              // Add placeholder data if API fails
              formattedData.push({
                symbol: symbol,
                price: '0.00',
                change: '0.00',
                isPositive: true,
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err);
          // Add placeholder data if this crypto fails
          formattedData.push({
            symbol: symbol,
            price: '0.00',
            change: '0.00',
            isPositive: true,
          });
        }
      }
      
      setMarketData(formattedData);
      setLoading(false);
      
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

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
          <div className="text-2xl sm:text-4xl">🚀</div>
          <div>
            <div className="text-base sm:text-lg font-bold">Welcome to Quantex</div>
            <div className="text-xs text-blue-100">Your gateway to cryptocurrency trading</div>
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
        
        {/* Market Overview - Mobile Responsive */}
        {!loading && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Market Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {marketData.map((crypto, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold mb-1">{crypto.symbol}</div>
                    <div className="text-sm sm:text-base font-medium mb-1">${crypto.price}</div>
                    <div className={`text-xs sm:text-sm font-medium ${crypto.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {crypto.isPositive ? '+' : ''}{crypto.change}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Feature Cards - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Market Card */}
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => router.push('/market')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl sm:text-3xl">📊</div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">Market</h3>
                <p className="text-xs sm:text-sm text-gray-400">Live cryptocurrency prices</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mb-4">Real-time market data with price charts and trading volume</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
              View Market
            </button>
          </div>
          
          {/* Features Card */}
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => router.push('/features')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl sm:text-3xl">✨</div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">Features</h3>
                <p className="text-xs sm:text-sm text-gray-400">Trading interface</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mb-4">Advanced trading tools with BUY UP/BUY FALL options</p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
              View Features
            </button>
          </div>
          
          {/* Portfolio Card */}
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => router.push('/portfolio')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl sm:text-3xl">📈</div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">Portfolio</h3>
                <p className="text-xs sm:text-sm text-gray-400">Track your investments</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mb-4">Monitor your cryptocurrency portfolio and track performance</p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
              View Portfolio
            </button>
          </div>
          
          {/* Trade Card */}
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => router.push('/trade')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl sm:text-3xl">💱</div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">Spot Trading</h3>
                <p className="text-xs sm:text-sm text-gray-400">Professional spot trading</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mb-4">Professional spot trading with real-time order book</p>
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
              View Trade
            </button>
          </div>
        </div>
        
        {/* API Status - Mobile Responsive */}
        <div className="mt-6 p-3 bg-gray-800 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-400">Connected to Binance API</span>
            </div>
            <div className="text-xs text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 