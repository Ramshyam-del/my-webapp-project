import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const DepositMonitor = ({ depositId, transactionHash, onStatusUpdate, autoRefresh = true }) => {
  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const fetchDepositStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (depositId) params.append('depositId', depositId);
      if (transactionHash) params.append('transactionHash', transactionHash);

      const response = await fetch(`/api/deposits/status?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const newDeposit = result.data.deposit;
        
        // Check if status changed
        if (deposit && deposit.status !== newDeposit.status) {
          const statusMessages = {
            'detected': '🔍 Deposit detected on blockchain',
            'confirming': '⏳ Waiting for confirmations',
            'confirmed': '✅ Transaction confirmed',
            'completed': '💰 Deposit completed - Balance updated!',
            'failed': '❌ Deposit failed'
          };
          
          toast.success(statusMessages[newDeposit.status] || 'Status updated');
          
          if (onStatusUpdate) {
            onStatusUpdate(newDeposit);
          }
        }
        
        setDeposit(newDeposit);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch deposit status');
      }
    } catch (err) {
      console.error('Error fetching deposit status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [depositId, transactionHash, deposit, onStatusUpdate]);

  useEffect(() => {
    if (!depositId && !transactionHash) return;

    // Initial fetch
    fetchDepositStatus();

    // Set up auto-refresh for pending/confirming deposits
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (deposit && ['pending', 'detected', 'confirming'].includes(deposit.status)) {
          fetchDepositStatus();
        }
      }, 30000); // Refresh every 30 seconds

      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [fetchDepositStatus, autoRefresh, deposit]);

  const formatCurrency = (amount, currency) => {
    const decimals = currency === 'BTC' ? 8 : currency === 'ETH' ? 6 : 2;
    return `${parseFloat(amount).toFixed(decimals)} ${currency}`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Pending';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'confirming': return 'text-yellow-600';
      case 'detected': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'confirming': return '⏳';
      case 'detected': return '🔍';
      default: return '⏸️';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">❌</span>
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Deposit</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchDepositStatus();
              }}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Deposit not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{getStatusIcon(deposit.status)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {formatCurrency(deposit.expectedAmount || deposit.amount, deposit.cryptoType || deposit.currency)} Deposit
            </h3>
            <p className={`text-sm font-medium ${getStatusColor(deposit.status)}`}>
              {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
            </p>
          </div>
        </div>
        <button
          onClick={fetchDepositStatus}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Progress Bar */}
      {['monitoring', 'detected', 'confirming'].includes(deposit.status) && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Balance: {formatCurrency(deposit.currentBalance || 0, deposit.cryptoType || deposit.currency)} / {formatCurrency(deposit.expectedAmount || deposit.amount, deposit.cryptoType || deposit.currency)}</span>
            <span>{deposit.progressPercentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${deposit.progressPercentage || 0}%` }}
            ></div>
          </div>
          {deposit.timeRemaining && (
            <p className="text-xs text-gray-500 mt-1">
              {deposit.isExpired ? 'Expired' : `Time remaining: ${deposit.timeRemaining}`}
            </p>
          )}
        </div>
      )}

      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Hash</label>
          <div className="flex items-center">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
              {deposit.transactionHash || 'Pending'}
            </code>
            {deposit.explorerUrl && (
              <a
                href={deposit.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                🔗
              </a>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Address</label>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
            {deposit.walletAddress || deposit.depositAddress}
          </code>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crypto Type</label>
          <span className="text-sm text-gray-900 uppercase">{deposit.cryptoType || deposit.currency}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
          <span className="text-sm text-gray-900">{formatTime(deposit.createdAt || deposit.created_at)}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Transaction Timeline</h4>
        <div className="space-y-3">
          {deposit.timeline?.map((event, index) => (
            <div key={index} className="flex items-start">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                event.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {event.icon}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${
                    event.completed ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {event.title}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepositMonitor;