import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function FeaturesPage() {
  const navTabs = [
    { label: 'HOME', icon: '🏠', route: '/exchange' },
    { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
    { label: 'MARKET', icon: '📊', route: '/market' },
    { label: 'FEATURES', icon: '✨', route: '/features' },
    { label: 'TRADE', icon: '💱', route: '/trade' },
  ];
  
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
  
  // Enhanced UI state variables
  const [priceDirection, setPriceDirection] = useState('neutral'); // 'up', 'down', 'neutral'
  const [lastPrice, setLastPrice] = useState('0.00');
  const [activeTrades, setActiveTrades] = useState([]);
  const [marketSentiment, setMarketSentiment] = useState('neutral'); // 'bullish', 'bearish', 'neutral'
  const [priceAnimation, setPriceAnimation] = useState(false);
  
  // User balance state
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  
  // Modal state for notifications
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'info' });

  // Duration options with percentages (keeping original format)
  const durationOptions = [
    { seconds: 60, percentage: 30 },
    { seconds: 120, percentage: 50 },
    { seconds: 180, percentage: 70 },
    { seconds: 360, percentage: 100 }
  ];
  
  // Market sentiment indicators
  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };
  
  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '➡️';
    }
  };
  
  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      case 'very-low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

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

  // Navigation tabs are already defined at the top of the component

  // Handle order button clicks
  const handleOrderClick = (type) => {
    setOrderSide(type === 'BUY' ? 'buy' : 'sell');
    setShowOrderModal(true);
  };

  // Show notification modal
  const showNotification = (title, message, type = 'info') => {
    setNotificationData({ title, message, type });
    setShowNotificationModal(true);
  };

  // Calculate projected profit based on amount, duration percentage, and leverage
  // Test balance functionality removed - using only real user data

  // Fetch user balance
  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      // Debug logging
      console.log('🔍 [Balance] Session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      
      // Only use authenticated user data - no fallbacks
      if (!session) {
        console.log('❌ [Balance] No session found, user must be authenticated');
        setBalance(0);
        return;
      }
      
      const userId = session.user.id; // Use actual user ID from auth
      
      console.log('🔍 [Balance] Using user ID:', userId);

      const response = await fetch(`/api/portfolio/balance?userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 [Balance] API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [Balance] API response data:', data);
        // Get USDT balance specifically
        const usdtBalance = data.currencies?.find(c => c.currency === 'USDT')?.balance || 0;
        console.log('🔍 [Balance] USDT balance found:', usdtBalance);
        setBalance(usdtBalance);
      } else {
        const errorText = await response.text();
        console.error('❌ [Balance] Failed to fetch balance:', response.status, errorText);
        setBalance(0);
      }
    } catch (error) {
      console.error('❌ [Balance] Error fetching balance:', error);
      setBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

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
  const handleOrderConfirm = async (e) => {
    e.preventDefault();
    
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      showNotification('Invalid Amount', 'Please enter a valid amount', 'error');
      return;
    }

    // Check if user has sufficient balance
    const tradeAmount = parseFloat(orderAmount);
    console.log('Balance check - Available:', balance, 'Required:', tradeAmount);
    
    if (balance < tradeAmount) {
      console.log('Insufficient balance detected - Available:', balance, 'Required:', tradeAmount);
      showNotification(
        'Insufficient Balance', 
        `Required: $${tradeAmount.toFixed(2)}\nAvailable: $${balance.toFixed(2)}`, 
        'error'
      );
      return;
    }
    
    console.log('Balance check passed - proceeding with trade');

    try {
      // Get auth token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('Authentication Required', 'Please log in to place trades', 'warning');
        return;
      }

      // Convert duration from seconds to appropriate format
      const durationInSeconds = selectedDuration;
      let durationString;
      if (durationInSeconds < 60) {
        durationString = `${durationInSeconds}s`;
      } else if (durationInSeconds < 3600) {
        durationString = `${Math.floor(durationInSeconds / 60)}m`;
      } else {
        durationString = `${Math.floor(durationInSeconds / 3600)}h`;
      }

      // Create trade via API
      const response = await fetch('/api/trading/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          pair: selectedPair,
          side: orderSide, // 'buy' or 'sell'
          type: 'market',
          amount: parseFloat(orderAmount),
          leverage: parseInt(selectedLeverage.replace('x', '')),
          duration: durationString
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create trade');
      }

      // Create local order object for UI display
      const order = {
        id: result.data.trade.id.toString(),
        type: orderSide === 'buy' ? 'BUY UP' : 'BUY FALL',
        pair: selectedPair,
        leverage: selectedLeverage,
        duration: selectedDuration,
        durationPercentage: durationOptions.find(opt => opt.seconds === selectedDuration)?.percentage,
        amount: parseFloat(orderAmount),
        projectedProfit: calculateProjectedProfit(),
        entryPrice: result.data.execution.price,
        currentPrice: result.data.execution.price,
        timestamp: new Date().toISOString(),
        status: 'active',
        timeLeft: selectedDuration,
        pnl: 0
      };

      // Add order to active trades
      setActiveTrades(prev => [...prev, order]);
      
      // Show success message
      showNotification(
        'Order Confirmed!', 
        `Type: ${order.type}\nDuration: ${order.duration}s (${order.durationPercentage}%)\nAmount: $${order.amount}\nLeverage: ${order.leverage}\nEntry Price: $${result.data.execution.price}`,
        'success'
      );
      
      // Close modal and reset form
      setShowOrderModal(false);
      setOrderAmount('');
      setSelectedDuration(360);
      setSelectedLeverage('1x');

    } catch (error) {
      console.error('Error creating trade:', error);
      showNotification('Trade Failed', `Failed to create trade: ${error.message}`, 'error');
    }
  };

  // Enhanced fetch crypto data with price direction tracking
  const fetchCryptoData = async () => {
    try {
      // Use relative URL to work with Next.js proxy
      const response = await fetch(`/api/trading/price/${selectedPair}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        const newPrice = parseFloat(data.price).toFixed(2);
        
        // Track price direction for animations
        if (lastPrice !== '0.00' && newPrice !== lastPrice) {
          setPriceDirection(parseFloat(newPrice) > parseFloat(lastPrice) ? 'up' : 'down');
          setPriceAnimation(true);
          setTimeout(() => setPriceAnimation(false), 1000);
        }
        
        setLastPrice(currentPrice);
        setCurrentPrice(newPrice);
        setPriceChange(parseFloat(data.change || 0).toFixed(2));
        setHigh24h(parseFloat(data.highPrice || data.price).toFixed(2));
        setLow24h(parseFloat(data.lowPrice || data.price).toFixed(2));
        setVolume24h(parseFloat(data.volume || 0).toFixed(0));
        
        // Update market sentiment based on price change
        const change = parseFloat(data.change || 0);
        if (change > 2) {
          setMarketSentiment('bullish');
        } else if (change < -2) {
          setMarketSentiment('bearish');
        } else {
          setMarketSentiment('neutral');
        }
        
        setLoading(false);
      } else {
        console.error(`Failed to fetch ${selectedPair} from API`);
        // Use fallback data if API fails
        setCurrentPrice('45000.00');
        setPriceChange('2.50');
        setHigh24h('46000.00');
        setLow24h('44000.00');
        setVolume24h('1000000');
        setMarketSentiment('neutral');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      // Use fallback data on error for production
      setCurrentPrice('45000.00');
      setPriceChange('2.50');
      setHigh24h('46000.00');
      setLow24h('44000.00');
      setVolume24h('1000000');
      setMarketSentiment('neutral');
      setLoading(false);
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
    // Set initial loading to false after a short delay to prevent infinite loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) {
      setLoading(true); // Set loading when fetching data
      fetchCryptoData();
      fetchBalance(); // Fetch user balance
      const interval = setInterval(fetchCryptoData, 10000);
      return () => clearInterval(interval);
    }
  }, [mounted, selectedPair]);

  // Fetch balance when user authentication changes
  useEffect(() => {
    fetchBalance();
  }, []);

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

        {/* Market Sentiment Indicator */}
        <div className="bg-gray-900 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Market Sentiment:</span>
              <span className={`font-bold text-sm ${getSentimentColor(marketSentiment)}`}>
                {getSentimentIcon(marketSentiment)} {marketSentiment.toUpperCase()}
              </span>
            </div>
            <div className={`text-2xl font-bold transition-all duration-500 ${priceAnimation ? 'scale-110' : 'scale-100'} ${
              priceDirection === 'up' ? 'text-green-400' : 
              priceDirection === 'down' ? 'text-red-400' : 'text-white'
            }`}>
              ${currentPrice}
            </div>
          </div>
        </div>

        {/* Enhanced Trading Buttons - Mobile Responsive */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
          <button
            onClick={() => handleOrderClick('BUY')}
            className="relative bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 sm:py-5 px-3 sm:px-6 rounded-lg font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">📈</span>
              <span>BUY UP</span>
              <span className="text-xs opacity-75 mt-1">Predict Price Rise</span>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 rounded-lg transition-opacity"></div>
          </button>
          <button
            onClick={() => handleOrderClick('SELL')}
            className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 sm:py-5 px-3 sm:px-6 rounded-lg font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">📉</span>
              <span>BUY FALL</span>
              <span className="text-xs opacity-75 mt-1">Predict Price Drop</span>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 rounded-lg transition-opacity"></div>
          </button>
        </div>

        {/* Enhanced Open Orders Section - Mobile Responsive */}
        <div className="bg-gray-900 rounded-xl p-3 sm:p-4 mb-4 border border-gray-700 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-base sm:text-lg font-bold text-blue-400">📊 Open Orders</h3>
            <div className="ml-auto bg-blue-900/30 px-2 py-1 rounded-full">
              <span className="text-blue-300 text-xs font-medium">Live ({activeTrades.length})</span>
            </div>
          </div>
          <div className="space-y-3">
            {activeTrades.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm">No active trades</p>
                <p className="text-xs mt-1">Place a BUY UP or BUY FALL order to see it here</p>
              </div>
            ) : (
              activeTrades.map((trade) => {
                const formatTime = (seconds) => {
                  const mins = Math.floor(seconds / 60);
                  const secs = seconds % 60;
                  return `${mins}m ${secs}s`;
                };
                
                const calculatePnL = () => {
                  const priceDiff = trade.currentPrice - trade.entryPrice;
                  const leverage = parseFloat(trade.leverage.replace('x', ''));
                  let pnl = 0;
                  
                  if (trade.type === 'BUY UP') {
                    pnl = (priceDiff / trade.entryPrice) * trade.amount * leverage;
                  } else {
                    pnl = (-priceDiff / trade.entryPrice) * trade.amount * leverage;
                  }
                  
                  return pnl;
                };
                
                const pnl = calculatePnL();
                const isProfit = pnl >= 0;
                
                return (
                  <div key={trade.id} className="bg-gradient-to-r from-gray-800 to-gray-750 rounded-xl p-3 border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${trade.type === 'BUY UP' ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse`}></div>
                        <div>
                          <div className={`font-medium text-sm sm:text-base ${trade.type === 'BUY UP' ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
                            {trade.type === 'BUY UP' ? '📈' : '📉'} {trade.pair}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400">{trade.type} Order</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-orange-900/30 px-2 py-1 rounded-lg border border-orange-700/50 mb-1">
                          <span className="text-orange-300 text-xs font-bold">⏰ {formatTime(trade.timeLeft)}</span>
                        </div>
                        <div className="font-medium text-sm sm:text-base">${trade.amount.toFixed(2)}</div>
                        <div className={`text-xs sm:text-sm ${isProfit ? 'text-green-500' : 'text-red-500'} animate-pulse`}>
                          {isProfit ? '+' : ''}${pnl.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-400">Entry: ${trade.entryPrice.toFixed(2)}</span>
                      <span className="text-xs text-gray-400">Current: ${trade.currentPrice.toFixed(2)}</span>
                      <button 
                        onClick={() => {
                          setActiveTrades(prev => prev.filter(t => t.id !== trade.id));
                          showNotification(
                            'Trade Closed Early',
                            `P&L: ${isProfit ? '+' : ''}$${pnl.toFixed(2)}`,
                            isProfit ? 'success' : 'error'
                          );
                        }}
                        className="text-red-400 hover:text-red-300 text-xs font-medium px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                      >
                        Close Early
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-md mx-auto shadow-2xl border border-gray-700 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    notificationData.type === 'success' ? 'bg-green-500' :
                    notificationData.type === 'error' ? 'bg-red-500' :
                    notificationData.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <h3 className={`text-base sm:text-lg font-bold ${
                    notificationData.type === 'success' ? 'text-green-400' :
                    notificationData.type === 'error' ? 'text-red-400' :
                    notificationData.type === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {notificationData.type === 'success' ? '✅' :
                     notificationData.type === 'error' ? '❌' :
                     notificationData.type === 'warning' ? '⚠️' : 'ℹ️'} {notificationData.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <p className="text-gray-300 whitespace-pre-line">{notificationData.message}</p>
              </div>
              
              <button
                onClick={() => setShowNotificationModal(false)}
                className={`w-full py-3 px-4 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  notificationData.type === 'success' ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border border-green-500' :
                  notificationData.type === 'error' ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border border-red-500' :
                  notificationData.type === 'warning' ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white border border-yellow-500' :
                  'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border border-blue-500'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Order Modal - Mobile Responsive */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-md mx-auto shadow-2xl border border-gray-700 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${orderSide === 'buy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                  <h3 className={`text-base sm:text-lg font-bold ${orderSide === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {orderSide === 'buy' ? '📈 BUY UP' : '📉 BUY FALL'} Order
                  </h3>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Market Info Banner */}
              <div className="bg-gray-800 rounded-lg p-3 mb-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Current Price:</span>
                  <span className={`font-bold ${priceDirection === 'up' ? 'text-green-400' : priceDirection === 'down' ? 'text-red-400' : 'text-white'}`}>
                    ${currentPrice}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-300">24h Change:</span>
                  <span className={`font-bold ${parseFloat(priceChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}%
                  </span>
                </div>
              </div>
              
              {/* Balance Display */}
              <div className="bg-gray-800 rounded-lg p-3 mb-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <span className="text-green-400">💰</span>
                    Available Balance:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${balanceLoading ? 'text-gray-400' : 'text-green-400'}`}>
                      {balanceLoading ? 'Loading...' : `$${balance.toFixed(2)} USDT`}
                    </span>
                    <button
                      onClick={fetchBalance}
                      disabled={balanceLoading}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition-colors"
                      title="Refresh Balance"
                    >
                      🔄
                    </button>

                  </div>
                </div>
                {orderAmount && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-300">Can Afford:</span>
                    <span className={`font-bold ${balance >= parseFloat(orderAmount || 0) ? 'text-green-400' : 'text-red-400'}`}>
                      {balance >= parseFloat(orderAmount || 0) ? '✅ Yes' : '❌ Insufficient'}
                    </span>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleOrderConfirm} className="space-y-4">
                 <div>
                   <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                     <span className="text-blue-400">⚡</span>
                     Leverage
                   </label>
                   <select
                     value={selectedLeverage}
                     onChange={(e) => setSelectedLeverage(e.target.value)}
                     className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm sm:text-base transition-all duration-200 hover:border-gray-500"
                   >
                     <option value="1x">1x - Conservative</option>
                     <option value="2x">2x - Moderate</option>
                     <option value="5x">5x - Aggressive</option>
                     <option value="10x">10x - High Risk</option>
                     <option value="20x">20x - Maximum Risk</option>
                   </select>
                 </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <span className="text-purple-400">⏱️</span>
                    Duration Period
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {durationOptions.map((option) => (
                      <button
                        key={option.seconds}
                        type="button"
                        onClick={() => setSelectedDuration(option.seconds)}
                        className={`py-3 px-2 rounded-lg transition-all duration-200 text-center border ${
                          selectedDuration === option.seconds
                            ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-lg shadow-blue-500/25'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-xs font-bold">{option.seconds}s</div>
                        <div className="text-xs opacity-75">{option.percentage}%</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <span className="text-green-400">💰</span>
                    Amount (USDT)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      placeholder="100"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 pl-8 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm sm:text-base transition-all duration-200 hover:border-gray-500"
                      min="1"
                      required
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-4 rounded-lg border border-blue-700/50">
                  <div className="text-xs sm:text-sm text-blue-300 flex items-center gap-2">
                    <span className="text-blue-400">⏱️</span>
                    Duration Period
                  </div>
                  <div className="font-bold text-blue-400 text-sm sm:text-base">
                    {selectedDuration}s ({durationOptions.find(opt => opt.seconds === selectedDuration)?.percentage}%)
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 p-4 rounded-lg border border-green-700/50">
                  <div className="text-xs sm:text-sm text-green-300 flex items-center gap-2">
                    <span className="text-green-400">💰</span>
                    Projected Profit
                  </div>
                  <div className="font-bold text-green-400 text-lg sm:text-xl animate-pulse">
                    +${calculateProjectedProfit().toFixed(2)}
                  </div>
                  <div className="text-xs text-green-300 mt-1 opacity-75">
                    Risk/Reward: 1:{orderAmount ? (calculateProjectedProfit() / parseFloat(orderAmount)).toFixed(2) : '0.00'}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-4 px-4 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg border border-gray-500"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>❌</span>
                      Cancel
                    </span>
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-4 px-4 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-xl border ${
                      orderSide === 'buy' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-green-500 hover:shadow-green-500/25'
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-red-500 hover:shadow-red-500/25'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>{orderSide === 'buy' ? '🚀' : '⚡'}</span>
                      Confirm Order
                    </span>
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
      
      {/* Navigation - Mobile Responsive (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around bg-[#181c23] px-2 sm:px-4 py-2 border-t border-gray-800 overflow-x-auto z-10">
        {navTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.route)}
            className={`flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              router.pathname === tab.route
                ? 'bg-purple-600 text-white'
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