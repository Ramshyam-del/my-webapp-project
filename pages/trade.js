import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TradePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [priceData, setPriceData] = useState(null);
  const [orderBook, setOrderBook] = useState(null);
  const [orderType, setOrderType] = useState('market');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSide, setOrderSide] = useState('buy');

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

  // Fetch crypto data from Binance API
  const fetchPriceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try backend proxy first
      const response = await fetch(`http://localhost:4001/api/trading/price/${selectedPair}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPriceData(data);
      } else {
        // Fallback to direct Binance API
        const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${selectedPair}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (binanceResponse.ok) {
          const data = await binanceResponse.json();
          setPriceData({
            symbol: data.symbol,
            price: parseFloat(data.lastPrice),
            priceChange: parseFloat(data.priceChange),
            priceChangePercent: parseFloat(data.priceChangePercent),
            highPrice: parseFloat(data.highPrice),
            lowPrice: parseFloat(data.lowPrice),
            volume: parseFloat(data.volume),
            quoteVolume: parseFloat(data.quoteVolume)
          });
        } else {
          throw new Error('Failed to fetch price data');
        }
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
      const response = await fetch(`http://localhost:4001/api/trading/orderbook/${selectedPair}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderBook(data);
      } else {
        // Fallback to direct Binance API
        const binanceResponse = await fetch(`https://api.binance.com/api/v3/depth?symbol=${selectedPair}&limit=20`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (binanceResponse.ok) {
          const data = await binanceResponse.json();
          setOrderBook({
            bids: data.bids.map(([price, quantity]) => ({ price: parseFloat(price), quantity: parseFloat(quantity) })),
            asks: data.asks.map(([price, quantity]) => ({ price: parseFloat(price), quantity: parseFloat(quantity) }))
          });
        }
      }
    } catch (err) {
      console.error('Error fetching order book:', err);
    }
  };

  // Handle spot trade
  const handleSpotTrade = async (e) => {
    e.preventDefault();
    setIsPlacingOrder(true);
    setOrderStatus('');

    try {
      const formData = new FormData(e.target);
      const orderData = {
        symbol: 'BTCUSDT',
        side: formData.get('side'),
        type: 'MARKET',
        quantity: parseFloat(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
      };

      const response = await fetch('http://localhost:4001/api/trading/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const result = await response.json();
        setOrderStatus(`Order placed successfully! Order ID: ${result.orderId}`);
        // Clear form
        e.target.reset();
      } else {
        setOrderStatus('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderStatus('Network error. Please check your connection.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchPriceData();
      fetchOrderBook();
      
      const cryptoInterval = setInterval(fetchPriceData, 10000);
      const orderBookInterval = setInterval(fetchOrderBook, 5000);
      
      return () => {
        clearInterval(cryptoInterval);
        clearInterval(orderBookInterval);
      };
    }
  }, [mounted, selectedPair]);

  const handleOrderClick = (side) => {
    setOrderSide(side);
    setOrderAmount('');
    setOrderPrice(priceData?.price?.toString() || '');
    setShowOrderModal(true);
  };

  const handlePlaceOrder = async () => {
    try {
      const orderData = {
        symbol: selectedPair,
        side: orderSide,
        type: orderType,
        quantity: parseFloat(orderAmount),
        price: orderType === 'limit' ? parseFloat(orderPrice) : undefined
      };

      const response = await fetch('http://localhost:4001/api/trading/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        alert(`Order placed successfully! ${orderSide.toUpperCase()} ${orderAmount} ${selectedPair.replace('USDT', '')}`);
        setShowOrderModal(false);
        setOrderAmount('');
        setOrderPrice('');
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  const getCurrentPair = () => {
    return tradingPairs.find(pair => pair.symbol === selectedPair) || tradingPairs[0];
  };

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
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {tradingPairs.map((pair) => (
              <option key={pair.symbol} value={pair.symbol}>
                {pair.name}
              </option>
            ))}
          </select>
          

        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Price Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                {getCurrentPair().icon}
              </div>
              <div>
                <h2 className="text-xl font-bold">{getCurrentPair().name}</h2>
                <p className="text-sm text-gray-400">{selectedPair}</p>
              </div>
            </div>
            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 px-3 py-1 rounded">
                {error}
              </div>
            )}
          </div>

          {priceData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Current Price</div>
                <div className="text-2xl font-bold text-white">
                  ${priceData.price?.toLocaleString() || '0.00'}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">24h Change</div>
                <div className={`text-lg font-bold ${(priceData.priceChangePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(priceData.priceChangePercent || 0) >= 0 ? '+' : ''}{Number(priceData.priceChangePercent || 0).toFixed(2)}%
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">24h High</div>
                <div className="text-lg font-bold text-white">
                  ${priceData.highPrice?.toLocaleString() || '0.00'}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">24h Low</div>
                <div className="text-lg font-bold text-white">
                  ${priceData.lowPrice?.toLocaleString() || '0.00'}
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-400">Loading price data...</span>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Failed to load price data
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Chart */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Price Chart</h3>
              <div className="w-full h-96 bg-gray-700 rounded-lg overflow-hidden">
                <iframe
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${selectedPair}&symbol=BINANCE%3A${selectedPair}&interval=D&hidesidetoolbar=0&hidetrading=0&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies=%5B%5D&hide_volume=0&save_image=0&toolbarbg=f1f3f6&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&page-uri=localhost%3A3000%2Ftrade`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowTransparency={true}
                  allowFullScreen={true}
                  title="TradingView Chart"
                />
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* Order Book */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Order Book</h3>
              {orderBook ? (
                <div className="space-y-2">
                  {/* Asks (Sell Orders) */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-medium">Asks</div>
                    {orderBook?.asks?.slice(0, 5).map((ask, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-red-400">{Number(ask?.price || 0).toFixed(4)}</span>
                        <span className="text-gray-400">{Number(ask?.quantity || 0).toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Current Price */}
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        ${Number(priceData?.price || 0).toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-400">Current Price</div>
                    </div>
                  </div>
                  
                  {/* Bids (Buy Orders) */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-medium">Bids</div>
                    {orderBook?.bids?.slice(0, 5).map((bid, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-green-400">{Number(bid?.price || 0).toFixed(4)}</span>
                        <span className="text-gray-400">{Number(bid?.quantity || 0).toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  Loading order book...
                </div>
              )}
            </div>

            {/* Trading Buttons */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Quick Trade</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleOrderClick('buy')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  BUY {getCurrentPair().base}
                </button>
                <button
                  onClick={() => handleOrderClick('sell')}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {orderSide.toUpperCase()} {getCurrentPair().base}
              </h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Order Type</label>
                <select 
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                </select>
              </div>
              
              {/* Price Input (for limit orders) */}
              {orderType === 'limit' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Price (USDT)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
              )}
              
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount ({getCurrentPair().base})</label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              
              {/* Total Value */}
              {orderAmount && priceData?.price && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Total Value</div>
                  <div className="text-lg font-bold">
                    ${(parseFloat(orderAmount || 0) * (priceData.price || 0)).toFixed(2)} USDT
                  </div>
    </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
    <button
                  onClick={handlePlaceOrder}
                  disabled={!orderAmount || (orderType === 'limit' && !orderPrice)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    orderSide === 'buy' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } ${(!orderAmount || (orderType === 'limit' && !orderPrice)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Place {orderSide.toUpperCase()} Order
    </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 