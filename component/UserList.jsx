import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user'
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Get Supabase access token for API calls
  const getAccessToken = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        throw new Error('Not authenticated');
      }
      return session.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get access token from Supabase session
      const accessToken = await getAccessToken();

      console.log('Fetching users with Supabase token');

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Response error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const { users } = await response.json();
      console.log('Fetched users:', users);
      setUsers(users || []);
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

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toString().includes(searchTerm) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleAddUser = () => {
    setNewUser({
      email: '',
      password: '',
      username: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'user'
    });
    setShowAddModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`/api/admin/users/${editingUser.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: editingUser.status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser.id ? editingUser : user
      ));
      
      setShowEditModal(false);
      setEditingUser(null);
      setSuccess('User updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user: ' + error.message);
    }
  };

  const handleSaveAdd = async () => {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const { user } = await response.json();
      
      // Add new user to local state
      setUsers([user, ...users]);
      
      setShowAddModal(false);
      setNewUser({
        email: '',
        password: '',
        username: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'user'
      });
      setSuccess('User created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user: ' + error.message);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Remove user from local state
      setUsers(users.filter(user => user.id !== editingUser.id));
      
      setShowDeleteModal(false);
      setEditingUser(null);
      setSuccess('User deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewUser({
      email: '',
      password: '',
      username: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'user'
    });
  };

  const handleInputChange = (field, value) => {
    setEditingUser(prev => ({ ...prev, [field]: value }));
  };

  const handleNewUserInputChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const clearError = () => {
    setError(null);
  };

  const clearSuccess = () => {
    setSuccess(null);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showEditModal) {
          handleCancelEdit();
        }
        if (showAddModal) {
          handleCancelAdd();
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setEditingUser(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showEditModal, showAddModal, showDeleteModal]);

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

  const AddUserModal = () => {
    if (!showAddModal) return null;

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        handleCancelAdd();
      }
    };

    const handleFormSubmit = (e) => {
      e.preventDefault();
      handleSaveAdd();
    };

  return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gray-800 text-white px-4 sm:px-6 py-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-lg font-semibold">Add New User</h2>
            <button
              onClick={handleCancelAdd}
              className="text-white hover:text-gray-300 text-xl font-bold transition-colors"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-4">
            {/* Email */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Email:</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => handleNewUserInputChange('email', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Password:</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => handleNewUserInputChange('password', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                required
              />
            </div>

            {/* Username */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Username:</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => handleNewUserInputChange('username', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                required
              />
            </div>

            {/* First Name */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">First Name:</label>
              <input
                type="text"
                value={newUser.first_name}
                onChange={(e) => handleNewUserInputChange('first_name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                required
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Last Name:</label>
              <input
                type="text"
                value={newUser.last_name}
                onChange={(e) => handleNewUserInputChange('last_name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                required
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Phone:</label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => handleNewUserInputChange('phone', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>

            {/* Role */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700">Role:</label>
              <select
                value={newUser.role}
                onChange={(e) => handleNewUserInputChange('role', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelAdd}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                Add User
              </button>
            </div>
          </form>
        </div>
      </div>
  );
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
    <div className="p-4 sm:p-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={clearSuccess} className="text-green-700 hover:text-green-900">
            ×
          </button>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-700 hover:text-red-900">
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
          <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={handleAddUser}>
            + Add User
          </button>
          <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Export
          </button>
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
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <select className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Suspended</option>
          </select>
          <select className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
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
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-medium">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 sm:ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                        {user.invitationCode && (
                          <div className="text-xs text-gray-400">Code: {user.invitationCode}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 truncate">{user.email}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${user.balance ? parseFloat(user.balance).toFixed(2) : '0.00'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 cursor-pointer text-xs sm:text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 cursor-pointer text-xs sm:text-sm"
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditModal />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal />
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