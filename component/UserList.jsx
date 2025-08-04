import { useState, useEffect } from 'react';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Mock data
  const mockUsers = [
    {
      id: '77012',
      email: 'ramshyamgopalhari@gmail.com',
      invitationCode: 'INV5wwmq3',
      vipLevel: 'VIP0',
      balanceStatus: 'Normal',
      creditScore: 100,
      realNameAuth: 'uncer',
      joinDate: '2024-01-15',
      lastLogin: '2024-01-20',
      status: 'active'
    },
    {
      id: '77013',
      email: 'john.doe@example.com',
      invitationCode: 'INV7abc12',
      vipLevel: 'VIP1',
      balanceStatus: 'Premium',
      creditScore: 150,
      realNameAuth: 'verified',
      joinDate: '2024-01-10',
      lastLogin: '2024-01-21',
      status: 'active'
    },
    {
      id: '77014',
      email: 'jane.smith@example.com',
      invitationCode: 'INV9def34',
      vipLevel: 'VIP0',
      balanceStatus: 'Normal',
      creditScore: 80,
      realNameAuth: 'pending',
      joinDate: '2024-01-18',
      lastLogin: '2024-01-19',
      status: 'inactive'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(mockUsers);
        setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm) ||
    user.invitationCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setEditingUser(user);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = () => {
    // Update user in the list
    setUsers(users.map(user => 
      user.id === editingUser.id ? editingUser : user
    ));
    setShowEditModal(false);
    setEditingUser(null);
    
    // Show success message
    alert('User updated successfully!');
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleInputChange = (field, value) => {
    setEditingUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showEditModal) {
        handleCancelEdit();
      }
    };

    if (showEditModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showEditModal]);

  // Edit Modal Component
  const EditModal = () => {
    if (!showEditModal || !editingUser) return null;

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        handleCancelEdit();
      }
    };

    const handleFormSubmit = (e) => {
      e.preventDefault();
      handleSaveEdit();
    };

  return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gray-800 text-white px-4 sm:px-6 py-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-lg font-semibold">Edit</h2>
            <button
              onClick={handleCancelEdit}
              className="text-white hover:text-gray-300 text-xl font-bold transition-colors"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-4">
            {/* User Account */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">User account:</label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                disabled
              />
            </div>

            {/* Password */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Password:</label>
              <input
                type="text"
                value="Do not fill or modify"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-400"
                disabled
              />
      </div>

            {/* Withdrawal Password */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Withdrawal password:</label>
              <input
                type="text"
                value="Do not fill or modify"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-400"
                disabled
              />
    </div>

            {/* Withdrawal Address */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Withdrawal address:</label>
          <input
                type="text"
                value={editingUser.withdrawalAddress || 'bc1qw0q7glu0uqy04zryjcd3s5q2p563r4zxjyff5a'}
                onChange={(e) => handleInputChange('withdrawalAddress', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter withdrawal address"
            required
          />
            </div>

            {/* Credit Score */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Credit score:</label>
              <input
                type="number"
                value={editingUser.creditScore || 100}
                onChange={(e) => handleInputChange('creditScore', parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="1000"
            required
          />
      </div>

            {/* VIP Levels */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Vip Levels:</label>
              <select
                value={editingUser.vipLevel || 'VIP0'}
                onChange={(e) => handleInputChange('vipLevel', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="VIP0">VIP0</option>
                <option value="VIP1">VIP1</option>
                <option value="VIP2">VIP2</option>
                <option value="VIP3">VIP3</option>
                <option value="VIP4">VIP4</option>
                <option value="VIP5">VIP5</option>
              </select>
    </div>

            {/* Action Buttons */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-end gap-3">
    <button
      type="button"
                onClick={handleCancelEdit}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
    </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
          </div>
        </form>
      </div>
    </div>
  );
  };

  const handleConfirmDelete = () => {
    // Simulate API call
    console.log('Deleting user:', editingUser);
    alert('User deleted successfully!');
    setShowDeleteModal(false);
    setEditingUser(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.inactive;
  };

  const getAuthBadge = (auth) => {
    const badges = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      uncer: 'bg-gray-100 text-gray-800'
    };
    return badges[auth] || badges.uncer;
  };

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
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage user accounts and permissions</p>
                  </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add User
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Export
          </button>
                </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
    </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Suspended</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option>All VIP Levels</option>
            <option>VIP0</option>
            <option>VIP1</option>
            <option>VIP2</option>
        </select>
      </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VIP Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KYC Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                        <div className="text-xs text-gray-400">Code: {user.invitationCode}</div>
                      </div>
                    </div>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.vipLevel}
                    </span>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                      {user.status}
                    </span>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.creditScore}
                </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAuthBadge(user.realNameAuth)}`}>
                      {user.realNameAuth}
                    </span>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 cursor-pointer"
                      >
                        Edit
                      </button>
                  <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                      >
                        Delete
                  </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredUsers.length}</span> results
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
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditModal />
      )}

      {/* Delete User Modal */}
      {showDeleteModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-600">Delete User</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete user <strong>{editingUser.email}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone. All user data will be permanently removed.
              </p>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UserList; 