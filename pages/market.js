import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Enhanced cryptocurrency list with more trading pairs
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
  { id: 'polygon', name: 'Polygon/MATIC', symbol: 'MATIC', icon: 'M' },
  { id: 'litecoin', name: 'Litecoin/LTC', symbol: 'LTC', icon: 'Ł' },
  { id: 'uniswap', name: 'Uniswap/UNI', symbol: 'UNI', icon: 'U' },
  { id: 'bitcoin-cash', name: 'Bitcoin Cash/BCH', symbol: 'BCH', icon: 'B' },
  { id: 'stellar', name: 'Stellar/XLM', symbol: 'XLM', icon: 'X' },
  { id: 'vechain', name: 'VeChain/VET', symbol: 'VET', icon: 'V' },
  { id: 'filecoin', name: 'Filecoin/FIL', symbol: 'FIL', icon: 'F' },
  { id: 'cosmos', name: 'Cosmos/ATOM', symbol: 'ATOM', icon: 'A' },
  { id: 'monero', name: 'Monero/XMR', symbol: 'XMR', icon: 'M' },
  { id: 'algorand', name: 'Algorand/ALGO', symbol: 'ALGO', icon: 'A' },
  { id: 'tezos', name: 'Tezos/XTZ', symbol: 'XTZ', icon: 'T' },
  { id: 'aave', name: 'Aave/AAVE', symbol: 'AAVE', icon: 'A' },
  { id: 'compound', name: 'Compound/COMP', symbol: 'COMP', icon: 'C' },
  { id: 'synthetix-network-token', name: 'Synthetix/SNX', symbol: 'SNX', icon: 'S' },
  { id: 'yearn-finance', name: 'Yearn Finance/YFI', symbol: 'YFI', icon: 'Y' },
  { id: 'decentraland', name: 'Decentraland/MANA', symbol: 'MANA', icon: 'M' },
  { id: 'the-sandbox', name: 'The Sandbox/SAND', symbol: 'SAND', icon: 'S' },
  { id: 'enjin-coin', name: 'Enjin Coin/ENJ', symbol: 'ENJ', icon: 'E' },
  { id: 'axie-infinity', name: 'Axie Infinity/AXS', symbol: 'AXS', icon: 'A' },
  { id: 'gala', name: 'Gala/GALA', symbol: 'GALA', icon: 'G' },
  { id: 'flow', name: 'Flow/FLOW', symbol: 'FLOW', icon: 'F' },
  { id: 'near', name: 'NEAR Protocol/NEAR', symbol: 'NEAR', icon: 'N' },
  { id: 'fantom', name: 'Fantom/FTM', symbol: 'FTM', icon: 'F' },
  { id: 'harmony', name: 'Harmony/ONE', symbol: 'ONE', icon: 'O' },
  { id: 'kusama', name: 'Kusama/KSM', symbol: 'KSM', icon: 'K' },
  { id: 'zilliqa', name: 'Zilliqa/ZIL', symbol: 'ZIL', icon: 'Z' },
  { id: 'icon', name: 'ICON/ICX', symbol: 'ICX', icon: 'I' },
  { id: 'ontology', name: 'Ontology/ONT', symbol: 'ONT', icon: 'O' },
  { id: 'neo', name: 'NEO/NEO', symbol: 'NEO', icon: 'N' },
  { id: 'qtum', name: 'Qtum/QTUM', symbol: 'QTUM', icon: 'Q' },
  { id: 'verge', name: 'Verge/XVG', symbol: 'XVG', icon: 'V' },
  { id: 'siacoin', name: 'Siacoin/SC', symbol: 'SC', icon: 'S' },
  { id: 'steem', name: 'Steem/STEEM', symbol: 'STEEM', icon: 'S' },
  { id: 'waves', name: 'Waves/WAVES', symbol: 'WAVES', icon: 'W' },
  { id: 'nxt', name: 'NXT/NXT', symbol: 'NXT', icon: 'N' },
  { id: 'bytecoin', name: 'Bytecoin/BCN', symbol: 'BCN', icon: 'B' },
  { id: 'digibyte', name: 'DigiByte/DGB', symbol: 'DGB', icon: 'D' },
  { id: 'vertcoin', name: 'Vertcoin/VTC', symbol: 'VTC', icon: 'V' },
  { id: 'feathercoin', name: 'Feathercoin/FTC', symbol: 'FTC', icon: 'F' },
  { id: 'novacoin', name: 'Novacoin/NVC', symbol: 'NVC', icon: 'N' },
  { id: 'primecoin', name: 'Primecoin/XPM', symbol: 'XPM', icon: 'P' },
  { id: 'peercoin', name: 'Peercoin/PPC', symbol: 'PPC', icon: 'P' },
  { id: 'namecoin', name: 'Namecoin/NMC', symbol: 'NMC', icon: 'N' }
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

  // Fetch real-time price data from Binance API
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const formattedData = [];
      
      // Fetch data for each cryptocurrency from Binance
      for (const crypto of cryptoList) {
        try {
          const symbol = crypto.symbol + 'USDT';
          
          // Use our backend API endpoint for better reliability
          const response = await fetch(`http://localhost:4001/api/trading/price/${symbol}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Calculate market cap (simplified - in real app you'd get this from API)
            const marketCap = (parseFloat(data.price) * parseFloat(data.volume || 1000000)).toFixed(0);
            
            formattedData.push({
              id: crypto.id,
              name: `${crypto.symbol}/USDT`,
              icon: crypto.icon,
              price: parseFloat(data.price).toFixed(2),
              change: parseFloat(data.priceChangePercent).toFixed(2),
              volume: parseFloat(data.volume || 0).toFixed(0),
              marketCap: marketCap,
              isPositive: parseFloat(data.priceChangePercent) >= 0,
            });
          } else {
            // Fallback to direct Binance API
            const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
              signal: AbortSignal.timeout(8000),
            });
            
            if (binanceResponse.ok) {
              const binanceData = await binanceResponse.json();
              const marketCap = (parseFloat(binanceData.lastPrice) * parseFloat(binanceData.volume || 1000000)).toFixed(0);
              
              formattedData.push({
                id: crypto.id,
                name: `${crypto.symbol}/USDT`,
                icon: crypto.icon,
                price: parseFloat(binanceData.lastPrice).toFixed(2),
                change: parseFloat(binanceData.priceChangePercent).toFixed(2),
                volume: parseFloat(binanceData.volume || 0).toFixed(0),
                marketCap: marketCap,
                isPositive: parseFloat(binanceData.priceChangePercent) >= 0,
              });
            } else {
              // Add placeholder data if API fails
              formattedData.push({
                id: crypto.id,
                name: `${crypto.symbol}/USDT`,
                icon: crypto.icon,
                price: '0.00',
                change: '0.00',
                volume: '0',
                marketCap: '0',
                isPositive: true,
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching ${crypto.symbol}:`, err);
          // Add placeholder data if this crypto fails
          formattedData.push({
            id: crypto.id,
            name: `${crypto.symbol}/USDT`,
            icon: crypto.icon,
            price: '0.00',
            change: '0.00',
            volume: '0',
            marketCap: '0',
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
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ASSET</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">PRICE</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">24H CHANGE</th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">24H VOLUME</th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">MARKET CAP</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {marketData.map((crypto, index) => (
                    <tr key={crypto.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg sm:text-2xl mr-2 sm:mr-3">{crypto.icon}</span>
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-white">{crypto.name}</div>
                            <div className="text-xs text-gray-400">{crypto.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <div className="text-xs sm:text-sm font-medium text-white">${crypto.price}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <div className={`text-xs sm:text-sm font-medium ${crypto.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {crypto.isPositive ? '+' : ''}{crypto.change}%
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <div className="text-xs sm:text-sm text-gray-300">${(parseFloat(crypto.volume) / 1000000).toFixed(2)}M</div>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <div className="text-xs sm:text-sm text-gray-300">${(parseFloat(crypto.marketCap) / 1000000000).toFixed(2)}B</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* API Status - Mobile Responsive */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
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