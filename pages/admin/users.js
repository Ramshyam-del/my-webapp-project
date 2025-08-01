import { useState, useEffect } from 'react';
import UserList from '../../component/UserList';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('table'); // table or grid
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // users, withdrawals, or winloss
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    vipLevel: 'VIP0',
    status: 'active'
  });

  // Withdrawal management state
  const [withdrawalFilters, setWithdrawalFilters] = useState({
    orderNo: '',
    status: 'Choose',
    userAccount: '',
    withdrawalAmountMin: '',
    withdrawalAmountMax: '',
    creationTimeStart: '',
    creationTimeEnd: ''
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOrderNo, setRejectOrderNo] = useState(null);
  const [userNotifications, setUserNotifications] = useState({}); // { userEmail: [messages] }

  // Win/Loss management state
  const [winLossFilters, setWinLossFilters] = useState({
    orderNo: '',
    userAccount: '',
    name: '',
    direction: 'Choose',
    status: 'Choose'
  });
  const [winLossOrders, setWinLossOrders] = useState([]);
  const [winLossLoading, setWinLossLoading] = useState(true);
  const [showWinLossModal, setShowWinLossModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [winLossAction, setWinLossAction] = useState('win'); // win or loss

  // Mock win/loss data
  const mockWinLossOrders = [
    {
      orderNo: 'MHY202507302929278',
      userAccount: 'Md933475@gmail.com',
      name: 'BTC/USDT',
      direction: 'BUY UP',
      contractPeriod: 180,
      amountEntrusted: 160,
      lever: 2,
      profitAmount: 0,
      openingTime: '2025-07-30 12:46:05',
      delegateState: 'Ongoing',
      singleOperator: 'System',
      operator: '-',
      singleControlOperation: 'Normal'
    },
    {
      orderNo: 'MHY202507302929279',
      userAccount: 'john.doe@example.com',
      name: 'ETH/USDT',
      direction: 'BUY FALL',
      contractPeriod: 300,
      amountEntrusted: 200,
      lever: 1,
      profitAmount: 45,
      openingTime: '2025-07-30 11:30:15',
      delegateState: 'Completed',
      singleOperator: 'System',
      operator: '-',
      singleControlOperation: 'Normal'
    },
    {
      orderNo: 'MHY202507302929280',
      userAccount: 'jane.smith@example.com',
      name: 'SOL/USDT',
      direction: 'BUY UP',
      contractPeriod: 120,
      amountEntrusted: 100,
      lever: 3,
      profitAmount: -25,
      openingTime: '2025-07-30 10:15:22',
      delegateState: 'Completed',
      singleOperator: 'System',
      operator: '-',
      singleControlOperation: 'Normal'
    }
  ];

  // Mock withdrawal data
  const mockWithdrawals = [
    {
      orderNo: 'TX202507305771481',
      userAccount: 'cwebb3526@gmail.com',
      currency: 'USDT',
      withdrawalAmount: 3.0000000000,
      actualAmount: 3.0000000000,
      frequencyOfWithdrawals: 2,
      withdrawalChannel: 'USDT-TRC20',
      withdrawalAddress: '15khnQTy99vgJ6pbLjHBpgkkEjtWp9Pv1',
      creationTime: '2025-07-30 11:07:28',
      operator: '-',
      status: 'pending'
    },
    {
      orderNo: 'TX202507305771482',
      userAccount: 'john.doe@example.com',
      currency: 'BTC',
      withdrawalAmount: 0.00150000,
      actualAmount: 0.00150000,
      frequencyOfWithdrawals: 1,
      withdrawalChannel: 'BTC',
      withdrawalAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      creationTime: '2025-07-30 10:30:15',
      operator: '-',
      status: 'completed'
    },
    {
      orderNo: 'TX202507305771483',
      userAccount: 'jane.smith@example.com',
      currency: 'ETH',
      withdrawalAmount: 0.05000000,
      actualAmount: 0.05000000,
      frequencyOfWithdrawals: 3,
      withdrawalChannel: 'ETH-ERC20',
      withdrawalAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      creationTime: '2025-07-30 09:45:22',
      operator: '-',
      status: 'rejected'
    }
  ];

  useEffect(() => {
    // Simulate loading withdrawal data
    setTimeout(() => {
      setWithdrawals(mockWithdrawals);
      setWithdrawalLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Simulate loading win/loss data
    setTimeout(() => {
      setWinLossOrders(mockWinLossOrders);
      setWinLossLoading(false);
    }, 1000);
  }, []);

  // Handle add user
  const handleAddUser = (e) => {
    e.preventDefault();
    // Simulate API call
    console.log('Adding new user:', newUser);
    alert('User added successfully!');
    setShowAddUserModal(false);
    setNewUser({ email: '', password: '', vipLevel: 'VIP0', status: 'active' });
  };

  // Handle export
  const handleExport = (format) => {
    console.log(`Exporting users in ${format} format`);
    alert(`Exporting users in ${format} format...`);
    setShowExportModal(false);
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    console.log(`Performing ${action} on ${selectedUsers.length} users`);
    alert(`${action} performed on ${selectedUsers.length} users`);
    setShowBulkActionsModal(false);
    setSelectedUsers([]);
  };

  // Handle withdrawal search
  const handleWithdrawalSearch = () => {
    console.log('Searching withdrawals with filters:', withdrawalFilters);
    alert('Search completed!');
  };

  // Handle withdrawal reset
  const handleWithdrawalReset = () => {
    setWithdrawalFilters({
      orderNo: '',
      status: 'Choose',
      userAccount: '',
      withdrawalAmountMin: '',
      withdrawalAmountMax: '',
      creationTimeStart: '',
      creationTimeEnd: ''
    });
  };

  // Handle withdrawal configuration
  const handleWithdrawalConfig = () => {
    alert('Withdrawal configuration opened!');
  };

  // Handle withdrawal actions
  const handleWithdrawalAction = (orderNo, action) => {
    if (action === 'reject') {
      setRejectOrderNo(orderNo);
      setShowRejectModal(true);
      setRejectReason('');
    } else {
      alert(`${action} action performed on withdrawal ${orderNo}`);
    }
  };

  const handleRejectConfirm = () => {
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.orderNo === rejectOrderNo
          ? { ...w, status: 'rejected', rejectionReason: rejectReason }
          : w
      )
    );
    
    // Add notification for user
    const withdrawal = withdrawals.find((w) => w.orderNo === rejectOrderNo);
    if (withdrawal) {
      const notification = {
        id: Date.now(),
        message: `Withdrawal rejected: ${rejectReason}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'withdrawal_rejection'
      };
      
      // Save to localStorage for the specific user
      const existingNotifications = JSON.parse(localStorage.getItem(`notifications_${withdrawal.userAccount}`) || '[]');
      const updatedNotifications = [notification, ...existingNotifications];
      localStorage.setItem(`notifications_${withdrawal.userAccount}`, JSON.stringify(updatedNotifications));
      
      // Update state for admin view
      setUserNotifications((prev) => ({
        ...prev,
        [withdrawal.userAccount]: [
          ...(prev[withdrawal.userAccount] || []),
          `Withdrawal rejected: ${rejectReason}`
        ]
      }));
    }
    
    setShowRejectModal(false);
    setRejectOrderNo(null);
    setRejectReason('');
  };

  const getWithdrawalStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800'
    };
    return badges[status] || badges.pending;
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

  const totalWithdrawalAmount = withdrawals.reduce((sum, w) => sum + w.withdrawalAmount, 0);

  // Win/Loss management functions
  const handleWinLossSearch = () => {
    // Simulate search functionality
    console.log('Searching win/loss orders with filters:', winLossFilters);
  };

  const handleWinLossReset = () => {
    setWinLossFilters({
      orderNo: '',
      userAccount: '',
      name: '',
      direction: 'Choose',
      status: 'Choose'
    });
  };

  const handleWinLossAction = (orderNo, action) => {
    setSelectedOrder(winLossOrders.find(order => order.orderNo === orderNo));
    setWinLossAction(action);
    setShowWinLossModal(true);
  };

  const handleWinLossConfirm = () => {
    if (selectedOrder && winLossAction) {
      // Simulate API call to update order status
      setWinLossOrders(prev => prev.map(order => 
        order.orderNo === selectedOrder.orderNo 
          ? { 
              ...order, 
              delegateState: winLossAction === 'win' ? 'Win' : 'Loss',
              singleControlOperation: winLossAction === 'win' ? 'Win' : 'Loss',
              operator: 'Admin'
            }
          : order
      ));
      
      // Add notification for user
      setUserNotifications(prev => ({
        ...prev,
        [selectedOrder.userAccount]: [
          ...(prev[selectedOrder.userAccount] || []),
          {
            type: 'trade_result',
            message: `Your trade (${selectedOrder.orderNo}) has been marked as ${winLossAction.toUpperCase()}`,
            timestamp: new Date().toISOString()
          }
        ]
      }));
      
      setShowWinLossModal(false);
      setSelectedOrder(null);
      setWinLossAction('win');
      alert(`Order marked as ${winLossAction.toUpperCase()} successfully!`);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts, KYC verification, and user data</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add User
            </button>
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            {selectedUsers.length > 0 && (
              <button 
                onClick={() => setShowBulkActionsModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Bulk Actions ({selectedUsers.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'withdrawals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Withdrawal Management
            </button>
            <button
              onClick={() => setActiveTab('winloss')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'winloss'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Win/Loss Management
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending KYC</option>
                  <option value="suspended">Suspended</option>
                  <option value="verified">Verified</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">Registration Date</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="status">Status</option>
                  <option value="balance">Balance</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">1-10</span> of <span className="font-medium">1,250</span> users
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">1,250</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified Users</p>
                  <p className="text-2xl font-bold text-gray-900">1,180</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending KYC</p>
                  <p className="text-2xl font-bold text-gray-900">33</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-gray-900">37</p>
                </div>
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <UserList />
          </div>
        </>
      ) : activeTab === 'withdrawals' ? (
        <>
          {/* Withdrawal Management */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Withdrawal Management</h2>
            
            {/* Search and Filter Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order NO.</label>
                  <input
                    type="text"
                    value={withdrawalFilters.orderNo}
                    onChange={(e) => setWithdrawalFilters({...withdrawalFilters, orderNo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter order number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={withdrawalFilters.status}
                    onChange={(e) => setWithdrawalFilters({...withdrawalFilters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Choose">Choose</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="processing">Processing</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User account</label>
                  <input
                    type="text"
                    value={withdrawalFilters.userAccount}
                    onChange={(e) => setWithdrawalFilters({...withdrawalFilters, userAccount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter user email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal amount</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="any"
                      value={withdrawalFilters.withdrawalAmountMin}
                      onChange={(e) => setWithdrawalFilters({...withdrawalFilters, withdrawalAmountMin: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Min"
                    />
                    <span className="self-center text-gray-500">-</span>
                    <input
                      type="number"
                      step="any"
                      value={withdrawalFilters.withdrawalAmountMax}
                      onChange={(e) => setWithdrawalFilters({...withdrawalFilters, withdrawalAmountMax: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Max"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Creation Time</label>
                  <div className="flex space-x-2">
                    <input
                      type="datetime-local"
                      value={withdrawalFilters.creationTimeStart}
                      onChange={(e) => setWithdrawalFilters({...withdrawalFilters, creationTimeStart: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="self-center text-gray-500">-</span>
                    <input
                      type="datetime-local"
                      value={withdrawalFilters.creationTimeEnd}
                      onChange={(e) => setWithdrawalFilters({...withdrawalFilters, creationTimeEnd: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleWithdrawalSearch}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={handleWithdrawalReset}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleWithdrawalConfig}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Withdrawal configuration
                </button>
              </div>
            </div>

            {/* Total Withdrawal Summary */}
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-900">
                Total Withdraw {formatCurrency(totalWithdrawalAmount, 'USDT')}
              </p>
            </div>

            {/* Withdrawal Records Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order NO.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Withdrawal amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency of withdrawals</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Withdrawal channel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Withdrawal address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creation Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawalLoading ? (
                      <tr>
                        <td colSpan="12" className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading withdrawal records...</p>
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.orderNo} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {withdrawal.orderNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {withdrawal.userAccount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {withdrawal.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(withdrawal.withdrawalAmount, withdrawal.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(withdrawal.actualAmount, withdrawal.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {withdrawal.frequencyOfWithdrawals}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {withdrawal.withdrawalChannel}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {withdrawal.withdrawalAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {withdrawal.creationTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWithdrawalStatusBadge(withdrawal.status)}`}>
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {withdrawal.operator}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleWithdrawalAction(withdrawal.orderNo, 'lock')}
                                className="text-yellow-600 hover:text-yellow-900 cursor-pointer"
                              >
                                Lock order
                              </button>
                              <button
                                onClick={() => handleWithdrawalAction(withdrawal.orderNo, 'reject')}
                                className="text-red-600 hover:text-red-900 cursor-pointer"
                              >
                                Rejection
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'winloss' ? (
        <>
          {/* Win/Loss Management */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Win/Loss Management</h2>
            
            {/* Search and Filter Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order NO.</label>
                  <input
                    type="text"
                    value={winLossFilters.orderNo}
                    onChange={(e) => setWinLossFilters({...winLossFilters, orderNo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter order number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User account</label>
                  <input
                    type="text"
                    value={winLossFilters.userAccount}
                    onChange={(e) => setWinLossFilters({...winLossFilters, userAccount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter user email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={winLossFilters.name}
                    onChange={(e) => setWinLossFilters({...winLossFilters, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter trading pair"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                  <select
                    value={winLossFilters.direction}
                    onChange={(e) => setWinLossFilters({...winLossFilters, direction: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Choose">Choose</option>
                    <option value="BUY UP">BUY UP</option>
                    <option value="BUY FALL">BUY FALL</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={winLossFilters.status}
                    onChange={(e) => setWinLossFilters({...winLossFilters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Choose">Choose</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Win">Win</option>
                    <option value="Loss">Loss</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleWinLossSearch}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={handleWinLossReset}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Win/Loss Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order NO.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Period (sec)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount entrusted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lever</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delegate state</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Single operator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Single control operation</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {winLossLoading ? (
                      <tr>
                        <td colSpan="13" className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading win/loss orders...</p>
                        </td>
                      </tr>
                    ) : (
                      winLossOrders.map((order) => (
                        <tr key={order.orderNo} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.orderNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.userAccount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.direction === 'BUY UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {order.direction}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.contractPeriod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${order.amountEntrusted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.lever}x
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              order.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {order.profitAmount >= 0 ? '+' : ''}{order.profitAmount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.openingTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.delegateState === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' :
                              order.delegateState === 'Completed' ? 'bg-blue-100 text-blue-800' :
                              order.delegateState === 'Win' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.delegateState}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.singleOperator}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.operator}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <select
                                value={order.singleControlOperation}
                                onChange={(e) => {
                                  if (e.target.value === 'Win' || e.target.value === 'Loss') {
                                    handleWinLossAction(order.orderNo, e.target.value.toLowerCase());
                                  }
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value="Normal">Normal</option>
                                <option value="Win">Win</option>
                                <option value="Loss">Loss</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New User</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VIP Level</label>
                <select
                  value={newUser.vipLevel}
                  onChange={(e) => setNewUser({...newUser, vipLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="VIP0">VIP0</option>
                  <option value="VIP1">VIP1</option>
                  <option value="VIP2">VIP2</option>
                  <option value="VIP3">VIP3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Export Users</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">Choose export format:</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleExport('CSV')}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="font-medium">CSV Format</div>
                  <div className="text-sm text-gray-500">Compatible with Excel and Google Sheets</div>
                </button>
                
                <button
                  onClick={() => handleExport('JSON')}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="font-medium">JSON Format</div>
                  <div className="text-sm text-gray-500">For API integration and data processing</div>
                </button>
                
                <button
                  onClick={() => handleExport('PDF')}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="font-medium">PDF Report</div>
                  <div className="text-sm text-gray-500">Formatted report for printing</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Bulk Actions</h3>
              <button 
                onClick={() => setShowBulkActionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">Perform actions on {selectedUsers.length} selected users:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleBulkAction('activate')}
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Activate Users
              </button>
              
              <button
                onClick={() => handleBulkAction('suspend')}
                className="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Suspend Users
              </button>
              
              <button
                onClick={() => handleBulkAction('delete')}
                className="w-full p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Delete Users
              </button>
              
              <button
                onClick={() => handleBulkAction('export')}
                className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export Selected
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4 bg-blue-900 text-white px-4 py-2 rounded-t-lg">
              <h3 className="text-lg font-bold">rejection</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reasons for rejection:</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleRejectConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win/Loss Modal */}
      {showWinLossModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4 bg-blue-900 text-white px-4 py-2 rounded-t-lg">
              <h3 className="text-lg font-bold">Win/Loss Management</h3>
              <button
                onClick={() => setShowWinLossModal(false)}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                <strong>Order:</strong> {selectedOrder.orderNo}<br />
                <strong>User:</strong> {selectedOrder.userAccount}<br />
                <strong>Trading Pair:</strong> {selectedOrder.name}<br />
                <strong>Direction:</strong> {selectedOrder.direction}<br />
                <strong>Amount:</strong> ${selectedOrder.amountEntrusted}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Action:</label>
                <div className="flex space-x-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="winLossAction"
                      value="win"
                      checked={winLossAction === 'win'}
                      onChange={(e) => setWinLossAction(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-green-600 font-medium">Win</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="winLossAction"
                      value="loss"
                      checked={winLossAction === 'loss'}
                      onChange={(e) => setWinLossAction(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-red-600 font-medium">Loss</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowWinLossModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleWinLossConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 