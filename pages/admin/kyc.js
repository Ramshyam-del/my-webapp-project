import React, { useState, useEffect } from 'react';
import { authedFetch, getSupabaseToken } from '../../lib/authedFetch';
import AdminAuthGuard from '../../component/AdminAuthGuard';

function AdminKYCContent() {
  console.log('🏗️ [KYC] AdminKYCContent component mounting...');
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    console.log('🚀 [KYC] useEffect triggered - component mounted');
    fetchKycData();
  }, []);

  const fetchKycData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 [KYC] Starting fetchKycData function...');
      console.log('🔍 [KYC] About to call authedFetch with URL: /api/admin/users/kyc');
      
      // Add retry mechanism for network issues
      let result;
      let lastError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 [KYC] Attempt ${attempt}/3`);
          // Use frontend proxy route instead of direct backend call
          const response = await fetch('/api/admin/users/kyc', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Add session token for authentication
              'Authorization': `Bearer ${await getSupabaseToken()}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          result = await response.json();
          console.log('📋 [KYC] authedFetch completed, result:', result);
          break; // Success, exit retry loop
        } catch (fetchError) {
          lastError = fetchError;
          console.error(`❌ [KYC] Attempt ${attempt} failed:`, fetchError.message);
          
          if (attempt === 3) {
            throw fetchError; // Final attempt failed
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
      
      if (!result.ok) {
        throw new Error(result.message || 'Failed to fetch KYC data');
      }
      
      // Transform the data to match expected format
      console.log('🔍 Raw KYC data from backend:', result.data);
      
      const transformedData = result.data.map(user => ({
        id: user.id,
        user: user.user,
        status: user.status === 'not_submitted' ? 'pending' : user.status,
        submittedAt: new Date(user.submittedAt),
        documents: user.documents || [],
        notes: user.notes,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name
      }));
      
      console.log('🔄 Transformed KYC data:', transformedData);
      console.log('📊 Pending requests:', transformedData.filter(req => req.status === 'pending'));
      
      setKycRequests(transformedData);
      console.log('📋 Final KYC data:', transformedData);
    } catch (error) {
      console.error('❌ [KYC] Error fetching KYC data:', error);
      console.error('❌ [KYC] Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack,
        original: error.original
      });
      
      // Provide user-friendly error messages based on error type
      let userMessage = 'Failed to fetch KYC data';
      if (error.code === 'auth' || error.status === 401) {
        userMessage = 'Authentication failed. Please log in as an admin user.';
      } else if (error.code === 'network_error' || error.message?.includes('Network error')) {
        userMessage = 'Network connection failed. Please check if the backend server is running and try again.';
      } else if (error.status === 403) {
        userMessage = 'Access denied. You need admin privileges to view KYC data.';
      } else if (error.status >= 500) {
        userMessage = 'Server error occurred. Please try again later or contact support.';
      }
      
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    console.log('🔄 Starting KYC status change:', { id, newStatus });
    alert(`Attempting to change KYC status for ID: ${id} to ${newStatus}`);
    
    try {
      console.log('📤 Making PATCH request to:', `/api/admin/users/${id}/kyc`);
      console.log('📋 Request body:', { status: newStatus, notes: `Status changed to ${newStatus} by admin` });
      
      // Use frontend proxy route instead of direct backend call
      const response = await fetch(`/api/admin/users/${id}/kyc`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSupabaseToken()}`
        },
        body: JSON.stringify({
          status: newStatus,
          notes: `Status changed to ${newStatus} by admin`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message || 'Failed to update KYC status');
      }
      
      console.log('✅ KYC update successful:', result);
      
      // Update local state
      setKycRequests(prev => 
        prev.map(request => 
          request.id === id ? { 
            ...request, 
            status: newStatus,
            notes: `Status changed to ${newStatus} by admin on ${new Date().toLocaleDateString()}`
          } : request
        )
      );
      
      // Broadcast KYC status change to user's browser instances
      try {
        // Use BroadcastChannel to notify user portfolio pages
        const channel = new BroadcastChannel('kyc-status-updates');
        channel.postMessage({
          type: 'KYC_STATUS_UPDATED',
          userId: id,
          status: newStatus,
          timestamp: new Date().toISOString()
        });
        channel.close();
      } catch (broadcastError) {
        console.log('BroadcastChannel not supported or failed:', broadcastError);
      }
      
      // Show success message (you can add a toast notification here)
      console.log(`KYC status updated successfully for user ${id}`);
      alert(`KYC status updated to ${newStatus} successfully!`);
      
    } catch (error) {
      console.error('Failed to update KYC status:', error);
      setError(error.message || 'Failed to update KYC status');
    }
  };

  const filteredRequests = filterStatus === 'all' 
    ? kycRequests 
    : kycRequests.filter(req => req.status === filterStatus);

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">KYC Verification Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Review and manage user identity verification requests</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation text-sm sm:text-base">
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Requests</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{kycRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{kycRequests.filter(r => r.status === 'pending').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Approved</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{kycRequests.filter(r => r.status === 'approved').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Rejected</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{kycRequests.filter(r => r.status === 'rejected').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-full sm:w-auto">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base touch-manipulation w-full sm:w-auto"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* KYC Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading KYC requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-gray-600">No KYC requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    User
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    Documents
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    Submitted
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    Notes
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{request.user}</div>
                      <div className="text-xs text-gray-500">ID: {request.id}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {request.documents.map((doc, index) => (
                          <span key={index} className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {doc.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {request.submittedAt.toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                        {request.notes}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 touch-manipulation">View</button>
                        {request.status === 'pending' && (
                          <>
                      <button
                              onClick={() => handleStatusChange(request.id, 'approved')}
                              className="text-green-600 hover:text-green-900 touch-manipulation"
                      >
                              Approve
                      </button>
                      <button
                              onClick={() => handleStatusChange(request.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 touch-manipulation"
                      >
                              Reject
                      </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminKYC() {
  return (
    <AdminAuthGuard>
      <AdminKYCContent />
    </AdminAuthGuard>
  );
}