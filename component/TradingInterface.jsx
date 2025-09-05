import React, { useState, useEffect } from 'react';
import { hybridFetch } from '../lib/hybridFetch';
import { useAuth } from '../contexts/AuthContext';

const TradingInterface = () => {
  const { user, isAuthenticated } = useAuth();
  
  // State management
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderSide, setOrderSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [duration, setDuration] = useState('1h');
  
  // Market data
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // User data
  const [balance, setBalance] = useState(0);

  // Trading pairs
  const tradingPairs = [
    { symbol: 'BTC/USDT', name: 'Bitcoin/USDT', icon: '₿' },
    { symbol: 'ETH/USDT', name: 'Ethereum/USDT', icon: 'Ξ' },
    { symbol: 'BNB/USDT', name: 'BNB/USDT', icon: 'B' },
    { symbol: 'SOL/USDT', name: 'Solana/USDT', icon: 'S' },
    { symbol: 'ADA/USDT', name: 'Cardano/USDT', icon: 'A' }
  ];

  // Duration options
  const durationOptions = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' }
  ];

  // Leverage options
  const leverageOptions = [1, 2, 5, 10, 20, 50, 100];

  // Fetch current price
  const fetchPrice = async () => {
    try {
      const response = await fetch(`/api/trading/price/${selectedPair}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentPrice(data.data.price);
        setPriceChange(data.data.change_24h);
        if (orderType === 'market') {
          setPrice(data.data.price.toString());
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching price:', error);
      }
    }
  };

  // Fetch user balance
  const fetchBalance = async () => {
    try {
      if (!isAuthenticated) return;
      
      const response = await hybridFetch('/api/portfolio/balance');
      setBalance(response.data.balance || 0);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching balance:', error);
      }
    }
  };

  // Initialize component
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchBalance();
    }
    fetchPrice();
    
    // Set up price updates every 5 seconds
    const priceInterval = setInterval(fetchPrice, 5000);
    
    return () => clearInterval(priceInterval);
  }, [selectedPair, isAuthenticated, user]);

  // Calculate order details
  const calculateOrderDetails = () => {
    const orderAmount = parseFloat(amount) || 0;
    const orderPrice = parseFloat(price) || currentPrice;
    const totalValue = orderAmount * orderPrice;
    const requiredMargin = totalValue / leverage;
    const potentialPnL = totalValue * 0.1; // Example 10% potential profit
    
    // User needs sufficient balance to cover the trade amount (amount at risk)
    const tradeAmount = orderAmount;
    
    return {
      totalValue: totalValue.toFixed(2),
      requiredMargin: requiredMargin.toFixed(2),
      potentialPnL: potentialPnL.toFixed(2),
      tradeAmount: tradeAmount.toFixed(2),
      canAfford: balance >= tradeAmount
    };
  };

  // Handle order submission
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!isAuthenticated || !user) {
        setError('Please log in to place orders');
        return;
      }

      const orderData = {
        pair: selectedPair,
        side: orderSide,
        type: orderType,
        amount: parseFloat(amount),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
        leverage: leverage,
        duration: duration
      };

      const result = await hybridFetch('/api/trading/order', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      setSuccess(`Order placed successfully! Trade ID: ${result.data.trade.id}`);
      setAmount('');
      setPrice('');
      fetchBalance(); // Refresh balance
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error placing order:', error);
      }
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const orderDetails = calculateOrderDetails();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Trading Interface</h2>
      
      {/* Market Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{selectedPair}</h3>
            <p className="text-2xl font-bold">${currentPrice.toLocaleString()}</p>
          </div>
          <div className={`text-right ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <p className="text-sm">24h Change</p>
            <p className="font-semibold">{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Place Order</h3>
          
          {/* Pair Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Trading Pair</label>
            <select 
              value={selectedPair} 
              onChange={(e) => setSelectedPair(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {tradingPairs.map(pair => (
                <option key={pair.symbol} value={pair.symbol}>
                  {pair.icon} {pair.name}
                </option>
              ))}
            </select>
          </div>

          {/* Order Side */}
          <div>
            <label className="block text-sm font-medium mb-2">Order Side</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setOrderSide('buy')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  orderSide === 'buy' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setOrderSide('sell')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  orderSide === 'sell' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Order Type</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setOrderType('market')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  orderType === 'market' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType('limit')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  orderType === 'limit' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              step="0.00000001"
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Price (for limit orders) */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-sm font-medium mb-2">Price (USDT)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                step="0.01"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Leverage */}
          <div>
            <label className="block text-sm font-medium mb-2">Leverage: {leverage}x</label>
            <select 
              value={leverage} 
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {leverageOptions.map(lev => (
                <option key={lev} value={lev}>{lev}x</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-2">Duration</label>
            <select 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {durationOptions.map(dur => (
                <option key={dur.value} value={dur.value}>{dur.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span>Available Balance:</span>
              <span className="font-semibold">${balance.toLocaleString()} USDT</span>
            </div>
            
            <div className="flex justify-between">
              <span>Order Value:</span>
              <span>${orderDetails.totalValue}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Required Margin:</span>
              <span>${orderDetails.requiredMargin}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Trade Amount (At Risk):</span>
              <span className={orderDetails.canAfford ? 'text-green-600' : 'text-red-600'}>
                ${orderDetails.tradeAmount}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Potential P&L (10%):</span>
              <span className="text-green-600">+${orderDetails.potentialPnL}</span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between font-semibold">
                <span>Order Type:</span>
                <span className="capitalize">{orderType} {orderSide}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <form onSubmit={handleSubmitOrder}>
            <button
              type="submit"
              disabled={loading || !amount || !orderDetails.canAfford}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white ${
                loading || !amount || !orderDetails.canAfford
                  ? 'bg-gray-400 cursor-not-allowed'
                  : orderSide === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Placing Order...' : `${orderSide.toUpperCase()} ${selectedPair}`}
            </button>
          </form>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;