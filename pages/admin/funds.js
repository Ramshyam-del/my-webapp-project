import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminFunds() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operation, setOperation] = useState({
    type: 'recharge',
    userAccount: '',
    currency: 'USDT',
    changeAmount: '',
    remark: ''
  });
  const [userBalances, setUserBalances] = useState([]);
  const [stats, setStats] = useState({
    totalRecharges: 0,
    totalWithdrawals: 0,
    pendingCount: 0,
    completedCount: 0
  });
  const [operationLoading, setOperationLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ type: 'success', message: '' });

  // Helper function to show notifications
  const showNotification = (type, message) => {
    setNotificationData({ type, message });
    setShowNotificationModal(true);
  };

  // Fetch users with balances
  const fetchUsersWithBalances = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session for fetchUsersWithBalances');
        showNotification('error', 'Authentication required');
        return;
      }

      console.log('Fetching users with balances...');
      const response = await fetch('/api/admin/users-with-balances', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Users with balances response:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users with balances data:', data);
        setUserBalances(data.data?.users || []);
        console.log('Set userBalances to:', data.data?.users || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch users with balances:', response.status, errorText);
        // Don't show error to user, just log it
        setUserBalances([]); // Set empty array so we can still try direct lookup
      }
    } catch (error) {
      console.error('Error fetching users with balances:', error);
      setUserBalances([]); // Set empty array so we can still try direct lookup
    }
  };

  // Fetch fund transactions
  const fetchFundTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('error', 'Authentication required');
        return;
      }

      const response = await fetch('/api/admin/fund-transactions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fund transactions data:', data); // Debug log
        console.log('Number of transactions fetched:', data.data?.transactions?.length || 0);
        setFunds(data.data.transactions || []);
        setStats(data.data.stats || {
          totalRecharges: 0,
          totalWithdrawals: 0,
          pendingCount: 0,
          completedCount: 0
        });
      } else {
        console.error('Failed to fetch fund transactions');
        showNotification('error', 'Failed to fetch fund transactions');
      }
    } catch (error) {
      console.error('Error fetching fund transactions:', error);
      showNotification('error', 'Error fetching fund transactions');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUsersWithBalances(),
        fetchFundTransactions()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleOperationSubmit = async (e) => {
    e.preventDefault();
    
    if (!operation.userAccount || !operation.changeAmount) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    console.log('Looking for user:', operation.userAccount);
    console.log('Available users in userBalances:', userBalances.length, userBalances.map(u => ({ email: u.email, username: u.username, id: u.id })));
    
    let user = null;
    
    // Direct database search without relying on userBalances
    console.log('Performing direct user search for:', operation.userAccount);
    try {
      // Use Supabase client instead of admin for better compatibility
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Auth users list error:', authError);
        // Try alternative approach with service role
        const response = await fetch('/api/admin/find-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ email: operation.userAccount })
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.user) {
            user = {
              id: userData.user.id,
              email: userData.user.email,
              username: userData.user.username || userData.user.email.split('@')[0],
              balances: { BTC: 0, USDT: 0, ETH: 0 }
            };
            console.log('User found via API:', user);
          }
        }
      } else if (authData?.users) {
        const authUser = authData.users.find(u => 
          u.email?.toLowerCase() === operation.userAccount.toLowerCase()
        );
        
        if (authUser) {
          user = {
            id: authUser.id,
            email: authUser.email,
            username: authUser.user_metadata?.username || authUser.email.split('@')[0],
            balances: { BTC: 0, USDT: 0, ETH: 0 }
          };
          console.log('User found in auth.users:', user);
        }
      }
      
      // Final fallback: create user if email looks valid
      if (!user && operation.userAccount.includes('@')) {
        console.log('User not found anywhere, but email looks valid. Proceeding with direct ID lookup...');
        // For now, let's assume the user exists and create a minimal user object
        user = {
          id: operation.userAccount, // Use email as ID temporarily
          email: operation.userAccount,
          username: operation.userAccount.split('@')[0],
          balances: { BTC: 0, USDT: 0, ETH: 0 }
        };
        console.log('Created temporary user object:', user);
      }
      
    } catch (lookupError) {
      console.error('Complete user lookup failed:', lookupError);
    }
    
    if (!user) {
      showNotification('error', 'User account not found: ' + operation.userAccount);
      return;
    }
    
    console.log('Using user for operation:', user);

    // Validate amount
    const amount = parseFloat(operation.changeAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('error', 'Please enter a valid amount');
      return;
    }

    // Check if user has sufficient balance for withdrawal
    if (operation.type === 'withdraw') {
      const currentBalance = user.balances[operation.currency] || 0;
      if (currentBalance < amount) {
        showNotification('error', `Insufficient balance. Current ${operation.currency} balance: ${currentBalance}`);
        return;
      }
    }

    setOperationLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('error', 'Authentication required');
        return;
      }

      // Call the backend API for fund operations
      const endpoint = operation.type === 'recharge' ? '/api/admin/funds/recharge' : '/api/admin/funds/withdraw';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          currency: operation.currency,
          amount: amount,
          remark: operation.remark,
          adminId: session.user.id
        })
      });

      const result = await response.json();
      console.log('Operation result:', result); // Debug log

      if (response.ok && result.ok) {
        showNotification('success', `${operation.type === 'recharge' ? 'Recharge' : 'Withdrawal'} processed successfully!`);
        
        console.log('Operation successful, refreshing data...');
        // Refresh data
        await Promise.all([
          fetchUsersWithBalances(),
          fetchFundTransactions()
        ]);
        console.log('Data refresh completed');
        
        // Reset form
        setShowOperationModal(false);
        setOperation({
          type: 'recharge',
          userAccount: '',
          currency: 'USDT',
          changeAmount: '',
          remark: ''
        });
      } else {
        showNotification('error', result.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error processing operation:', error);
      showNotification('error', 'Error processing operation');
    } finally {
      setOperationLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.pending;
  };

  const getTypeBadge = (type) => {
    const badges = {
      recharge: 'bg-blue-100 text-blue-800',
      withdraw: 'bg-red-100 text-red-800'
    };
    return badges[type] || badges.recharge;
  };

  const formatCurrency = (amount, currency) => {
    if (currency === 'BTC') {
      return `${amount.toFixed(8)} BTC`;
    } else if (currency === 'ETH') {
      return `${amount.toFixed(6)} ETH`;
    } else {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fund Management</h1>
            <p className="text-gray-600 mt-1">Manage platform funds and financial operations</p>
          </div>
          <button 
            onClick={() => setShowOperationModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Operation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Recharges</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalRecharges.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalWithdrawals.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(stats.totalRecharges + stats.totalWithdrawals).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pendingCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Balances */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">User Balances</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BTC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USDT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETH</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userBalances.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    {user.username && (
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(user.balances.BTC || 0, 'BTC')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(user.balances.USDT || 0, 'USDT')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(user.balances.ETH || 0, 'ETH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operations History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Operations History</h3>
          <button 
            onClick={() => {
              console.log('Refreshing operations history...');
              fetchFundTransactions();
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading operations...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funds.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <div className="text-sm">No fund transactions found</div>
                      <div className="text-xs mt-1">Perform a recharge or withdraw operation to see data here</div>
                    </td>
                  </tr>
                ) : (
                  funds.map((fund) => (
                    <tr key={fund.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(fund.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(fund.type)}`}>
                          {fund.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{fund.user}</div>
                        {fund.username && fund.username !== 'Unknown' && (
                          <div className="text-sm text-gray-500">@{fund.username}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={fund.type === 'withdraw' ? 'text-red-600' : 'text-green-600'}>
                          {fund.type === 'withdraw' ? '-' : '+'}{formatCurrency(fund.amount, fund.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(fund.status)}`}>
                          {fund.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {fund.adminUser || 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fund.remark || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Operation Modal */}
      {showOperationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-blue-600">Add</h3>
              <button 
                onClick={() => setShowOperationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleOperationSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-black">Operation type:</label>
                <select
                  value={operation.type}
                  onChange={(e) => setOperation({...operation, type: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="recharge">Recharge</option>
                  <option value="withdraw">Withdraw</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-black">User account:</label>
                <input
                  type="text"
                  required
                  value={operation.userAccount}
                  onChange={(e) => setOperation({...operation, userAccount: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Enter user email or username"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-black">Currency:</label>
                <select
                  value={operation.currency}
                  onChange={(e) => setOperation({...operation, currency: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="BTC">BTC</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-black">Change amount:</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={operation.changeAmount}
                  onChange={(e) => setOperation({...operation, changeAmount: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Enter amount"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-black">Remark:</label>
                <textarea
                  value={operation.remark}
                  onChange={(e) => setOperation({...operation, remark: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Enter remark"
                  rows="3"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOperationModal(false);
                    setOperation({
                      type: 'recharge',
                      userAccount: '',
                      currency: 'USDT',
                      changeAmount: '',
                      remark: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={operationLoading}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={operationLoading}
                >
                  {operationLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-full mr-3 ${
                notificationData.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {notificationData.type === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className={`text-lg font-bold ${
                notificationData.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {notificationData.type === 'success' ? 'Success' : 'Error'}
              </h3>
            </div>
            <p className="text-black mb-6">{notificationData.message}</p>
            <button
              onClick={() => setShowNotificationModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}