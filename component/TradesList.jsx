import React, { useState, useEffect, useCallback } from 'react';
import { authedFetchJson } from '../lib/authedFetch';

const TradesList = () => {
  // State management
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [exitPrice, setExitPrice] = useState('');
  const [closingTrade, setClosingTrade] = useState(false);
  const [processingTrade, setProcessingTrade] = useState(null);
  
  // Win/Loss confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    tradeId: null,
    decision: null,
    tradePair: null
  });

  // Fetch trades from API
  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      const response = await authedFetchJson(`/api/admin/trades?${params.toString()}`);
      
      if (response && response.ok && response.data) {
        setTrades(response.data.items || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.total_pages || 1);
      } else {
        throw new Error(response?.message || 'Failed to fetch trades');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching trades:', error);
      }
      setError(process.env.NODE_ENV === 'development' ? 
           'Failed to load trades: ' + error.message : 
           'Failed to load trades');
      setTrades([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, searchTerm]);

  // Fetch trades when dependencies change
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchTrades();
  };

  // Handle status filter change
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  // Check if trade has expired
  const isTradeExpired = (trade) => {
    if (!trade.expiry_ts) return false;
    return new Date() > new Date(trade.expiry_ts);
  };

  // Show confirmation modal for trade decision
  const showTradeDecisionConfirmation = (tradeId, decision, tradePair) => {
    setConfirmationModal({
      isOpen: true,
      tradeId,
      decision,
      tradePair
    });
  };

  // Handle confirmed trade decision
  const handleConfirmedTradeDecision = async () => {
    const { tradeId, decision } = confirmationModal;
    
    try {
      setProcessingTrade(tradeId);
      setError(null);
      setConfirmationModal({ isOpen: false, tradeId: null, decision: null, tradePair: null });

      const response = await authedFetchJson(`/api/admin/trades/${tradeId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ decision })
      });

      if (response && response.ok) {
        setSuccess(`Trade marked as ${decision.toLowerCase()} successfully`);
        fetchTrades(); // Refresh the list
      } else {
        throw new Error(response?.message || `Failed to mark trade as ${decision.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error setting trade decision:', error);
      setError(`Failed to mark trade as ${decision.toLowerCase()}: ` + error.message);
    } finally {
      setProcessingTrade(null);
    }
  };

  // Handle close trade
  const handleCloseTrade = async () => {
    if (!selectedTrade || !exitPrice || isNaN(Number(exitPrice))) {
      setError('Please enter a valid exit price');
      return;
    }

    try {
      setClosingTrade(true);
      setError(null);

      const response = await authedFetchJson(`/api/admin/trades/${selectedTrade.id}/close`, {
        method: 'POST',
        body: JSON.stringify({ exitPrice: Number(exitPrice) })
      });

      if (response && response.ok && response.data) {
        setSuccess(`Trade closed successfully. PnL: $${response.data.trade.pnl.toFixed(2)}`);
        setCloseModalOpen(false);
        setSelectedTrade(null);
        setExitPrice('');
        fetchTrades(); // Refresh the list
      } else {
        throw new Error(response?.message || 'Failed to close trade');
      }
    } catch (error) {
      console.error('Error closing trade:', error);
      setError('Failed to close trade: ' + error.message);
    } finally {
      setClosingTrade(false);
    }
  };

  // Utility functions
  const getStatusBadge = (status) => {
    const badges = {
      'OPEN': 'bg-yellow-100 text-yellow-800',
      'WIN': 'bg-green-100 text-green-800',
      'LOSS': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getSideBadge = (side) => {
    return side === 'LONG' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">
            ×
          </button>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Trade Management</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor and manage all trading activities</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0">
          <span className="text-sm text-gray-500">
            Total: {totalItems} trades
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="relative w-full lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by user, pair, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <select 
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="WIN">Win</option>
            <option value="LOSS">Loss</option>
          </select>
          <button
            onClick={handleSearch}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trade ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pair
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Side
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PnL
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-6 py-12 text-center text-gray-500">
                    No trades found
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trade.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{trade.user_name}</div>
                      <div className="text-sm text-gray-500">{trade.user_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trade.pair}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSideBadge(trade.side)}`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trade.leverage}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trade.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(trade.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(trade.entry_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {trade.exit_price ? formatCurrency(trade.exit_price) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.pnl ? formatCurrency(trade.pnl) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(trade.status)}`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(trade.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {trade.status === 'OPEN' && (
                        <div className="flex flex-col space-y-1 items-center">
                          {isTradeExpired(trade) && (
                            <div className="text-xs text-orange-600 font-medium mb-1">
                              ⚠️ Expired - Auto Loss Soon
                            </div>
                          )}
                          <div className="flex space-x-2 justify-center">
                            <button
                              onClick={() => showTradeDecisionConfirmation(trade.id, 'WIN', trade.pair)}
                              disabled={processingTrade === trade.id}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                            >
                              {processingTrade === trade.id ? 'Processing...' : '✓ Win'}
                            </button>
                            <button
                              onClick={() => showTradeDecisionConfirmation(trade.id, 'LOSS', trade.pair)}
                              disabled={processingTrade === trade.id}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                            >
                              {processingTrade === trade.id ? 'Processing...' : '✗ Loss'}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{totalItems}</span> trades
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close Trade Modal */}
      {closeModalOpen && selectedTrade && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Close Trade</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trade Details
                  </label>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>User:</strong> {selectedTrade.user_name}</p>
                    <p><strong>Pair:</strong> {selectedTrade.pair}</p>
                    <p><strong>Side:</strong> {selectedTrade.side}</p>
                    <p><strong>Entry Price:</strong> {formatCurrency(selectedTrade.entry_price)}</p>
                    <p><strong>Amount:</strong> {formatCurrency(selectedTrade.amount)}</p>
                    <p><strong>Leverage:</strong> {selectedTrade.leverage}x</p>
                  </div>
                </div>
                <div>
                  <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Exit Price *
                  </label>
                  <input
                    type="number"
                    id="exitPrice"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder="Enter exit price"
                    step="0.000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setCloseModalOpen(false);
                    setSelectedTrade(null);
                    setExitPrice('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseTrade}
                  disabled={closingTrade || !exitPrice || isNaN(Number(exitPrice))}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {closingTrade ? 'Closing...' : 'Close Trade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Win/Loss Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm Trade Decision
                </h3>
                <button
                  onClick={() => setConfirmationModal({ isOpen: false, tradeId: null, decision: null, tradePair: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                    confirmationModal.decision === 'WIN' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {confirmationModal.decision === 'WIN' ? '✓' : '✗'}
                  </div>
                </div>
                
                <p className="text-center text-gray-700 mb-2">
                  Are you sure you want to mark this trade as 
                  <span className={`font-bold ${
                    confirmationModal.decision === 'WIN' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {confirmationModal.decision}
                  </span>?
                </p>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Trade Pair:</strong> {confirmationModal.tradePair}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Trade ID:</strong> {confirmationModal.tradeId?.slice(0, 8)}...
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmationModal({ isOpen: false, tradeId: null, decision: null, tradePair: null })}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedTradeDecision}
                  disabled={processingTrade === confirmationModal.tradeId}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                    confirmationModal.decision === 'WIN'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingTrade === confirmationModal.tradeId ? 'Processing...' : `Confirm ${confirmationModal.decision}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradesList;
