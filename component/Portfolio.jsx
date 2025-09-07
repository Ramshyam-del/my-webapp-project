import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const Portfolio = () => {
  const { user, isAuthenticated } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
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

  // Fetch portfolio data
  const fetchPortfolio = async () => {
    try {
      if (!isAuthenticated || !user?.id) return;
      
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching portfolio:', error);
        return;
      }
      
      setPortfolio(data || { balance: 0, locked_balance: 0 });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching portfolio:', error);
      }
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
        .eq('status', 'open');
      
      if (error) {
        console.error('Error fetching open trades:', error);
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
        .eq('status', 'closed');
      
      if (error) {
        console.error('Error fetching stats:', error);
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

  // Refresh all data
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalMargin = calculateTotalMargin();
  const unrealizedPnL = calculateUnrealizedPnL();
  const availableBalance = (portfolio?.balance || 0) - totalMargin;
  const totalEquity = (portfolio?.balance || 0) + unrealizedPnL;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
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
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(portfolio?.balance || 0)}
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