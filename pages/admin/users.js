import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import UserList from '../../component/UserList';

export default function AdminUsers() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState('');
  const [tradeOutcome, setTradeOutcome] = useState('');
  const [processingTrade, setProcessingTrade] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortKey, setSortKey] = useState('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter();

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!active) return
      if (!session) { router.replace('/admin/login'); setLoading(false); return }
      const resp = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!active) return
      if (!resp.ok) { await supabase.auth.signOut(); router.replace('/admin/login'); setLoading(false); return }
      setIsAuth(true)
      await loadUsers(session, page, limit)
      setLoading(false)
    })()
    return () => { active = false }
  }, [router])

  const loadUsers = async (session, pageNum = page, lim = limit) => {
    try {
      setError('')
      const r = await fetch(`/api/admin/users?page=${pageNum}&limit=${lim}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      const j = await r.json()
      if (!r.ok) throw new Error(j.message || 'Failed to load users')
      setUsers(j.data || [])
    } catch (e) {
      setError(e.message)
    }
  }

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

  const handleGoBack = () => {
    router.push('/admin');
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace('/admin/login') };

  const handleSetTradeOutcome = async (outcome) => {
    if (!selectedUser) {
      setTradeMessage('Please select a user first');
      return;
    }

    setProcessingTrade(true);
    setTradeMessage('');

    try {
      const accessToken = await getAccessToken();

      const response = await fetch('/api/admin/trade-outcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userEmail: selectedUser,
          outcome: outcome // 'win' or 'loss'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTradeMessage(`Successfully set ${outcome} for ${selectedUser}`);
        setSelectedUser('');
        // Refresh the trade data
        // You can add a function to refresh the trade list here
      } else {
        setTradeMessage(`Error: ${data.error || 'Failed to set trade outcome'}`);
      }
    } catch (error) {
      setTradeMessage(`Error: ${error.message}`);
    } finally {
      setProcessingTrade(false);
    }
  };

  const handleSetIndividualTradeOutcome = async (userEmail, outcome) => {
    setProcessingTrade(true);
    setTradeMessage('');

    try {
      const accessToken = await getAccessToken();

      const response = await fetch('/api/admin/trade-outcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userEmail: userEmail,
          outcome: outcome
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTradeMessage(`Successfully set ${outcome} for ${userEmail}`);
        // Refresh the trade data
        // You can add a function to refresh the trade list here
      } else {
        setTradeMessage(`Error: ${data.error || 'Failed to set trade outcome'}`);
      }
    } catch (error) {
      setTradeMessage(`Error: ${error.message}`);
    } finally {
      setProcessingTrade(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuth) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Go Back to Admin Panel
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Signed in • Admin</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Manage user accounts, balances, and permissions</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex flex-wrap space-x-2 sm:space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'withdrawals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Withdrawal Management
            </button>
            <button
              onClick={() => setActiveTab('winloss')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'winloss'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Win/Loss Management
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border rounded" onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) loadUsers(session, page, limit)
                }}>Refresh</button>
                <select className="border rounded px-2 py-1" value={limit} onChange={async (e) => {
                  const lim = parseInt(e.target.value, 10) || 20
                  setLimit(lim)
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) loadUsers(session, 1, lim)
                  setPage(1)
                }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            {error && (
              <div className="px-4 sm:px-6 py-2 text-sm text-red-600">{error}</div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'email', label: 'Email' },
                      { key: 'role', label: 'Role' },
                      { key: 'status', label: 'Status' },
                      { key: 'created_at', label: 'Created' },
                    ].map(col => (
                      <th key={col.key} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button className="flex items-center space-x-1" onClick={() => {
                          if (sortKey === col.key) setSortAsc(!sortAsc); else { setSortKey(col.key); setSortAsc(true); }
                        }}>
                          <span>{col.label}</span>
                          <span className="text-gray-400">{sortKey === col.key ? (sortAsc ? '▲' : '▼') : ''}</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users
                    .slice()
                    .sort((a, b) => {
                      const va = (a[sortKey] || '').toString().toLowerCase()
                      const vb = (b[sortKey] || '').toString().toLowerCase()
                      if (va < vb) return sortAsc ? -1 : 1
                      if (va > vb) return sortAsc ? 1 : -1
                      return 0
                    })
                    .map((u) => (
                      <tr key={u.id}>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 break-all">{u.email}</td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">{u.role}</td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">{u.status || 'active'}</td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{new Date(u.created_at).toLocaleString()}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between border-t">
              <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={async () => {
                if (page <= 1) return; const { data: { session } } = await supabase.auth.getSession(); if (session) { const p = page - 1; setPage(p); loadUsers(session, p, limit) }
              }} disabled={page <= 1}>Prev</button>
              <div className="text-sm">Page {page}</div>
              <button className="px-3 py-1 border rounded" onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession(); if (session) { const p = page + 1; setPage(p); loadUsers(session, p, limit) }
              }}>Next</button>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Withdrawal Management</h2>
              <p className="text-sm text-gray-600 mt-1">Manage user withdrawal requests and approvals</p>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Withdrawal Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-gray-900">156</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-2xl font-bold text-gray-900">8</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">$45,230</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Requests Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Withdrawal Requests</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">J</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">john.doe@example.com</div>
                              <div className="text-sm text-gray-500">ID: 12345</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          $1,250.00
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024-01-15 14:30
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-green-600 hover:text-green-900 mr-3">Approve</button>
                          <button className="text-red-600 hover:text-red-900">Reject</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">S</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">sarah.smith@example.com</div>
                              <div className="text-sm text-gray-500">ID: 12346</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          $850.00
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024-01-14 09:15
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="text-gray-400">Completed</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'winloss' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Win/Loss Management</h2>
              <p className="text-sm text-gray-600 mt-1">Control trade outcomes and monitor performance</p>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Win/Loss Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Wins</p>
                      <p className="text-2xl font-bold text-gray-900">1,234</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Losses</p>
                      <p className="text-2xl font-bold text-gray-900">567</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Win Rate</p>
                      <p className="text-2xl font-bold text-gray-900">68.5%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total P&L</p>
                      <p className="text-2xl font-bold text-gray-900">$12,450</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Trades Section */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="text-lg font-medium text-orange-800">Pending Trades</h3>
                    <p className="text-sm text-orange-700 mt-1">Trades waiting for admin decision or auto-completion</p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-orange-200">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                          Order No.
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                          Currency
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                          Trade Type
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                          Leverage
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                          Time Left
                        </th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-orange-50 divide-y divide-orange-200">
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                          ORD-1733667108000-ABC12
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white text-xs font-medium">J</span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">john.doe@example.com</div>
                              <div className="text-xs text-gray-500">ID: 12345</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          BTC/USDT
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Buy Up
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          $500.00
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            5x
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          60 seconds
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-medium">
                          <span className="countdown">45s</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button 
                            className="text-green-600 hover:text-green-900 mr-2 text-xs"
                            onClick={() => handleSetIndividualTradeOutcome('john.doe@example.com', 'win')}
                            disabled={processingTrade}
                          >
                            Win
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 text-xs"
                            onClick={() => handleSetIndividualTradeOutcome('john.doe@example.com', 'loss')}
                            disabled={processingTrade}
                          >
                            Loss
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                          ORD-1733667108001-XYZ34
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white text-xs font-medium">S</span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">sarah.smith@example.com</div>
                              <div className="text-xs text-gray-500">ID: 12346</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          ETH/USDT
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Buy Down
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          $300.00
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            10x
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          120 seconds
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-medium">
                          <span className="countdown">1m 15s</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button 
                            className="text-green-600 hover:text-green-900 mr-2 text-xs"
                            onClick={() => handleSetIndividualTradeOutcome('sarah.smith@example.com', 'win')}
                            disabled={processingTrade}
                          >
                            Win
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 text-xs"
                            onClick={() => handleSetIndividualTradeOutcome('sarah.smith@example.com', 'loss')}
                            disabled={processingTrade}
                          >
                            Loss
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Manual Win/Loss Control */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-yellow-800">Manual Trade Control</h3>
                    <p className="text-sm text-yellow-700 mt-1">Select a user and manually set their trade outcome</p>
                  </div>
                  <div className="flex space-x-3">
                    <select 
                      className="px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Select User</option>
                      <option value="john.doe@example.com">john.doe@example.com</option>
                      <option value="sarah.smith@example.com">sarah.smith@example.com</option>
                      <option value="mike.wilson@example.com">mike.wilson@example.com</option>
                    </select>
                    <button 
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                      onClick={() => handleSetTradeOutcome('win')}
                      disabled={!selectedUser || processingTrade}
                    >
                      {processingTrade ? 'Processing...' : 'Set Win'}
                    </button>
                    <button 
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                      onClick={() => handleSetTradeOutcome('loss')}
                      disabled={!selectedUser || processingTrade}
                    >
                      {processingTrade ? 'Processing...' : 'Set Loss'}
                    </button>
                  </div>
                </div>
                {tradeMessage && (
                  <div className={`mt-3 p-2 rounded-md text-sm ${
                    tradeMessage.includes('Error') 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {tradeMessage}
                  </div>
                )}
              </div>

              {/* Win/Loss Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Trading Activity</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Currency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trade Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Leverage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Result
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          P&L
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          ORD-1733667108000-ABC12
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">J</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">john.doe@example.com</div>
                              <div className="text-sm text-gray-500">ID: 12345</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          BTC/USDT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Buy Up
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          $500.00
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            5x
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Win
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          +$1,125.00
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024-01-15 15:30
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          ORD-1733667108001-XYZ34
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">S</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">sarah.smith@example.com</div>
                              <div className="text-sm text-gray-500">ID: 12346</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ETH/USDT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Buy Down
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          $300.00
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            10x
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Loss
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          -$300.00
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024-01-15 14:45
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          ORD-1733667108002-DEF56
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">M</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">mike.wilson@example.com</div>
                              <div className="text-sm text-gray-500">ID: 12347</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ADA/USDT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Buy Up
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          $750.00
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            3x
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Win
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          +$1,312.50
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024-01-15 13:20
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 

export async function getServerSideProps({ req }) {
  try {
    const cookie = req.headers['cookie'] || ''
    const match = cookie.match(/sb-access-token=([^;]+)/)
    const token = match ? decodeURIComponent(match[1]) : null
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (!token || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return { redirect: { destination: '/admin/login', permanent: false } }
    }
    const { createClient } = require('@supabase/supabase-js')
    const server = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: authData } = await server.auth.getUser(token)
    const userId = authData?.user?.id
    if (!userId) return { redirect: { destination: '/admin/login', permanent: false } }
    const { data: me } = await server.from('users').select('role').eq('id', userId).single()
    if (me?.role !== 'admin') return { redirect: { destination: '/admin/login', permanent: false } }
    return { props: {} }
  } catch {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
}