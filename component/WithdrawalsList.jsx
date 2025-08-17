import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { authedFetchJson } from '../lib/authedFetch';

const WithdrawalsList = () => {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalWithdrawUsdt, setTotalWithdrawUsdt] = useState('0.00000000');
  
  // Search filters
  const [filters, setFilters] = useState({
    orderNo: '',
    userAccount: '',
    amountMin: '',
    amountMax: '',
    createdFrom: '',
    createdTo: '',
    status: 'all'
  });

  // Snapshot for rollback
  const snapshotWithdrawals = () => (withdrawals || []).map(item => ({ ...item }));

  const loadWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(filters.orderNo && { order_no: filters.orderNo }),
        ...(filters.userAccount && { email: filters.userAccount }),
        ...(filters.amountMin && { amount_min: filters.amountMin }),
        ...(filters.amountMax && { amount_max: filters.amountMax }),
        ...(filters.createdFrom && { created_from: filters.createdFrom }),
        ...(filters.createdTo && { created_to: filters.createdTo }),
        ...(filters.status !== 'all' && { status: filters.status })
      });

      const response = await authedFetchJson(`/api/admin/withdrawals?${params}`);
      
      if (response?.ok && response?.data) {
        setWithdrawals(response.data.items || []);
        setTotal(response.data.total || 0);
        setTotalWithdrawUsdt(response.data.total_withdraw_usdt?.toString() || '0.00000000');
      } else {
        setWithdrawals([]);
        setTotal(0);
        setTotalWithdrawUsdt('0.00000000');
      }
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
      
      if (err.status === 401) {
        router.push('/admin');
        return;
      }
      
      setError(err.message || 'Failed to load withdrawals');
      setWithdrawals([]);
      setTotal(0);
      setTotalWithdrawUsdt('0.00000000');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, router]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleSearch = () => {
    setPage(1);
    loadWithdrawals();
  };

  const handleReset = () => {
    setFilters({
      orderNo: '',
      userAccount: '',
      amountMin: '',
      amountMax: '',
      createdFrom: '',
      createdTo: '',
      status: 'all'
    });
    setPage(1);
  };

  const handleLockOrder = async (id) => {
    const rollbackWithdrawals = snapshotWithdrawals();
    
    try {
      // Optimistic update
      setWithdrawals(prev => prev.map(item => 
        item.id === id ? { ...item, status: 'locked' } : item
      ));

      const response = await authedFetchJson(`/api/admin/withdrawals/${id}/lock`, {
        method: 'POST'
      });

      if (!response?.ok) {
        throw new Error('Failed to lock order');
      }

      // Update with server response
      if (response?.data) {
        setWithdrawals(prev => prev.map(item => 
          item.id === id ? { ...item, ...response.data } : item
        ));
      }
    } catch (err) {
      console.error('Failed to lock order:', err);
      // Rollback
      setWithdrawals(rollbackWithdrawals);
      setError(err.message || 'Failed to lock order');
    }
  };

  const handleRejection = async (id) => {
    const rollbackWithdrawals = snapshotWithdrawals();
    
    try {
      // Optimistic update
      setWithdrawals(prev => prev.map(item => 
        item.id === id ? { ...item, status: 'rejected' } : item
      ));

      const response = await authedFetchJson(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST'
      });

      if (!response?.ok) {
        throw new Error('Failed to reject withdrawal');
      }

      // Update with server response
      if (response?.data) {
        setWithdrawals(prev => prev.map(item => 
          item.id === id ? { ...item, ...response.data } : item
        ));
      }
    } catch (err) {
      console.error('Failed to reject withdrawal:', err);
      // Rollback
      setWithdrawals(rollbackWithdrawals);
      setError(err.message || 'Failed to reject withdrawal');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return '—';
    }
  };

  const getStatusDisplay = (status) => {
    if (!status) return '—';
    switch (status) {
      case 'pending': return 'awaiting approval';
      case 'locked': return 'Locked';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'processing': return 'Processing';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'locked': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order NO.
            </label>
            <input
              type="text"
              value={filters.orderNo}
              onChange={(e) => setFilters(prev => ({ ...prev, orderNo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter order number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User account
            </label>
            <input
              type="text"
              value={filters.userAccount}
              onChange={(e) => setFilters(prev => ({ ...prev, userAccount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              withdrawal amount from
            </label>
            <input
              type="number"
              value={filters.amountMin}
              onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Min amount"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              withdrawal amount to
            </label>
            <input
              type="number"
              value={filters.amountMax}
              onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Max amount"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creation Time from
            </label>
            <input
              type="datetime-local"
              value={filters.createdFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, createdFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creation Time to
            </label>
            <input
              type="datetime-local"
              value={filters.createdTo}
              onChange={(e) => setFilters(prev => ({ ...prev, createdTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              <option value="pending">awaiting approval</option>
              <option value="locked">Locked</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
          
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Withdrawal configuration
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">
          Total Withdraw <span className="font-medium">{totalWithdrawUsdt}</span> USDT
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order NO.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  withdrawal amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency of withdrawals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Withdrawal channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Withdrawal address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creation Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Update Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="13" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : (withdrawals?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan="13" className="px-6 py-4 text-center text-gray-500">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                (withdrawals ?? []).map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.order_no || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.email || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.currency || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.withdrawal_amount || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.actual_amount || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(withdrawal.status)}`}>
                        {getStatusDisplay(withdrawal.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.frequency || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.channel || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.address || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(withdrawal.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.operator || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(withdrawal.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleLockOrder(withdrawal.id)}
                        disabled={withdrawal.status === 'locked'}
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Lock order
                      </button>
                      <button
                        onClick={() => handleRejection(withdrawal.id)}
                        disabled={withdrawal.status === 'rejected'}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        rejection
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} rows
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(Math.ceil(total / pageSize), prev + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalsList;
