import React, { useState, useEffect } from 'react';

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
  const [userBalances, setUserBalances] = useState({});

  // Mock user balances
  const mockBalances = {
    'john@example.com': { BTC: 0.5, USDT: 2500, ETH: 2.5 },
    'jane@example.com': { BTC: 0.2, USDT: 1200, ETH: 1.0 },
    'mike@example.com': { BTC: 0.8, USDT: 5000, ETH: 4.0 }
  };

  useEffect(() => {
    // Simulate loading funds data
    setTimeout(() => {
      setFunds([
        { 
          id: 1, 
          type: 'recharge', 
          amount: 5000, 
          currency: 'USDT', 
          status: 'completed', 
          user: 'john@example.com', 
          date: new Date(),
          remark: 'Initial deposit'
        },
        { 
          id: 2, 
          type: 'withdraw', 
          amount: 2500, 
          currency: 'USDT', 
          status: 'pending', 
          user: 'jane@example.com', 
          date: new Date(Date.now() - 86400000),
          remark: 'Withdrawal request'
        },
        { 
          id: 3, 
          type: 'recharge', 
          amount: 1000, 
          currency: 'BTC', 
          status: 'completed', 
          user: 'mike@example.com', 
          date: new Date(Date.now() - 172800000),
          remark: 'BTC deposit'
        }
      ]);
      setUserBalances(mockBalances);
      setLoading(false);
    }, 1000);
  }, []);

  const handleOperationSubmit = (e) => {
    e.preventDefault();
    
    if (!operation.userAccount || !operation.changeAmount) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate user exists
    if (!userBalances[operation.userAccount]) {
      alert('User account not found');
      return;
    }

    // Validate amount
    const amount = parseFloat(operation.changeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Check if user has sufficient balance for withdrawal
    if (operation.type === 'withdraw') {
      const currentBalance = userBalances[operation.userAccount][operation.currency] || 0;
      if (currentBalance < amount) {
        alert(`Insufficient balance. Current ${operation.currency} balance: ${currentBalance}`);
        return;
      }
    }

    // Simulate API call
    console.log('Processing operation:', operation);
    
    // Update user balances
    const updatedBalances = { ...userBalances };
    if (!updatedBalances[operation.userAccount]) {
      updatedBalances[operation.userAccount] = {};
    }
    
    const currentBalance = updatedBalances[operation.userAccount][operation.currency] || 0;
    if (operation.type === 'recharge') {
      updatedBalances[operation.userAccount][operation.currency] = currentBalance + amount;
    } else {
      updatedBalances[operation.userAccount][operation.currency] = currentBalance - amount;
    }
    
    setUserBalances(updatedBalances);

    // Add to funds history
    const newOperation = {
      id: Date.now(),
      type: operation.type,
      amount: amount,
      currency: operation.currency,
      status: 'completed',
      user: operation.userAccount,
      date: new Date(),
      remark: operation.remark
    };
    
    setFunds([newOperation, ...funds]);

    alert(`${operation.type === 'recharge' ? 'Recharge' : 'Withdrawal'} processed successfully!`);
    setShowOperationModal(false);
    setOperation({
      type: 'recharge',
      userAccount: '',
      currency: 'USDT',
      changeAmount: '',
      remark: ''
    });
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
                {funds.filter(f => f.type === 'recharge').length}
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
                {funds.filter(f => f.type === 'withdraw').length}
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
                {funds.reduce((sum, f) => sum + f.amount, 0).toLocaleString()}
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
                {funds.filter(f => f.status === 'pending').length}
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
              {Object.entries(userBalances).map(([user, balances]) => (
                <tr key={user} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(balances.BTC || 0, 'BTC')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(balances.USDT || 0, 'USDT')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(balances.ETH || 0, 'ETH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operations History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Operations History</h3>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funds.map((fund) => (
                  <tr key={fund.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fund.date.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(fund.type)}`}>
                        {fund.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fund.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(fund.amount, fund.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(fund.status)}`}>
                        {fund.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fund.remark}</td>
                  </tr>
                ))}
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
                <label className="block text-sm font-medium text-gray-700">Operation type:</label>
                <select
                  value={operation.type}
                  onChange={(e) => setOperation({...operation, type: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="recharge">Recharge</option>
                  <option value="withdraw">Withdraw</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">User account:</label>
                <input
                  type="text"
                  required
                  value={operation.userAccount}
                  onChange={(e) => setOperation({...operation, userAccount: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter user email"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Currency:</label>
                <select
                  value={operation.currency}
                  onChange={(e) => setOperation({...operation, currency: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="BTC">BTC</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Change amount:</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={operation.changeAmount}
                  onChange={(e) => setOperation({...operation, changeAmount: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Remark:</label>
                <textarea
                  value={operation.remark}
                  onChange={(e) => setOperation({...operation, remark: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 