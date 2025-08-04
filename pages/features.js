import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function FeaturesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [priceData, setPriceData] = useState(null);
  const [showSpotModal, setShowSpotModal] = useState(false);
  const [orderType, setOrderType] = useState('market');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderSide, setOrderSide] = useState('buy');
  
  // Price data state variables
  const [currentPrice, setCurrentPrice] = useState('0.00');
  const [priceChange, setPriceChange] = useState('0.00');
  const [high24h, setHigh24h] = useState('0.00');
  const [low24h, setLow24h] = useState('0.00');
  const [volume24h, setVolume24h] = useState('0');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [tradeType, setTradeType] = useState('BUY');
  const [selectedLeverage, setSelectedLeverage] = useState('1x');
  const [selectedDuration, setSelectedDuration] = useState(360); // Default to 360s

  // Duration options with percentages
  const durationOptions = [
    { seconds: 60, percentage: 30 },
    { seconds: 120, percentage: 50 },
    { seconds: 180, percentage: 70 },
    { seconds: 360, percentage: 100 }
  ];

  // Enhanced trading pairs list
  const tradingPairs = [
    { symbol: 'BTCUSDT', name: 'Bitcoin/USDT', base: 'BTC', quote: 'USDT', icon: '₿' },
    { symbol: 'ETHUSDT', name: 'Ethereum/USDT', base: 'ETH', quote: 'USDT', icon: 'Ξ' },
    { symbol: 'BNBUSDT', name: 'BNB/USDT', base: 'BNB', quote: 'USDT', icon: 'B' },
    { symbol: 'SOLUSDT', name: 'Solana/USDT', base: 'SOL', quote: 'USDT', icon: 'S' },
    { symbol: 'ADAUSDT', name: 'Cardano/USDT', base: 'ADA', quote: 'USDT', icon: 'A' },
    { symbol: 'DOTUSDT', name: 'Polkadot/USDT', base: 'DOT', quote: 'USDT', icon: 'D' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin/USDT', base: 'DOGE', quote: 'USDT', icon: 'Ð' },
    { symbol: 'AVAXUSDT', name: 'Avalanche/USDT', base: 'AVAX', quote: 'USDT', icon: 'A' },
    { symbol: 'LINKUSDT', name: 'Chainlink/USDT', base: 'LINK', quote: 'USDT', icon: 'L' },
    { symbol: 'MATICUSDT', name: 'Polygon/USDT', base: 'MATIC', quote: 'USDT', icon: 'M' },
    { symbol: 'LTCUSDT', name: 'Litecoin/USDT', base: 'LTC', quote: 'USDT', icon: 'Ł' },
    { symbol: 'UNIUSDT', name: 'Uniswap/USDT', base: 'UNI', quote: 'USDT', icon: 'U' },
    { symbol: 'BCHUSDT', name: 'Bitcoin Cash/USDT', base: 'BCH', quote: 'USDT', icon: 'B' },
    { symbol: 'XLMUSDT', name: 'Stellar/USDT', base: 'XLM', quote: 'USDT', icon: 'X' },
    { symbol: 'VETUSDT', name: 'VeChain/USDT', base: 'VET', quote: 'USDT', icon: 'V' },
    { symbol: 'FILUSDT', name: 'Filecoin/USDT', base: 'FIL', quote: 'USDT', icon: 'F' },
    { symbol: 'ATOMUSDT', name: 'Cosmos/USDT', base: 'ATOM', quote: 'USDT', icon: 'A' },
    { symbol: 'XMRUSDT', name: 'Monero/USDT', base: 'XMR', quote: 'USDT', icon: 'M' },
    { symbol: 'ALGOUSDT', name: 'Algorand/USDT', base: 'ALGO', quote: 'USDT', icon: 'A' },
    { symbol: 'XTZUSDT', name: 'Tezos/USDT', base: 'XTZ', quote: 'USDT', icon: 'T' },
    { symbol: 'AAVEUSDT', name: 'Aave/USDT', base: 'AAVE', quote: 'USDT', icon: 'A' },
    { symbol: 'COMPUSDT', name: 'Compound/USDT', base: 'COMP', quote: 'USDT', icon: 'C' },
    { symbol: 'SNXUSDT', name: 'Synthetix/USDT', base: 'SNX', quote: 'USDT', icon: 'S' },
    { symbol: 'YFIUSDT', name: 'Yearn Finance/USDT', base: 'YFI', quote: 'USDT', icon: 'Y' },
    { symbol: 'MANAUSDT', name: 'Decentraland/USDT', base: 'MANA', quote: 'USDT', icon: 'M' },
    { symbol: 'SANDUSDT', name: 'The Sandbox/USDT', base: 'SAND', quote: 'USDT', icon: 'S' },
    { symbol: 'ENJUSDT', name: 'Enjin Coin/USDT', base: 'ENJ', quote: 'USDT', icon: 'E' },
    { symbol: 'AXSUSDT', name: 'Axie Infinity/USDT', base: 'AXS', quote: 'USDT', icon: 'A' },
    { symbol: 'GALAUSDT', name: 'Gala/USDT', base: 'GALA', quote: 'USDT', icon: 'G' },
    { symbol: 'FLOWUSDT', name: 'Flow/USDT', base: 'FLOW', quote: 'USDT', icon: 'F' },
    { symbol: 'NEARUSDT', name: 'NEAR Protocol/USDT', base: 'NEAR', quote: 'USDT', icon: 'N' },
    { symbol: 'FTMUSDT', name: 'Fantom/USDT', base: 'FTM', quote: 'USDT', icon: 'F' },
    { symbol: 'ONEUSDT', name: 'Harmony/USDT', base: 'ONE', quote: 'USDT', icon: 'O' },
    { symbol: 'KSMUSDT', name: 'Kusama/USDT', base: 'KSM', quote: 'USDT', icon: 'K' },
    { symbol: 'ZILUSDT', name: 'Zilliqa/USDT', base: 'ZIL', quote: 'USDT', icon: 'Z' },
    { symbol: 'ICXUSDT', name: 'ICON/USDT', base: 'ICX', quote: 'USDT', icon: 'I' },
    { symbol: 'ONTUSDT', name: 'Ontology/USDT', base: 'ONT', quote: 'USDT', icon: 'O' },
    { symbol: 'NEOUSDT', name: 'NEO/USDT', base: 'NEO', quote: 'USDT', icon: 'N' },
    { symbol: 'QTUMUSDT', name: 'Qtum/USDT', base: 'QTUM', quote: 'USDT', icon: 'Q' },
    { symbol: 'XVGUSDT', name: 'Verge/USDT', base: 'XVG', quote: 'USDT', icon: 'V' },
    { symbol: 'SCUSDT', name: 'Siacoin/USDT', base: 'SC', quote: 'USDT', icon: 'S' },
    { symbol: 'STEEMUSDT', name: 'Steem/USDT', base: 'STEEM', quote: 'USDT', icon: 'S' },
    { symbol: 'WAVESUSDT', name: 'Waves/USDT', base: 'WAVES', quote: 'USDT', icon: 'W' },
    { symbol: 'NXTUSDT', name: 'NXT/USDT', base: 'NXT', quote: 'USDT', icon: 'N' },
    { symbol: 'BCNUSDT', name: 'Bytecoin/USDT', base: 'BCN', quote: 'USDT', icon: 'B' },
    { symbol: 'DGBUSDT', name: 'DigiByte/USDT', base: 'DGB', quote: 'USDT', icon: 'D' },
    { symbol: 'VTCUSDT', name: 'Vertcoin/USDT', base: 'VTC', quote: 'USDT', icon: 'V' },
    { symbol: 'FTCUSDT', name: 'Feathercoin/USDT', base: 'FTC', quote: 'USDT', icon: 'F' },
    { symbol: 'NVCUSDT', name: 'Novacoin/USDT', base: 'NVC', quote: 'USDT', icon: 'N' },
    { symbol: 'XPMUSDT', name: 'Primecoin/USDT', base: 'XPM', quote: 'USDT', icon: 'P' },
    { symbol: 'PPCUSDT', name: 'Peercoin/USDT', base: 'PPC', quote: 'USDT', icon: 'P' },
    { symbol: 'NMCUSDT', name: 'Namecoin/USDT', base: 'NMC', quote: 'USDT', icon: 'N' }
  ];

  const navTabs = [
    { label: 'HOME', icon: '🏠', route: '/exchange' },
    { label: 'MARKET', icon: '📊', route: '/market' },
    { label: 'FEATURES', icon: '✨', route: '/features' },
    { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
    { label: 'TRADE', icon: '💱', route: '/trade' },
  ];

  // Handle order button clicks
  const handleOrderClick = (type) => {
    setOrderSide(type === 'BUY' ? 'buy' : 'sell');
    setShowOrderModal(true);
  };

  // Calculate projected profit based on amount, duration percentage, and leverage
  const calculateProjectedProfit = () => {
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      return 0;
    }
    
    const amount = parseFloat(orderAmount);
    const selectedOption = durationOptions.find(opt => opt.seconds === selectedDuration);
    const percentage = selectedOption ? selectedOption.percentage : 0;
    const leverage = parseInt(selectedLeverage.replace('x', ''));
    
    // Calculate profit: Amount * (Percentage / 100) * Leverage
    const profit = amount * (percentage / 100) * leverage;
    return profit;
  };

  // Handle order confirmation
  const handleOrderConfirm = (e) => {
    e.preventDefault();
    
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Create order object with all selected options
    const order = {
      type: orderSide === 'buy' ? 'BUY UP' : 'BUY FALL',
      leverage: selectedLeverage,
      duration: selectedDuration,
      durationPercentage: durationOptions.find(opt => opt.seconds === selectedDuration)?.percentage,
      amount: parseFloat(orderAmount),
      projectedProfit: calculateProjectedProfit(),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Simulate order placement
    console.log('Order placed:', order);
    
    // Show success message
    alert(`Order confirmed!\nType: ${order.type}\nDuration: ${order.duration}s (${order.durationPercentage}%)\nAmount: $${order.amount}\nLeverage: ${order.leverage}\nProjected Profit: $${order.projectedProfit.toFixed(2)}`);
    
    // Close modal and reset form
    setShowOrderModal(false);
    setOrderAmount('');
    setSelectedDuration(360);
    setSelectedLeverage('1x');
  };

  // Fetch crypto data from CoinMarketCap API
  const fetchCryptoData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/trading/price/${selectedPair}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPrice(parseFloat(data.price).toFixed(2));
        setPriceChange(parseFloat(data.change || 0).toFixed(2));
        setHigh24h(parseFloat(data.highPrice || data.price).toFixed(2));
        setLow24h(parseFloat(data.lowPrice || data.price).toFixed(2));
        setVolume24h(parseFloat(data.volume || 0).toFixed(0));
      } else {
        console.error(`Failed to fetch ${selectedPair} from CoinMarketCap API`);
        // Use fallback data if API fails
        setCurrentPrice('0.00');
        setPriceChange('0.00');
        setHigh24h('0.00');
        setLow24h('0.00');
        setVolume24h('0');
      }
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      // Use fallback data on error
      setCurrentPrice('0.00');
      setPriceChange('0.00');
      setHigh24h('0.00');
      setLow24h('0.00');
      setVolume24h('0');
    }
  };

  const handleSpotTradeClick = (type) => {
    setTradeType(type);
    setShowSpotModal(true);
  };

  const handleSpotTrade = async (e) => {
    e.preventDefault();
    setShowSpotModal(false);
    // Reset form
    e.target.reset();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchCryptoData();
      const interval = setInterval(fetchCryptoData, 10000);
      return () => clearInterval(interval);
    }
  }, [mounted, selectedPair]);

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
        {/* TradingView Chart */}
        <div className="bg-gray-900 rounded-lg p-2 sm:p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold">
                {tradingPairs.find(pair => pair.symbol === selectedPair)?.name || 'BTC/USDT'}
              </h2>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 sm:px-3 py-1 sm:py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              >
                {tradingPairs.map((pair) => (
                  <option key={pair.symbol} value={pair.symbol}>
                    {pair.icon} {pair.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className={`font-bold ${parseFloat(priceChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${currentPrice}
                <span className="ml-1 sm:ml-2">
                  {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}%
                </span>
              </div>
            </div>
          </div>
          
          {/* TradingView Widget - Mobile Responsive */}
          <div className="w-full h-64 sm:h-80 lg:h-96 bg-gray-800 rounded-lg overflow-hidden">
            <iframe
                              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_features&symbol=CRYPTOCAP%3A${selectedPair.replace('USDT', '')}&interval=D&hidesidetoolbar=0&hidetrading=0&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies=%5B%5D&hide_volume=0&save_image=0&toolbarbg=f1f3f6&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&page-uri=localhost%3A3000%2Ffeatures`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowTransparency={true}
              allowFullScreen={true}
              title="TradingView Chart"
            />
          </div>
          
          {/* 24h Stats - Mobile Responsive */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 text-xs sm:text-sm">
            <div className="bg-gray-800 p-2 sm:p-3 rounded">
              <div className="text-gray-400 text-xs sm:text-sm">24h High</div>
              <div className="font-bold text-xs sm:text-sm">${high24h}</div>
            </div>
            <div className="bg-gray-800 p-2 sm:p-3 rounded">
              <div className="text-gray-400 text-xs sm:text-sm">24h Low</div>
              <div className="font-bold text-xs sm:text-sm">${low24h}</div>
            </div>
            <div className="bg-gray-800 p-2 sm:p-3 rounded">
              <div className="text-gray-400 text-xs sm:text-sm">24h Volume</div>
              <div className="font-bold text-xs sm:text-sm">${(parseFloat(volume24h) / 1000000).toFixed(2)}M</div>
            </div>
          </div>
        </div>

        {/* Trading Buttons - Mobile Responsive */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
          <button
            onClick={() => handleOrderClick('BUY')}
            className="bg-green-600 hover:bg-green-700 text-white py-3 sm:py-4 px-3 sm:px-6 rounded-lg font-bold text-sm sm:text-base lg:text-lg transition-colors"
          >
            BUY UP
          </button>
          <button
            onClick={() => handleOrderClick('SELL')}
            className="bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 px-3 sm:px-6 rounded-lg font-bold text-sm sm:text-base lg:text-lg transition-colors"
          >
            BUY FALL
          </button>
        </div>

        {/* Open Orders Section - Mobile Responsive */}
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4 mb-4">
          <h3 className="text-base sm:text-lg font-bold mb-4">Open Orders</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
              <div>
                <div className="font-medium text-sm sm:text-base">BTC/USDT</div>
                <div className="text-xs sm:text-sm text-gray-400">Market Order</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm sm:text-base">$50,000.00</div>
                <div className="text-xs sm:text-sm text-green-500">+2.5%</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
              <div>
                <div className="font-medium text-sm sm:text-base">ETH/USDT</div>
                <div className="text-xs sm:text-sm text-gray-400">Limit Order</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm sm:text-base">$3,200.00</div>
                <div className="text-xs sm:text-sm text-red-500">-1.2%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Modal - Mobile Responsive */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-bold">{orderSide === 'buy' ? 'BUY UP' : 'BUY FALL'} Order</h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleOrderConfirm} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Leverage</label>
                  <select
                    value={selectedLeverage}
                    onChange={(e) => setSelectedLeverage(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                  >
                    <option value="1x">1x</option>
                    <option value="2x">2x</option>
                    <option value="5x">5x</option>
                    <option value="10x">10x</option>
                    <option value="20x">20x</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Duration Period</label>
                  <div className="grid grid-cols-4 gap-2">
                    {durationOptions.map((option) => (
                      <button
                        key={option.seconds}
                        type="button"
                        onClick={() => setSelectedDuration(option.seconds)}
                        className={`py-3 px-2 rounded-lg transition-colors text-center ${
                          selectedDuration === option.seconds
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <div className="text-xs font-bold">{option.seconds}s</div>
                        <div className="text-xs opacity-75">{option.percentage}%</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Amount (USDT)</label>
                  <input
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    placeholder="100"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
                
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs sm:text-sm text-gray-400">Duration Period</div>
                  <div className="font-bold text-blue-500 text-sm sm:text-base">
                    {selectedDuration}s ({durationOptions.find(opt => opt.seconds === selectedDuration)?.percentage}%)
                  </div>
                </div>
                
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs sm:text-sm text-gray-400">Projected Profit</div>
                  <div className="font-bold text-green-500 text-sm sm:text-base">
                    ${calculateProjectedProfit().toFixed(2)}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded font-medium text-sm sm:text-base transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 px-4 rounded font-medium text-sm sm:text-base transition-colors ${
                      orderSide === 'buy' 
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Spot Trading Modal - Mobile Responsive */}
        {showSpotModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-bold">Spot Trading</h3>
                <button
                  onClick={() => setShowSpotModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSpotTrade} className="space-y-3 sm:space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTradeType('BUY')}
                    className={`flex-1 py-3 px-4 rounded font-medium text-sm sm:text-base ${
                      tradeType === 'BUY' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeType('SELL')}
                    className={`flex-1 py-3 px-4 rounded font-medium text-sm sm:text-base ${
                      tradeType === 'SELL' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    SELL
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Price (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={currentPrice}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Quantity (BTC)</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="0.001"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-xs sm:text-sm text-gray-400">Amount (USDT)</div>
                  <div className="font-bold text-sm sm:text-base">$0.00</div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSpotModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded font-medium text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 px-4 rounded font-medium text-sm sm:text-base ${
                      tradeType === 'BUY' 
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {tradeType}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 