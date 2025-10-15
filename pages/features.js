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
  const [lastPrice, setLastPrice] = useState('0.00');
  const [activeTrades, setActiveTrades] = useState([]);
  const [activeTradesLoading, setActiveTradesLoading] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // User balance state
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [userBalances, setUserBalances] = useState({});
  
  // Modal trading pair selection
  const [modalSelectedPair, setModalSelectedPair] = useState('BTCUSDT');
  
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
  

  
  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      case 'very-low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  // Top 10 trading pairs from CoinMarketCap
  const tradingPairs = [
    { symbol: 'BTCUSDT', name: 'Bitcoin/USDT', base: 'BTC', quote: 'USDT' },
    { symbol: 'ETHUSDT', name: 'Ethereum/USDT', base: 'ETH', quote: 'USDT' },
    { symbol: 'XRPUSDT', name: 'XRP/USDT', base: 'XRP', quote: 'USDT' },
    { symbol: 'USDTUSDT', name: 'Tether USDt/USDT', base: 'USDT', quote: 'USDT' },
    { symbol: 'BNBUSDT', name: 'BNB/USDT', base: 'BNB', quote: 'USDT' },
    { symbol: 'SOLUSDT', name: 'Solana/USDT', base: 'SOL', quote: 'USDT' },
    { symbol: 'USDCUSDT', name: 'USDC/USDT', base: 'USDC', quote: 'USDT' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin/USDT', base: 'DOGE', quote: 'USDT' },
    { symbol: 'TRXUSDT', name: 'TRON/USDT', base: 'TRX', quote: 'USDT' },
    { symbol: 'ADAUSDT', name: 'Cardano/USDT', base: 'ADA', quote: 'USDT' }
  ];

  // Navigation tabs are already defined at the top of the component

  // Handle order button clicks
  const handleOrderClick = (type) => {
    console.log('Button clicked:', type); // Keep one debug log
    setOrderSide(type === 'BUY' ? 'buy' : 'sell');
    setModalSelectedPair(selectedPair); // Initialize modal pair with current selection
    setShowOrderModal(true);
  };

  // Show notification modal
  const showNotification = (title, message, type = 'info') => {
    setNotificationData({ title, message, type });
    setShowNotificationModal(true);
  };

  // Get available balance for selected trading pair
  const getAvailableBalance = (pairSymbol) => {
    const pair = tradingPairs.find(p => p.symbol === pairSymbol);
    if (!pair) return 0;
    
    // For trading, users need the quote currency (USDT) to buy any pair
    // This represents the amount they can spend
    return userBalances[pair.quote] || 0;
  };

  // Get pair info for modal
  const getModalPair = () => {
    return tradingPairs.find(pair => pair.symbol === modalSelectedPair) || tradingPairs[0];
  };

  // Calculate projected profit based on amount, duration percentage, and leverage
  // Test balance functionality removed - using only real user data

  // Fetch trade history from database
  const fetchTradeHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found for trade history');
        setTradeHistory([]);
        return;
      }

      const response = await fetch('/api/trading/trade-history?limit=5', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Trade history fetched:', data.trades);
        setTradeHistory(data.trades || []);
      } else {
        console.error('Failed to fetch trade history:', response.status);
        // Show error in UI
        setTradeHistory([{ 
          id: 'error', 
          error: true, 
          message: `Failed to load trade history: ${response.status}` 
        }]);
      }
    } catch (error) {
      console.error('Error fetching trade history:', error);
      // Show error in UI
      setTradeHistory([{ 
        id: 'error', 
        error: true, 
        message: `Error loading trade history: ${error.message}` 
      }]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch active trades from database
  const fetchActiveTrades = async () => {
    try {
      setActiveTradesLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found for active trades');
        setActiveTrades([]);
        return;
      }

      const response = await fetch('/api/trading/active-trades', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('Fetching active trades - Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Active trades API response:', data);
        console.log('Number of trades:', data.trades?.length || 0);
        
        // Add current price to each trade for P&L calculation
        const tradesWithCurrentPrice = data.trades.map(trade => ({
          ...trade,
          currentPrice: parseFloat(currentPrice) || trade.entryPrice
        }));
        
        console.log('Setting active trades:', tradesWithCurrentPrice);
        setActiveTrades(tradesWithCurrentPrice);
      } else {
        console.error('Failed to fetch active trades:', response.status);
        setActiveTrades([]);
      }
    } catch (error) {
      console.error('Error fetching active trades:', error);
      setActiveTrades([]);
    } finally {
      setActiveTradesLoading(false);
    }
  };

  // Update countdown timers for active trades
  const updateTradeTimers = () => {
    setActiveTrades(prevTrades => 
      prevTrades.map(trade => {
        const now = new Date();
        const expiryTime = new Date(trade.expiresAt);
        const timeRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        
        return {
          ...trade,
          timeRemaining,
          isExpired: timeRemaining <= 0,
          currentPrice: parseFloat(currentPrice) || trade.entryPrice
        };
      })
    );
  };

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
        
        // Store all currency balances
        const balances = {};
        if (data.currencies && Array.isArray(data.currencies)) {
          data.currencies.forEach(currency => {
            balances[currency.currency] = currency.balance || 0;
          });
        }
        setUserBalances(balances);
        
        // Get USDT balance specifically for backward compatibility
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

    // Check if user has sufficient balance for selected trading pair
    const tradeAmount = parseFloat(orderAmount);
    const availableBalance = getAvailableBalance(modalSelectedPair);
    const modalPair = getModalPair();
    
    console.log('Balance check - Available:', availableBalance, 'Required:', tradeAmount, 'Pair:', modalSelectedPair);
    
    if (availableBalance < tradeAmount) {
      console.log('Insufficient balance detected - Available:', availableBalance, 'Required:', tradeAmount);
      showNotification(
        'Insufficient Balance', 
        `Required: $${tradeAmount.toFixed(2)} ${modalPair.quote}\nAvailable: $${availableBalance.toFixed(2)} ${modalPair.quote}`, 
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
          pair: modalSelectedPair,
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
        pair: modalSelectedPair,
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

      // Refresh active trades and history to show the new trade
      await fetchActiveTrades();
      await fetchTradeHistory();
      
      // Show success message
      showNotification(
        'Order Confirmed!', 
        `Type: ${order.type}
Duration: ${order.duration}s (${order.durationPercentage}%)
Amount: $${order.amount}
Leverage: ${order.leverage}
Entry Price: $${result.data.execution.price}`,
        'success'
      );
      
      // Refresh balance after trade
      await fetchBalance();
      
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
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.data) {
          const data = apiResponse.data;
          const newPrice = parseFloat(data.price).toFixed(2);
          

          
          setLastPrice(currentPrice);
          setCurrentPrice(newPrice);
          setPriceChange(parseFloat(data.change_24h || 0).toFixed(2));
          setHigh24h(parseFloat(data.price * 1.02).toFixed(2)); // Approximate high
          setLow24h(parseFloat(data.price * 0.98).toFixed(2)); // Approximate low
          setVolume24h(parseFloat(data.volume || 0).toFixed(0));
          

          
          setLoading(false);
        } else {
          throw new Error('Invalid API response format');
        }
      } else {
        console.error(`Failed to fetch ${selectedPair} from API`);
        // Use fallback data if API fails
        setCurrentPrice('45000.00');
        setPriceChange('2.50');
        setHigh24h('46000.00');
        setLow24h('44000.00');
        setVolume24h('1000000');

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
      fetchActiveTrades(); // Fetch active trades
      fetchTradeHistory(); // Fetch trade history
      const interval = setInterval(fetchCryptoData, 10000);
      return () => clearInterval(interval);
    }
  }, [mounted, selectedPair]);

  // Fetch balance when user authentication changes
  useEffect(() => {
    fetchBalance();
    fetchActiveTrades();
    fetchTradeHistory();
  }, []);

  // Set up real-time countdown timer for active trades
  useEffect(() => {
    if (activeTrades.length > 0) {
      const timerInterval = setInterval(() => {
        updateTradeTimers();
      }, 1000); // Update every second
      
      return () => clearInterval(timerInterval);
    }
  }, [activeTrades.length, currentPrice]);

  // Refresh active trades periodically
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchActiveTrades();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Refresh trade history periodically
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchTradeHistory();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Auto-expire trades scheduler - runs every 5 minutes
  useEffect(() => {
    const runScheduler = async () => {
      try {
        console.log('🕐 Running auto-expire scheduler...');
        const response = await fetch('/api/trading/auto-expire-trades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Auto-expire scheduler completed:', result);
          
          // If trades were expired, refresh the active trades and balance
          if (result.processed > 0) {
            console.log(`🔄 ${result.processed} trades were auto-expired, refreshing data...`);
            fetchActiveTrades();
            fetchBalance();
            fetchTradeHistory();
          }
        } else {
          console.error('❌ Auto-expire scheduler failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Auto-expire scheduler error:', error);
      }
    };

    // Run immediately on mount
    runScheduler();
    
    // Then run every 5 minutes (300000 ms)
    const schedulerInterval = setInterval(runScheduler, 300000);
    
    return () => clearInterval(schedulerInterval);
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

      

      
      {/* Main Content */}
      <div className="flex-1 bg-black p-3 sm:p-4 md:p-6">
        {/* TradingView Chart */}
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4 md:p-6 mb-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                {tradingPairs.find(pair => pair.symbol === selectedPair)?.name || 'BTC/USDT'}
              </h2>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all w-full sm:w-auto"
              >
                {tradingPairs.map((pair) => (
                  <option key={pair.symbol} value={pair.symbol}>
                    {pair.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-sm sm:text-base">
              <div className={`font-bold ${parseFloat(priceChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span className="text-lg sm:text-xl">${currentPrice}</span>
                <span className="ml-2 text-sm sm:text-base">
                  {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}%
                </span>
              </div>
            </div>
          </div>
          
          {/* TradingView Widget - Mobile Responsive */}
          <div className="w-full h-72 sm:h-80 md:h-96 lg:h-[500px] bg-gray-800 rounded-lg overflow-hidden shadow-inner">
            <iframe
                              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_features&symbol=CRYPTOCAP%3A${selectedPair.replace('USDT', '')}&interval=D&hidesidetoolbar=0&hidetrading=0&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies=%5B%5D&hide_volume=0&save_image=0&toolbarbg=f1f3f6&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&page-uri=localhost%3A3000%2Ffeatures`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowtransparency="true"
              allowFullScreen={true}
              title="TradingView Chart"
            />
          </div>
          
          {/* 24h Stats - Mobile Responsive */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-6 text-sm sm:text-base">
            <div className="bg-gray-800 p-3 sm:p-4 md:p-5 rounded-lg shadow-md hover:bg-gray-750 transition-colors">
              <div className="text-gray-400 text-xs sm:text-sm md:text-base mb-1">24h High</div>
              <div className="font-bold text-sm sm:text-base md:text-lg text-green-400">${high24h}</div>
            </div>
            <div className="bg-gray-800 p-3 sm:p-4 md:p-5 rounded-lg shadow-md hover:bg-gray-750 transition-colors">
              <div className="text-gray-400 text-xs sm:text-sm md:text-base mb-1">24h Low</div>
              <div className="font-bold text-sm sm:text-base md:text-lg text-red-400">${low24h}</div>
            </div>
            <div className="bg-gray-800 p-3 sm:p-4 md:p-5 rounded-lg shadow-md hover:bg-gray-750 transition-colors">
              <div className="text-gray-400 text-xs sm:text-sm md:text-base mb-1">24h Volume</div>
              <div className="font-bold text-sm sm:text-base md:text-lg text-blue-400">${(parseFloat(volume24h) / 1000000).toFixed(2)}M</div>
            </div>
          </div>
        </div>



        {/* Enhanced Trading Buttons - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 px-2 sm:px-0">
          <button
            onClick={() => handleOrderClick('BUY')}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 text-white py-3 sm:py-4 px-3 sm:px-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-green-500/30 touch-manipulation"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl sm:text-2xl">📈</span>
              <span className="tracking-wide">BUY UP</span>
            </div>
          </button>
          <button
            onClick={() => handleOrderClick('SELL')}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white py-3 sm:py-4 px-3 sm:px-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-red-500/30 touch-manipulation"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl sm:text-2xl">📉</span>
              <span className="tracking-wide">BUY FALL</span>
            </div>
          </button>
        </div>

        {/* Enhanced Open Orders Section - Mobile Responsive */}
        <div className="bg-gray-900 rounded-xl p-4 sm:p-5 md:p-6 mb-6 border border-gray-700 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400">📊 Open Orders</h3>
            <div className="ml-auto bg-blue-900/30 px-3 py-2 rounded-full">
              <span className="text-blue-300 text-xs sm:text-sm font-medium">Live ({activeTrades.length})</span>
            </div>
          </div>
          <div className="space-y-3">
            {activeTradesLoading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Loading active trades...</p>
              </div>
            ) : activeTrades.length === 0 ? (
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
                        <div className={`px-2 py-1 rounded-lg border mb-1 ${
                          trade.isExpired ? 'bg-red-900/30 border-red-700/50' :
                          trade.timeRemaining < 60 ? 'bg-red-900/30 border-red-700/50' :
                          trade.timeRemaining < 180 ? 'bg-orange-900/30 border-orange-700/50' :
                          'bg-green-900/30 border-green-700/50'
                        }`}>
                          <span className={`text-xs font-bold ${
                            trade.isExpired ? 'text-red-300' :
                            trade.timeRemaining < 60 ? 'text-red-300' :
                            trade.timeRemaining < 180 ? 'text-orange-300' :
                            'text-green-300'
                          }`}>
                            {trade.isExpired ? '⏰ EXPIRED' : `⏰ ${formatTime(trade.timeRemaining)}`}
                          </span>
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
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Trade History Section */}
        <div className="bg-gray-900 rounded-xl p-4 sm:p-5 md:p-6 mb-6 border border-gray-700 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-400">📈 Recent Results</h3>
            <div className="ml-auto bg-purple-900/30 px-3 py-2 rounded-full">
              <span className="text-purple-300 text-xs sm:text-sm font-medium">History ({tradeHistory.length})</span>
            </div>
          </div>
          <div className="space-y-3">
            {historyLoading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Loading trade history...</p>
              </div>
            ) : tradeHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📈</div>
                <p className="text-sm">No completed trades</p>
                <p className="text-xs mt-1">Your trading results will appear here</p>
              </div>
            ) : tradeHistory.some(trade => trade.error) ? (
              <div className="text-center py-8 text-red-400">
                <div className="text-4xl mb-2">❌</div>
                <p className="text-sm">{tradeHistory[0].message}</p>
              </div>
            ) : (
              tradeHistory.map((trade) => {
                // Handle error items
                if (trade.error) {
                  return (
                    <div key={trade.id} className="bg-red-900/30 rounded-xl p-3 border border-red-700/50">
                      <div className="text-red-300 text-center">{trade.message}</div>
                    </div>
                  );
                }
                
                const formatDate = (dateString) => {
                  const date = new Date(dateString);
                  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                };
                
                return (
                  <div key={trade.id} className="bg-gradient-to-r from-gray-800 to-gray-750 rounded-xl p-3 border border-gray-600 hover:border-gray-500 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          trade.resultStatus === 'win' ? 'bg-green-500' :
                          trade.resultStatus === 'loss' ? 'bg-red-500' :
                          trade.resultStatus === 'expired' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`}></div>
                        <div>
                          <div className={`font-medium text-sm sm:text-base flex items-center gap-1 ${
                            trade.type === 'BUY UP' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.type === 'BUY UP' ? '📈' : '📉'} {trade.pair}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400">{trade.type} • {trade.leverage}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded-lg border mb-1 ${
                          trade.resultStatus === 'win' ? 'bg-green-900/30 border-green-700/50' :
                          trade.resultStatus === 'loss' ? 'bg-red-900/30 border-red-700/50' :
                          trade.resultStatus === 'expired' ? 'bg-orange-900/30 border-orange-700/50' :
                          'bg-gray-900/30 border-gray-700/50'
                        }`}>
                          <span className={`text-xs font-bold ${
                            trade.resultStatus === 'win' ? 'text-green-300' :
                            trade.resultStatus === 'loss' ? 'text-red-300' :
                            trade.resultStatus === 'expired' ? 'text-orange-300' :
                            'text-gray-300'
                          }`}>
                            {trade.resultStatus === 'win' ? '✅ WON' :
                             trade.resultStatus === 'loss' ? '❌ LOST' :
                             trade.resultStatus === 'expired' ? '⏰ EXPIRED' :
                             '✅ COMPLETED'}
                          </span>
                        </div>
                        <div className="font-medium text-sm sm:text-base">${trade.amount.toFixed(2)}</div>
                        <div className={`text-xs sm:text-sm font-bold ${
                          trade.isProfit ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {trade.isProfit ? '+' : ''}${trade.finalPnl.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-400">Entry: ${trade.entryPrice.toFixed(2)}</span>
                      {trade.exitPrice && (
                        <span className="text-xs text-gray-400">Exit: ${trade.exitPrice.toFixed(2)}</span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(trade.completedAt)}</span>
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

        {/* Compact Order Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-lg p-3 sm:p-4 w-full max-w-sm mx-auto shadow-xl border border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${orderSide === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h3 className={`text-sm font-bold ${orderSide === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {orderSide === 'buy' ? '📈 BUY UP' : '📉 BUY FALL'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleOrderConfirm} className="space-y-2">
                {/* Trading Pair */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">🔄 Pair</label>
                  <select
                    value={modalSelectedPair}
                    onChange={(e) => setModalSelectedPair(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                  >
                    {tradingPairs.map((pair) => (
                      <option key={pair.symbol} value={pair.symbol}>
                        {pair.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">💰 Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      placeholder="100"
                      className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 pl-6 text-white focus:outline-none focus:border-blue-500 text-xs"
                      min="1"
                      required
                    />
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">$</span>
                  </div>
                </div>
                
                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">⏱️ Duration</label>
                  <div className="grid grid-cols-4 gap-1">
                    {durationOptions.map((option) => (
                      <button
                        key={option.seconds}
                        type="button"
                        onClick={() => setSelectedDuration(option.seconds)}
                        className={`py-1.5 px-1 rounded text-center border text-xs ${
                          selectedDuration === option.seconds
                            ? 'bg-blue-600 text-white font-bold border-blue-500'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600'
                        }`}
                      >
                        <div className="font-bold">{option.seconds}s</div>
                        <div className="opacity-75">{option.percentage}%</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Balance Info */}
                <div className="bg-gray-800 rounded p-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">💰 Balance:</span>
                    <span className="text-green-400">${getAvailableBalance(modalSelectedPair).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">📈 Profit:</span>
                    <span className="text-green-400">+${calculateProjectedProfit().toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 px-3 rounded font-medium text-xs ${
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
      
      {/* Navigation - Mobile Responsive (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around bg-[#181c23]/95 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-800 overflow-x-auto z-10 shadow-2xl">
        {navTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.route)}
            className={`flex flex-col items-center justify-center gap-2 px-3 sm:px-5 py-3 sm:py-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap touch-manipulation transform hover:scale-105 active:scale-95 ${
              router.pathname === tab.route
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/70 active:bg-gray-600'
            }`}
          >
            <span className="text-base sm:text-lg">{tab.icon}</span>
            <span className="text-xs sm:text-sm font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the navbar */}
      <div className="pb-20 sm:pb-24"></div>
    </div>
  );
}