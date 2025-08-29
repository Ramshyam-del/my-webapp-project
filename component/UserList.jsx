import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getSafeDocument } from '../utils/safeStorage';
import { authedFetchJson, updateUserEdit } from '../lib/authedFetch';
import EditUserModal from './EditUserModal';
import { asObj, pickIfHas, snapshotArray, safeMergeUserData, isValidApiResponse } from '../utils/safeHelpers';

const UserList = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Selection
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    userAccount: '',
    superiorAccount: '',
    accountStatus: 'All',
    registrationTimeStart: '',
    registrationTimeEnd: ''
  });
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Mock data for demonstration
  const mockUsers = [
    {
      id: '1',
      email: 'user1@example.com',
      userAccount: 'user1@example.com',
      invitationCode: 'INV001',
      vipLevel: 'VIP1',
      balanceStatus: 'Active',
      creditScore: 85,
      realNameAuth: 'certified',
      totalAssets: 12500.50,
      totalRecharge: 15000.00,
      totalWithdraw: 2500.00,
      superiorAccount: 'admin@quantex.com',
      latestIp: '192.168.1.100',
      latestTime: '2024-01-15 14:30:25',
      withdrawalStatus: true,
      transactionStatus: true,
      accountStatus: 'Normal',
      registrationTime: '2024-01-01 10:00:00',
      usdt_withdraw_address: 'TRC20_USDT_ADDRESS_1',
      btc_withdraw_address: 'BTC_ADDRESS_1',
      eth_withdraw_address: 'ETH_ADDRESS_1',
      trx_withdraw_address: 'TRX_ADDRESS_1',
      xrp_withdraw_address: 'XRP_ADDRESS_1'
    },
    {
      id: '2',
      email: 'user2@example.com',
      userAccount: 'user2@example.com',
      invitationCode: 'INV002',
      vipLevel: 'VIP0',
      balanceStatus: 'Frozen',
      creditScore: 45,
      realNameAuth: 'uncertified',
      totalAssets: 500.00,
      totalRecharge: 1000.00,
      totalWithdraw: 500.00,
      superiorAccount: 'user1@example.com',
      latestIp: '192.168.1.101',
      latestTime: '2024-01-14 16:45:12',
      withdrawalStatus: false,
      transactionStatus: true,
      accountStatus: 'Frozen',
      registrationTime: '2024-01-05 12:30:00',
      usdt_withdraw_address: '',
      btc_withdraw_address: '',
      eth_withdraw_address: '',
      trx_withdraw_address: '',
      xrp_withdraw_address: ''
    }
  ];

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, use mock data. Replace with real API call:
      // const response = await authedFetchJson('/api/admin/users');
      // setUsers(response?.data?.items ?? []);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on current filters
  const filteredUsers = users.filter(user => {
    const matchesUserAccount = !filters.userAccount || 
      user.userAccount.toLowerCase().includes(filters.userAccount.toLowerCase());
    
    const matchesSuperiorAccount = !filters.superiorAccount || 
      user.superiorAccount.toLowerCase().includes(filters.superiorAccount.toLowerCase());
    
    const matchesAccountStatus = filters.accountStatus === 'All' || 
      user.accountStatus === filters.accountStatus;
    
    const matchesRegistrationTime = (!filters.registrationTimeStart || 
      user.registrationTime >= filters.registrationTimeStart) &&
      (!filters.registrationTimeEnd || user.registrationTime <= filters.registrationTimeEnd);
    
    return matchesUserAccount && matchesSuperiorAccount && matchesAccountStatus && matchesRegistrationTime;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Paginate users
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle selection
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  // Handle filters
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters({
      userAccount: '',
      superiorAccount: '',
      accountStatus: 'All',
      registrationTimeStart: '',
      registrationTimeEnd: ''
    });
    setCurrentPage(1);
  };

  // Helper function to create immutable snapshot for rollback
  const snapshotUsers = () => snapshotArray(users);

  // Handle toggle actions
  const handleToggleStatus = async (userId, statusType, newValue) => {
    try {
      // Create an immutable snapshot for rollback
      const rollbackUsers = snapshotUsers();
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, [statusType]: newValue }
          : user
      ));

      const response = await authedFetchJson(`/api/admin/users/${userId}/${statusType}`, {
        method: 'POST',
        body: JSON.stringify({ status: newValue })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setSuccess(`${statusType.replace(/([A-Z])/g, ' $1').trim()} updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error(`Error updating ${statusType}:`, error);
      if (rollbackUsers) setUsers(rollbackUsers);
      setError(`Failed to update ${statusType}: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle action buttons
  const handleOneClickLogin = async (userId) => {
    try {
      const response = await authedFetchJson(`/api/admin/users/${userId}/login`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setSuccess('One-click login initiated');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError('Failed to initiate login: ' + error.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleBankCard = async (userId) => {
    try {
      const response = await authedFetchJson(`/api/admin/users/${userId}/bank-card`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setSuccess('Bank card action completed');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError('Failed to process bank card action: ' + error.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleFreeze = async (userId) => {
    try {
      // Create an immutable snapshot for rollback
      const rollbackUsers = snapshotUsers();
      
      // Optimistic update
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, accountStatus: 'Frozen' }
          : user
      ));

      const response = await authedFetchJson(`/api/admin/users/${userId}/freeze`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setSuccess('User account frozen');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to freeze account');
      }
    } catch (error) {
      console.error('Freeze account error:', error);
      if (rollbackUsers) setUsers(rollbackUsers);
      setError('Failed to freeze account: ' + error.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleSaveUser = async (userId, payload) => {
    try {
      // Create snapshot for rollback
      const rollbackUsers = snapshotUsers();
      
      // Optimistic update - update the user in the list
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              // Update wallet addresses if they exist in the response
              ...(payload.data?.usdt_withdraw_address && { usdt_withdraw_address: payload.data.usdt_withdraw_address }),
              ...(payload.data?.btc_withdraw_address && { btc_withdraw_address: payload.data.btc_withdraw_address }),
              ...(payload.data?.eth_withdraw_address && { eth_withdraw_address: payload.data.eth_withdraw_address }),
              ...(payload.data?.trx_withdraw_address && { trx_withdraw_address: payload.data.trx_withdraw_address }),
              ...(payload.data?.xrp_withdraw_address && { xrp_withdraw_address: payload.data.xrp_withdraw_address })
            }
          : user
      ));

      const response = await updateUserEdit(userId, payload);
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Validate API response shape for consistency
      if (!isValidApiResponse(response)) {
        console.warn('Invalid API response shape:', response);
        throw new Error('Invalid response from server');
      }

      // Safely merge API response data into user state
      setUsers((prev) =>
        (prev ?? []).map((u) => {
          if (u.id !== userId) return u;
          return safeMergeUserData(u, response.data);
        })
      );

      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      // Rollback on failure
      if (rollbackUsers) setUsers(rollbackUsers);
      throw error; // Re-throw to let modal handle the error display
    }
  };

  // Utility functions
  const getStatusBadge = (status) => {
    const badges = {
      'Normal': 'bg-green-100 text-green-800',
      'Frozen': 'bg-red-100 text-red-800',
      'Disabled': 'bg-gray-100 text-gray-800'
    };
    return badges[status] || badges['Normal'];
  };

  const getAuthBadge = (auth) => {
    return auth === 'certified' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
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
      minute: '2-digit',
      second: '2-digit'
    });
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0">
          <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add User
          </button>
          <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Account</label>
            <input
              type="text"
              value={filters.userAccount}
              onChange={(e) => handleFilterChange('userAccount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search user account"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Superior Account</label>
            <input
              type="text"
              value={filters.superiorAccount}
              onChange={(e) => handleFilterChange('superiorAccount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search superior account"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
            <select
              value={filters.accountStatus}
              onChange={(e) => handleFilterChange('accountStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All</option>
              <option value="Normal">Normal</option>
              <option value="Frozen">Frozen</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Time</label>
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={filters.registrationTimeStart}
                onChange={(e) => handleFilterChange('registrationTimeStart', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="datetime-local"
                value={filters.registrationTimeEnd}
                onChange={(e) => handleFilterChange('registrationTimeEnd', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSearch}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 touch-manipulation"
                  />
                </th>
                <th 
                  className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 touch-manipulation"
                  onClick={() => handleSort('id')}
                >
                  ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 touch-manipulation min-w-[120px]"
                  onClick={() => handleSort('userAccount')}
                >
                  User Account {sortConfig.key === 'userAccount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Invitation Code
                </th>
                <th 
                  className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 touch-manipulation"
                  onClick={() => handleSort('vipLevel')}
                >
                  VIP Level {sortConfig.key === 'vipLevel' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Balance Status
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Score
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Real Name Authentication
                </th>
                <th 
                  className="px-2 sm:px-3 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 touch-manipulation min-w-[100px]"
                  onClick={() => handleSort('totalAssets')}
                >
                  Total Assets {sortConfig.key === 'totalAssets' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Total Recharge
                </th>
                <th 
                  className="px-2 sm:px-3 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 touch-manipulation min-w-[100px]"
                  onClick={() => handleSort('totalWithdraw')}
                >
                  Total Withdraw {sortConfig.key === 'totalWithdraw' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Superior Account
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                  Latest IP Address / Time
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Withdrawal Status
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Transaction Status
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Account Status
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="17" className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 touch-manipulation"
                      />
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{user.userAccount}</div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.invitationCode}
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.vipLevel}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.balanceStatus)}`}>
                        {user.balanceStatus}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.creditScore}
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAuthBadge(user.realNameAuth)}`}>
                        {user.realNameAuth === 'certified' ? 'Certified' : 'Uncertified'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(user.totalAssets)}
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(user.totalRecharge)}
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(user.totalWithdraw)}
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="truncate max-w-[120px]">{user.superiorAccount}</div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-blue-600 hover:text-blue-800 cursor-pointer touch-manipulation">
                          {user.latestIp}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatDate(user.latestTime)}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleStatus(user.id, 'withdrawalStatus', !user.withdrawalStatus)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation ${
                          user.withdrawalStatus ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            user.withdrawalStatus ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleStatus(user.id, 'transactionStatus', !user.transactionStatus)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation ${
                          user.transactionStatus ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            user.transactionStatus ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleStatus(user.id, 'accountStatus', user.accountStatus === 'Normal' ? 'Frozen' : 'Normal')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation ${
                          user.accountStatus === 'Normal' ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            user.accountStatus === 'Normal' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleOneClickLogin(user.id)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors touch-manipulation"
                        >
                          One-Click Login
                        </button>
                        <button
                          onClick={() => handleBankCard(user.id)}
                          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors touch-manipulation"
                        >
                          Bank Card
                        </button>
                        <button
                          onClick={() => handleFreeze(user.id)}
                          className="px-2 py-1 text-xs border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors touch-manipulation"
                        >
                          Freeze
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-2 py-1 text-xs border border-gray-600 text-gray-600 rounded hover:bg-gray-50 transition-colors touch-manipulation"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-3 py-2.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, sortedUsers.length)}
                </span>{' '}
                of <span className="font-medium">{sortedUsers.length}</span> rows
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium touch-manipulation ${
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
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UserList;