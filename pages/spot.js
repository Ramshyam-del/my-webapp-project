import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Mock order book data
const mockOrderBook = {
  asks: [
    { price: 0.051461, amount: 6.521 },
    { price: 0.051409, amount: 6.531 },
    { price: 0.051357, amount: 6.541 },
    { price: 0.051305, amount: 5.285 },
    { price: 0.051255, amount: 168.161 },
    { price: 0.051253, amount: 6.553 },
    { price: 0.051201, amount: 6.333 },
  ],
  bids: [
    { price: 0.051149, amount: 3.414 },
    { price: 0.051097, amount: 6.581 },
    { price: 0.051045, amount: 6.591 },
    { price: 0.050993, amount: 6.601 },
    { price: 0.050943, amount: 235.296 },
    { price: 0.050942, amount: 6.484 },
    { price: 0.050906, amount: 216.000 },
  ],
  currentPrice: 0.051149,
  priceChange: -0.08
};

export default function Spot() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('trade');
  const [tradingMode, setTradingMode] = useState('spot');
  const [orderType, setOrderType] = useState('limit');
  const [autoMode, setAutoMode] = useState('auto');
  const [side, setSide] = useState('buy');
  const [price, setPrice] = useState(mockOrderBook.currentPrice);
  const [amount, setAmount] = useState('');
  const [value, setValue] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [orderHistory, setOrderHistory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showCurrentMarket, setShowCurrentMarket] = useState(true);

  // Calculate total value when amount or price changes
  useEffect(() => {
    if (amount && price) {
      setValue((parseFloat(amount) * parseFloat(price)).toFixed(6));
    }
  }, [amount, price]);

  // Calculate amount when value changes
  useEffect(() => {
    if (value && price) {
      setAmount((parseFloat(value) / parseFloat(price)).toFixed(6));
    }
  }, [value, price]);

  const handleBuy = () => {
    if (!amount || !price) {
      alert('Please enter amount and price');
      return;
    }
    
    const order = {
      id: Date.now(),
      type: 'buy',
      orderType,
      price: parseFloat(price),
      amount: parseFloat(amount),
      value: parseFloat(value),
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    setPendingOrders(prev => [order, ...prev]);
    alert(`Buy order placed: ${amount} CET at ${price} USDT`);
    setAmount('');
    setValue('');
  };

  const handleSell = () => {
    if (!amount || !price) {
      alert('Please enter amount and price');
      return;
    }
    
    const order = {
      id: Date.now(),
      type: 'sell',
      orderType,
      price: parseFloat(price),
      amount: parseFloat(amount),
      value: parseFloat(value),
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    setPendingOrders(prev => [order, ...prev]);
    alert(`Sell order placed: ${amount} CET at ${price} USDT`);
    setAmount('');
    setValue('');
  };

  const handlePriceClick = (clickedPrice) => {
    setPrice(clickedPrice);
  };

  const handlePercentageClick = (percentage) => {
    const maxAmount = side === 'buy' ? availableBalance / price : availableBalance;
    const newAmount = (maxAmount * percentage / 100).toFixed(6);
    setAmount(newAmount);
  };

  const navTabs = [
    { label: 'HOME', icon: '🏠', route: '/exchange' },
    { label: 'MARKET', icon: '📊', route: '/market' },
    { label: 'SPOT', icon: '💱', route: '/spot' },
    { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
    { label: 'ALERTS', icon: '🔔', route: '/alerts' },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Navigation */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button className="text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <div className="text-lg font-bold">CET/USDT</div>
              <div className={`text-sm ${mockOrderBook.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {mockOrderBook.priceChange >= 0 ? '+' : ''}{mockOrderBook.priceChange}%
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full bg-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
              </svg>
            </button>
            <button className="p-2 rounded-full bg-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="p-2 rounded-full bg-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex space-x-8 border-b border-gray-800">
          {['Trade', 'Swap', 'P2P', 'Strategy'].map((tab) => (
            <button
              key={tab}
              className={`pb-2 px-1 ${activeTab === tab.toLowerCase() ? 'text-white border-b-2 border-green-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Trading Mode Tabs */}
      <div className="px-4 py-2 border-b border-gray-800">
        <div className="flex space-x-4">
          {[
            { name: 'Spot', value: 'spot' },
            { name: 'Margin 3X', value: 'margin' },
            { name: 'AMM', value: 'amm' }
          ].map((mode) => (
            <button
              key={mode.value}
              className={`px-4 py-2 rounded ${tradingMode === mode.value ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => setTradingMode(mode.value)}
            >
              {mode.name}
            </button>
          ))}
          {tradingMode === 'margin' && (
            <button className="ml-auto px-4 py-2 bg-green-600 text-white rounded">
              Borrow
            </button>
          )}
        </div>
      </div>

      {/* Main Trading Interface */}
      <div className="flex-1 flex">
        {/* Left Panel - Order Form */}
        <div className="w-1/2 p-4 border-r border-gray-800">
          {/* Auto Mode */}
          <div className="mb-4">
            <select 
              value={autoMode} 
              onChange={(e) => setAutoMode(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="auto">Auto Mode</option>
              <option value="manual">Manual Mode</option>
            </select>
          </div>

          {/* Buy/Sell Buttons */}
          <div className="flex space-x-2 mb-4">
            <button
              className={`flex-1 py-3 rounded font-bold ${side === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setSide('buy')}
            >
              Buy
            </button>
            <button
              className={`flex-1 py-3 rounded font-bold ${side === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setSide('sell')}
            >
              Sell
            </button>
          </div>

          {/* Order Form */}
          <div className="space-y-4">
            {/* Order Type */}
            <div>
              <select 
                value={orderType} 
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="limit">Limit</option>
                <option value="market">Market</option>
                <option value="stop">Stop</option>
              </select>
            </div>

            {/* Price Input */}
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  step="0.000001"
                />
                <button className="px-2 py-2 bg-gray-700 rounded">-</button>
                <button className="px-2 py-2 bg-gray-700 rounded">+</button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="0.00000000"
                step="0.000001"
              />
              <div className="flex items-center justify-between mt-2">
                <button className="text-xs text-gray-400">📋</button>
                <div className="flex space-x-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePercentageClick(pct)}
                      className="px-2 py-1 text-xs bg-gray-700 rounded"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Value Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Value</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            {/* Balance Info */}
            <div className="text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Avbl: {availableBalance.toFixed(6)} {side === 'buy' ? 'USDT' : 'CET'}</span>
                <span>Max. {side === 'buy' ? 'Buy' : 'Sell'}: {side === 'buy' ? (availableBalance / price).toFixed(6) : availableBalance.toFixed(6)} {side === 'buy' ? 'CET' : 'USDT'}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={side === 'buy' ? handleBuy : handleSell}
              className={`w-full py-3 rounded font-bold text-white ${side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {side === 'buy' ? 'Buy' : 'Sell'} CET
            </button>
          </div>
        </div>

        {/* Right Panel - Order Book */}
        <div className="w-1/2 p-4">
          {/* Market Depth Bars */}
          <div className="flex mb-4">
            <div className="flex-1 bg-green-500 h-1 rounded-l"></div>
            <div className="flex-1 bg-red-500 h-1 rounded-r"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>69.72%</span>
            <span>30.28%</span>
          </div>

          {/* Order Book Headers */}
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Price (USDT)</span>
            <span>Amount (CET)</span>
          </div>

          {/* Asks (Sell Orders) */}
          <div className="space-y-1 mb-4">
            {mockOrderBook.asks.map((ask, index) => (
              <div
                key={index}
                className="flex justify-between text-red-400 text-sm cursor-pointer hover:bg-gray-800 p-1 rounded"
                onClick={() => handlePriceClick(ask.price)}
              >
                <span>{ask.price.toFixed(6)}</span>
                <span>{ask.amount.toFixed(3)}K</span>
              </div>
            ))}
          </div>

          {/* Current Price */}
          <div className="text-center py-2 border-y border-gray-700 mb-4">
            <div className="text-xl font-bold text-red-400">{mockOrderBook.currentPrice.toFixed(6)}</div>
            <div className="text-sm text-gray-400">≈ {mockOrderBook.currentPrice.toFixed(5)} USD</div>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="space-y-1">
            {mockOrderBook.bids.map((bid, index) => (
              <div
                key={index}
                className="flex justify-between text-green-400 text-sm cursor-pointer hover:bg-gray-800 p-1 rounded"
                onClick={() => handlePriceClick(bid.price)}
              >
                <span>{bid.price.toFixed(6)}</span>
                <span>{bid.amount.toFixed(3)}K</span>
              </div>
            ))}
          </div>

          {/* Small Input Field */}
          <div className="mt-4">
            <input
              type="number"
              defaultValue="0.000001"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
              step="0.000001"
            />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-800">
        {/* Main Tabs */}
        <div className="flex border-b border-gray-800">
          {[
            { name: 'Pending Order', count: pendingOrders.length },
            { name: 'Order History', count: orderHistory.length },
            { name: 'Margin(P)', count: 0 }
          ].map((tab, index) => (
            <button
              key={tab.name}
              className={`flex-1 py-3 text-sm ${index === 0 ? 'text-white border-b-2 border-green-400' : 'text-gray-400'}`}
            >
              {tab.name}({tab.count})
            </button>
          ))}
          <button className="p-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="flex px-4 py-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded text-sm mr-2">
            Normal Order({pendingOrders.filter(o => o.orderType === 'limit').length})
          </button>
          <button className="px-4 py-2 bg-gray-700 text-white rounded text-sm">
            Stop Order({pendingOrders.filter(o => o.orderType === 'stop').length})
          </button>
        </div>

        {/* Checkbox */}
        <div className="px-4 py-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showCurrentMarket}
              onChange={(e) => setShowCurrentMarket(e.target.checked)}
              className="mr-2"
            />
            Show current market
          </label>
        </div>

        {/* Content Area */}
        <div className="px-4 py-8">
          {pendingOrders.length === 0 ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-gray-400">No record</div>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingOrders.map((order) => (
                <div key={order.id} className="bg-gray-800 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className={`font-bold ${order.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                        {order.type.toUpperCase()} {order.amount} CET
                      </div>
                      <div className="text-sm text-gray-400">
                        Price: {order.price} USDT | Value: {order.value} USDT
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Label */}
      <div className="px-4 py-2 bg-gray-900 text-center text-sm text-gray-400">
        CET/USDT Chart
      </div>
    </div>
  );
} 