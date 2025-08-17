import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { safeLocalStorage, safeWindow, getSafeDocument } from '../utils/safeStorage';

// Cryptocurrency list for alerts
const cryptoList = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: '🟡' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', icon: '🟦' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', icon: '🟦' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', icon: '🟣' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', icon: '🟣' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', icon: '🔗' },
];

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'SPOT', icon: '💱', route: '/spot' },
  { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
  { label: 'ALERTS', icon: '🔔', route: '/alerts' },
];

export default function AlertsPage() {
  const router = useRouter();
  const [marketData, setMarketData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState('above');

  // Fetch real-time price data - LIVE DATA ONLY
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use Binance API - more reliable than CoinGecko
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter and format data for our crypto list
      const formattedData = cryptoList.map(crypto => {
        const symbol = crypto.symbol + 'USDT';
        const binanceData = data.find(item => item.symbol === symbol);
        
        if (!binanceData) {
          // Fallback to other symbols if exact match not found
          const fallbackSymbols = [crypto.symbol + 'USDT', crypto.symbol + 'USD', crypto.symbol + 'BTC'];
          const fallbackData = data.find(item => fallbackSymbols.includes(item.symbol));
          
          if (!fallbackData) {
            throw new Error(`No data available for ${crypto.symbol}`);
          }
          
          return {
            id: crypto.id,
            name: `${crypto.symbol}/USDT`,
            icon: crypto.icon,
            price: parseFloat(fallbackData.lastPrice).toFixed(2),
            change: parseFloat(fallbackData.priceChangePercent).toFixed(2),
            volume: parseFloat(fallbackData.volume) || 0,
            marketCap: 0, // Binance doesn't provide market cap in this endpoint
          };
        }
        
        return {
          id: crypto.id,
          name: `${crypto.symbol}/USDT`,
          icon: crypto.icon,
          price: parseFloat(binanceData.lastPrice).toFixed(2),
          change: parseFloat(binanceData.priceChangePercent).toFixed(2),
          volume: parseFloat(binanceData.volume) || 0,
          marketCap: 0, // Binance doesn't provide market cap in this endpoint
        };
      });
      
      setMarketData(formattedData);
      setLoading(false);
      
    } catch (err) {
      console.error('Error fetching market data:', err);
      
      // Fallback to CoinGecko if Binance fails
      try {
        const cryptoIds = cryptoList.map(crypto => crypto.id).join(',');
        const fallbackResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(8000),
          }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          const formattedData = cryptoList.map(crypto => {
            const cryptoData = fallbackData[crypto.id];
            if (!cryptoData || !cryptoData.usd) {
              throw new Error(`No data available for ${crypto.symbol}`);
            }
            
            return {
              id: crypto.id,
              name: `${crypto.symbol}/USDT`,
              icon: crypto.icon,
              price: cryptoData.usd.toFixed(2),
              change: cryptoData.usd_24h_change?.toFixed(2) || '0.00',
              volume: 0,
              marketCap: 0,
            };
          });
          
          setMarketData(formattedData);
          setLoading(false);
          return;
        }
      } catch (fallbackErr) {
        console.error('Fallback API also failed:', fallbackErr);
      }
      
      // Show minimal error and retry
      setError('Connecting to market data...');
      setMarketData([]);
      setLoading(false);
      
      // Retry after 5 seconds
      setTimeout(() => {
        fetchMarketData();
      }, 5000);
    }
  };

  // Load alerts from localStorage
  const loadAlerts = () => {
    const saved = safeLocalStorage.getItem('priceAlerts');
    if (saved) {
      setAlerts(JSON.parse(saved));
    }
  };

  // Save alerts to localStorage
  const saveAlerts = (newAlerts) => {
    safeLocalStorage.setItem('priceAlerts', JSON.stringify(newAlerts));
  };

  // Check price alerts
  const checkPriceAlerts = (currentPrices) => {
    alerts.forEach(alert => {
      const crypto = currentPrices.find(c => c.id === alert.cryptoId);
      if (!crypto) return;

      const currentPrice = parseFloat(crypto.price);
      const targetPrice = parseFloat(alert.targetPrice);
      
      let shouldTrigger = false;
      if (alert.type === 'above' && currentPrice >= targetPrice) {
        shouldTrigger = true;
      } else if (alert.type === 'below' && currentPrice <= targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger && !alert.triggered) {
        triggerAlert(alert, crypto);
      }
    });
  };

  // Trigger alert notification
  const triggerAlert = (alert, crypto) => {
    const document = getSafeDocument();
    if (document && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Price Alert', {
          body: `${crypto.name} is now ${alert.type === 'above' ? 'above' : 'below'} $${alert.targetPrice}`,
          icon: '/favicon.ico'
        });
      }
    }

    // Mark alert as triggered
    const updatedAlerts = alerts.map(a => 
      a.id === alert.id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
    );
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
  };

  // Add price alert
  const addPriceAlert = (cryptoId, targetPrice, type) => {
    const newAlert = {
      id: Date.now().toString(),
      cryptoId,
      targetPrice: parseFloat(targetPrice),
      type,
      createdAt: new Date().toISOString(),
      triggered: false,
    };
    
    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
  };

  // Remove alert
  const removeAlert = (alertId) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
  };

  useEffect(() => {
    loadAlerts();
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#181c23]">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-widest text-white bg-blue-900 px-2 py-1 rounded">Quantex</span>
        </div>
        <button className="relative">
          <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
          <span className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full border-2 border-[#181c23]" />
        </button>
      </header>
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-900 to-orange-700 p-4 flex flex-col items-center rounded-b-2xl">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🔔</div>
          <div>
            <div className="text-lg font-bold">Price Alerts</div>
            <div className="text-xs text-orange-100">Get notified when prices hit your targets</div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex bg-[#181c23] px-4 py-2 border-b border-gray-800">
        {navTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.route)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              router.pathname === tab.route
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
      
      {/* Main Content */}
      <div className="flex-1 bg-[#181c23] px-4 py-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
              <div className="text-gray-400">Loading alerts data...</div>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-red-400 text-4xl mb-4">🔔</div>
              <div className="text-gray-400 text-lg mb-2">Alerts Unavailable</div>
              <div className="text-gray-500 text-sm mb-4">{error}</div>
              <button 
                onClick={fetchMarketData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Price Alerts</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                + Add Alert
              </button>
            </div>
            
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔔</div>
                <div className="text-gray-400 text-lg mb-2">No price alerts set</div>
                <div className="text-gray-500 text-sm mb-4">Create alerts to get notified about price movements</div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg"
                >
                  Create First Alert
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => {
                  const crypto = marketData.find(c => c.id === alert.cryptoId);
                  if (!crypto) return null;
                  
                  const currentPrice = parseFloat(crypto.price);
                  const targetPrice = parseFloat(alert.targetPrice);
                  const isTriggered = currentPrice >= targetPrice && alert.type === 'above' || 
                                     currentPrice <= targetPrice && alert.type === 'below';
                  
                  return (
                    <div key={alert.id} className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                      alert.triggered ? 'border-green-500' : isTriggered ? 'border-orange-500' : 'border-gray-600'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{crypto.icon}</span>
                          <div>
                            <div className="font-semibold">{crypto.name}</div>
                            <div className="text-sm text-gray-400">
                              {alert.type === 'above' ? 'Above' : 'Below'} ${alert.targetPrice}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${crypto.price}</div>
                          <div className={`text-sm ${isTriggered ? 'text-green-400' : 'text-gray-400'}`}>
                            {alert.triggered ? 'Triggered' : isTriggered ? 'Ready' : 'Waiting'}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeAlert(alert.id)}
                          className="text-red-400 hover:text-red-300 ml-4"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add Alert Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Create Price Alert</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Cryptocurrency</label>
                <select 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  value={selectedCrypto}
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                >
                  <option value="">Choose crypto...</option>
                  {cryptoList.map(crypto => (
                    <option key={crypto.id} value={crypto.id}>
                      {crypto.name} ({crypto.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Alert Type</label>
                <select 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                >
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedCrypto('');
                    setTargetPrice('');
                    setAlertType('above');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (selectedCrypto && targetPrice) {
                      addPriceAlert(selectedCrypto, targetPrice, alertType);
                      setShowAddModal(false);
                      setSelectedCrypto('');
                      setTargetPrice('');
                      setAlertType('above');
                    }
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
                >
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 