import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function TradePage() {
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
  const [orderBook, setOrderBook] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [orderType, setOrderType] = useState('market');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSide, setOrderSide] = useState('buy');
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Enhanced trading pairs list - Reduced for production stability
  const tradingPairs = [
    { symbol: 'BTCUSDT', name: 'Bitcoin/USDT', base: 'BTC', quote: 'USDT', icon: '₿' },
    { symbol: 'ETHUSDT', name: 'Ethereum/USDT', base: 'ETH', quote: 'USDT', icon: 'Ξ' },
    { symbol: 'BNBUSDT', name: 'BNB/USDT', base: 'BNB', quote: 'USDT', icon: 'B' },
    { symbol: 'SOLUSDT', name: 'Solana/USDT', base: 'SOL', quote: 'USDT', icon: 'S' },
    { symbol: 'XRPUSDT', name: 'Ripple/USDT', base: 'XRP', quote: 'USDT', icon: 'X' },
    { symbol: 'TRXUSDT', name: 'TRON/USDT', base: 'TRX', quote: 'USDT', icon: 'T' },
  ];

  // Fetch user orders
  const fetchUserOrders = async () => {
    try {
      setOrdersLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, skipping order fetch');
        return;
      }

      const response = await fetch('/api/trading/orders', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserOrders(data.orders || []);
      } else {
        console.error('Failed to fetch user orders');
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch crypto data from CoinMarketCap API
  const fetchPriceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use our backend API endpoint
      const response = await fetch(`/api/trading/price/${selectedPair}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPriceData(data);
      } else {
        console.error('Failed to fetch price data from CoinMarketCap API');
        setError('Failed to load price data. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError('Failed to load price data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch order book data
  const fetchOrderBook = async () => {
    try {
      const response = await fetch(`/api/trading/orderbook/${selectedPair}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderBook(data);
      } else {
        console.error('Failed to fetch order book from CoinMarketCap API');
        setOrderBook({ bids: [], asks: [] });
      }
    } catch (err) {
      console.error('Error fetching order book:', err);
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (!orderAmount || orderAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!orderPrice || orderPrice <= 0)) {
      alert('Please enter a valid price for limit orders');
      return;
    }

    try {
      setLoading(true);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to place orders');
        return;
      }

      const orderData = {
        symbol: selectedPair,
        side: orderSide,
        type: orderType,
        amount: orderAmount,
        price: orderType === 'limit' ? orderPrice : null
      };

      const response = await fetch('/api/trading/order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const result = await response.json();
      
      // Reset form
      setOrderAmount('');
      setOrderPrice('');
      setShowOrderModal(false);
      
      // Show success message
      alert(`Order placed successfully! Order ID: ${result.order.id}`);
      
      // Refresh data
      fetchPriceData();
      fetchUserOrders();
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchPriceData();
      fetchOrderBook();
      fetchUserOrders();
      
      const cryptoInterval = setInterval(fetchPriceData, 10000);
      const orderBookInterval = setInterval(fetchOrderBook, 5000);
      const ordersInterval = setInterval(fetchUserOrders, 30000);
      
      return () => {
        clearInterval(cryptoInterval);
        clearInterval(orderBookInterval);
        clearInterval(ordersInterval);
      };
    }
  }, [mounted, selectedPair]);

  const handleOrderClick = (side) => {
    setOrderSide(side);
    setOrderAmount('');
    setOrderPrice(priceData?.price?.toString() || '');
    setShowOrderModal(true);
  };

  const getCurrentPair = () => {
    return tradingPairs.find(pair => pair.symbol === selectedPair) || tradingPairs[0];
  };

  // Filter user orders for current pair
  const currentPairOrders = userOrders.filter(order => order.symbol === selectedPair);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-semibold">💱</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Spot Trading</h1>
            {loading && (
              <div className="flex items-center gap-2 text-xs text-green-400 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">Live</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Trading Pair Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
          >
            {tradingPairs.map((pair) => (
              <option key={pair.symbol} value={pair.symbol}>
                {pair.icon} {pair.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Trading Chart - Full width on mobile */}
          <div className="order-1 lg:order-1 lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-lg font-bold">Trading Chart</h2>
                <div className="text-sm text-gray-400">
                  {priceData?.price ? `$${Number(priceData.price).toFixed(4)}` : 'Loading...'}
                </div>
              </div>
              
              <div className="w-full h-64 sm:h-80 lg:h-96 bg-gray-900 rounded-lg overflow-hidden">
                <iframe
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_trade&symbol=CRYPTOCAP%3A${selectedPair.replace('USDT', '')}&interval=D&hidesidetoolbar=0&hidetrading=0&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies=%5B%5D&hide_volume=0&save_image=0&toolbarbg=f1f3f6&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&page-uri=localhost%3A3000%2Ftrade`}
                  style={{ width: '100%', height: '100%' }}
                  frameBorder="0"
                  allowTransparency={true}
                  allowFullScreen={true}
                  title="TradingView Chart"
                />
              </div>
            </div>
          </div>

          {/* Trading Panel - Stacked on mobile */}
          <div className="order-2 lg:order-2 space-y-4 sm:space-y-6">
            {/* Order Book */}
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold">Order Book</h3>
                {ordersLoading && (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              
              {orderBook ? (
                <div className="space-y-2 sm:space-y-3">
                  {/* Asks (Sell Orders) */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-medium">Asks</div>
                    <div className="max-h-20 sm:max-h-24 overflow-y-auto">
                      {orderBook?.asks?.slice(0, 5).map((ask, index) => (
                        <div key={index} className="flex justify-between text-xs sm:text-sm py-0.5">
                          <span className="text-red-400">{Number(ask?.price || 0).toFixed(4)}</span>
                          <span className="text-gray-400">{Number(ask?.quantity || 0).toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Current Price */}
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-bold text-white">
                        ${Number(priceData?.price || 0).toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-400">Current Price</div>
                    </div>
                  </div>
                  
                  {/* Bids (Buy Orders) */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-medium">Bids</div>
                    <div className="max-h-20 sm:max-h-24 overflow-y-auto">
                      {orderBook?.bids?.slice(0, 5).map((bid, index) => (
                        <div key={index} className="flex justify-between text-xs sm:text-sm py-0.5">
                          <span className="text-green-400">{Number(bid?.price || 0).toFixed(4)}</span>
                          <span className="text-gray-400">{Number(bid?.quantity || 0).toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  Loading order book...
                </div>
              )}
            </div>

            {/* User Orders */}
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Your Orders</h3>
              {currentPairOrders.length === 0 ? (
                <div className="text-center py-3 sm:py-4 text-gray-400">
                  <div className="text-xs sm:text-sm mb-2">No orders for {selectedPair}</div>
                  <div className="text-xs">Place your first order using the buttons below</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {currentPairOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-2 bg-gray-700 rounded text-xs sm:text-sm">
                      <div className="min-w-0 flex-1">
                        <div className={`font-medium truncate ${order.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                          {order.side.toUpperCase()} {order.symbol}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {order.type} • ${parseFloat(order.amount).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-xs text-gray-400">
                          {order.status}
                        </div>
                        {order.price && (
                          <div className="text-xs text-gray-300">
                            ${parseFloat(order.price).toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
          )}
        </div>

            {/* Trading Buttons */}
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Quick Trade</h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => handleOrderClick('buy')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold text-sm sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  BUY {getCurrentPair().base}
                </button>
                <button
                  onClick={() => handleOrderClick('sell')}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold text-sm sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  SELL {getCurrentPair().base}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Placement Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">
                {orderSide.toUpperCase()} {getCurrentPair().base}
              </h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-white p-1 touch-manipulation"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Order Type */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Order Type</label>
                <select 
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2.5 sm:py-2 text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                </select>
              </div>
              
              {/* Price Input (for limit orders) */}
              {orderType === 'limit' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Price (USDT)</label>
                  <input 
                    type="number" 
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    placeholder="Enter price"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2.5 sm:py-2 text-sm focus:border-cyan-500 focus:outline-none"
                    step="0.0001"
                  />
                </div>
              )}
              
              {/* Amount Input */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Amount (USDT)</label>
                <input 
                  type="number" 
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2.5 sm:py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  step="0.01"
                />
              </div>
              
              {/* Order Summary */}
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">Order Summary</div>
                <div className="text-xs sm:text-sm space-y-0.5">
                  <div>Type: {orderType.toUpperCase()}</div>
                  <div>Side: {orderSide.toUpperCase()}</div>
                  <div>Amount: ${orderAmount || '0.00'}</div>
                  {orderType === 'limit' && orderPrice && (
                    <div>Price: ${orderPrice}</div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2.5 sm:py-2 px-4 rounded font-medium text-sm transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className={`flex-1 py-2.5 sm:py-2 px-4 rounded font-medium text-sm transition-colors touch-manipulation ${
                    orderSide === 'buy' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Placing Order...' : `Place ${orderSide.toUpperCase()} Order`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* Navigation - Mobile Responsive (Bottom) */}
      <div className="pb-16"></div>
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
    </div>
  );
}