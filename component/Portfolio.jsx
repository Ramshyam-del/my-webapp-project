import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { getCryptoImageUrl } from '../utils/cryptoIcons';

const Portfolio = () => {
  const { user, isAuthenticated } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioBalances, setPortfolioBalances] = useState({ currencies: [], totalBalance: 0 });
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [calculatedTotalValue, setCalculatedTotalValue] = useState(0);
  const [openTrades, setOpenTrades] = useState([]);
  const [stats, setStats] = useState({
    totalPnL: 0,
    totalTrades: 0,
    winRate: 0,
    avgPnL: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch crypto prices for USD conversion
  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(`/api/crypto/prices?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 [Portfolio] Crypto prices received:', data);
          setCryptoPrices(data);
        } else {
          console.log('❌ [Portfolio] Failed to fetch crypto prices');
          setCryptoPrices({});
        }
      } catch (error) {
        console.error('❌ [Portfolio] Error fetching crypto prices:', error);
        setCryptoPrices({});
      }
    };

  // Fetch portfolio data using multi-currency API
  const fetchPortfolio = async () => {
    try {
      if (!isAuthenticated || !user?.id) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('🔍 [Portfolio] Fetching portfolio data for user:', session.user.id);
      const response = await fetch(`/api/portfolio/balance?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('🔍 [Portfolio] API Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [Portfolio] Raw API response:', JSON.stringify(data, null, 2));
        console.log('🔍 [Portfolio] Portfolio data received:', data);
        console.log('🔍 [Portfolio] Raw currencies before cleanup:', data.currencies);
        
        console.log('🔍 [Portfolio] Setting portfolio data:', data);
        setPortfolioBalances(data);
        
        // For backward compatibility, set the old portfolio structure
        const usdtBalance = data.currencies?.find(c => c.currency === 'USDT')?.balance || 0;
        console.log('🔍 [Portfolio] USDT balance found:', usdtBalance);
        setPortfolio({ balance: usdtBalance, locked_balance: 0 });
        
        // Clear any previous errors
        setError(null);
      } else {
        const errorText = await response.text();
        console.log('❌ [Portfolio] Failed to fetch portfolio data, status:', response.status, 'Error:', errorText);
        
        // Set appropriate error message based on status
        if (response.status === 400) {
          setError('Authentication required. Please log in to view your portfolio.');
        } else if (response.status === 500) {
          setError('Server error. Please try refreshing the page.');
        } else {
          setError(`Failed to load portfolio data (${response.status}). Please try again.`);
        }
        
        setPortfolioBalances({ currencies: [], totalBalance: 0 });
        setPortfolio({ balance: 0, locked_balance: 0 });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching portfolio:', error);
      }
      setError('Network error. Please check your connection and try again.');
      setPortfolioBalances({ currencies: [], totalBalance: 0 });
      setPortfolio({ balance: 0, locked_balance: 0 });
    }
  };

  // Fetch open trades
  const fetchOpenTrades = async () => {
    try {
      if (!isAuthenticated || !user?.id) return;
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'OPEN');
      
      if (error) {
        return;
      }
      
      setOpenTrades(data || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching open trades:', error);
      }
    }
  };

  // Fetch trading statistics
  const fetchStats = async () => {
    try {
      if (!isAuthenticated || !user?.id) return;
      
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'CLOSED');
      
      if (error) {
        return;
      }
      
      // Calculate statistics from trades
      const totalTrades = trades?.length || 0;
      const profitableTrades = trades?.filter(t => (t.pnl || 0) > 0).length || 0;
      const totalPnL = trades?.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0;
      const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
      const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
      
      setStats({
        totalPnL,
        totalTrades,
        winRate,
        avgPnL
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching stats:', error);
      }
    }
  };

  // Calculate total portfolio value in USD
  const calculateTotalPortfolioValue = () => {
    if (!portfolioBalances?.currencies || !cryptoPrices) {
      console.log('🔍 [Portfolio] Missing data for calculation:', {
        hasPortfolioBalances: !!portfolioBalances?.currencies,
        hasCryptoPrices: !!cryptoPrices,
        portfolioCurrencies: portfolioBalances?.currencies,
        cryptoPrices
      });
      return 0;
    }
    
    console.log('🔍 [Portfolio] Calculating total with:', {
      currencies: portfolioBalances.currencies,
      prices: cryptoPrices
    });
    
    const total = portfolioBalances.currencies.reduce((sum, currency) => {
      const balance = currency.balance || 0;
      const price = cryptoPrices[currency.currency] || 0;
      const value = balance * price;
      console.log(`🔍 [Portfolio] ${currency.currency}: ${balance} × ${price} = ${value}`);
      return sum + value;
    }, 0);
    
    console.log('🔍 [Portfolio] Total calculated:', total);
    return total;
  };

  // Refresh all data
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCryptoPrices(),
      fetchPortfolio(),
      fetchOpenTrades(),
      fetchStats()
    ]);
    setRefreshing(false);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Calculate total margin used
  const calculateTotalMargin = () => {
    return openTrades.reduce((total, trade) => {
      const tradeValue = (trade.entry_price || 0) * (trade.amount || 0);
      const margin = tradeValue / (trade.leverage || 1);
      return total + margin;
    }, 0);
  };

  // Calculate unrealized PnL
  const calculateUnrealizedPnL = () => {
    return openTrades.reduce((total, trade) => {
      return total + (trade.current_pnl || 0);
    }, 0);
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };

    if (isAuthenticated && user) {
      initializeData();
    }
  }, [isAuthenticated, user]);

  // Calculate total portfolio value whenever balances or prices change
  useEffect(() => {
    if (portfolioBalances.currencies && portfolioBalances.currencies.length > 0 && Object.keys(cryptoPrices).length > 0) {
      // Calculate total by summing up individual USD values (same logic as displayed)
      const total = portfolioBalances.currencies.reduce((sum, currency) => {
        const balance = parseFloat(currency.balance) || 0;
        const price = cryptoPrices[currency.currency] || 0;
        const usdValue = balance * price;
        // Calculate USD value for each currency
        return sum + usdValue;
      }, 0);
      setCalculatedTotalValue(total);
    } else {
      setCalculatedTotalValue(0);
    }
  }, [portfolioBalances, cryptoPrices]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalMargin = calculateTotalMargin();
  const unrealizedPnL = calculateUnrealizedPnL();
  // Use the API's totalBalance instead of recalculating in production
  const totalPortfolioValue = portfolioBalances?.totalBalance || 0;
  const availableBalance = (portfolio?.balance || 0) - totalMargin;
  const totalEquity = totalPortfolioValue + unrealizedPnL;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
          <div className="flex items-center mt-2 space-x-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-gray-600">Live prices from CoinMarketCap</span>
            </div>
            {Object.keys(cryptoPrices).length > 0 && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {Object.keys(cryptoPrices).length} currencies tracked
              </span>
            )}
          </div>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* User Profile Information */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Username</p>
            <p className="text-lg font-semibold text-gray-900">{user?.username || 'N/A'}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Credit Score</p>
            <p className="text-lg font-semibold text-blue-600">{user?.credit_score || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">VIP Level</p>
            <p className="text-lg font-semibold text-purple-600">{user?.vip_level || 'VIP0'}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      


      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance */}
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalPortfolioValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Includes all cryptocurrencies
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(availableBalance)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Margin Used */}
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Margin Used</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalMargin)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>


      </div>

      {/* Trading Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Trading Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Trades</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTrades}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Win Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatPercentage(stats.winRate)}
            </p>
          </div>
        </div>
      </div>

      {/* Cryptocurrency Balances */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Cryptocurrency Balances</h2>
        <div className="space-y-4">
          {portfolioBalances.currencies && portfolioBalances.currencies.length > 0 ? (
            portfolioBalances.currencies.map((currency) => {
              const balance = parseFloat(currency.balance) || 0;
              // Use live prices from CoinMarketCap API
              const price = cryptoPrices[currency.currency] || 0;
              const usdValue = balance * price;
              
              const displayCurrency = currency.currency;
                
                return (
                  <div key={`${currency.id || Math.random()}-${displayCurrency}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img 
                          src={getCryptoImageUrl(displayCurrency)} 
                          alt={displayCurrency}
                          className="w-10 h-10 rounded-full"
                          onLoad={(e) => {
                            console.log('Image loaded successfully:', e.target.src);
                          }}
                          onError={(e) => {
                            console.log('Image failed to load:', e.target.src);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-blue-600 font-bold text-sm">{displayCurrency}</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {displayCurrency}
                        </p>
                        <p className="text-sm text-gray-500">
                          {balance.toFixed(8)} {displayCurrency}
                        </p>
                      </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(usdValue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      @ {formatCurrency(price)}
                    </p>
                    <button
                      onClick={() => window.location.href = '/withdraw'}
                      className="mt-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-medium rounded transition-colors"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No cryptocurrency balances found</p>
              <p className="text-sm mt-1">Deposit funds to start trading</p>
            </div>
          )}
        </div>
      </div>

      {/* Open Positions */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Open Positions ({openTrades.length})</h2>
        </div>
        
        {openTrades.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No open positions</p>
            <p className="text-sm mt-1">Start trading to see your positions here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pair
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Side
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leverage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {openTrades.map((trade) => {
                  const tradeValue = (trade.entry_price || 0) * (trade.amount || 0);
                  const margin = tradeValue / (trade.leverage || 1);
                  const pnl = trade.current_pnl || 0;
                  
                  return (
                    <tr key={trade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trade.pair}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.side === 'buy' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.side?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(trade.entry_price || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.leverage}x
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(margin)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;