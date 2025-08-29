'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { authedFetchJson } from '../../lib/authedFetch';
import AdminLayout from '../../component/AdminLayout';
import PageHeader from '../../component/PageHeader';
import UserList from '../../component/UserList';
import ErrorBoundary from '../../component/ErrorBoundary';

// Dynamic import for WithdrawalsList to prevent SSR issues
const WithdrawalsList = dynamic(() => import('../../component/WithdrawalsList'), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-gray-500">Loading withdrawals...</div>,
});

// Dynamic import for TradesList to prevent SSR issues
const TradesList = dynamic(() => import('../../component/TradesList'), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-gray-500">Loading trades...</div>,
});

export default function AdminUsers() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set active tab from URL query parameter
    if (router.query.tab) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 'users':
          await loadUsers();
          break;
        case 'withdrawals':
          await loadWithdrawals();
          break;
        case 'winloss':
          await loadTrades();
          break;
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authedFetchJson('/api/admin/users');
      setUsers(response?.data?.items ?? []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
      
      if (err.status === 401) {
        router.push('/admin');
        return;
      }
      
      if (err.message) {
        setError(err.message);
      }
    }
  };

  const loadWithdrawals = async () => {
    try {
      const response = await authedFetchJson('/api/admin/withdrawals');
      setWithdrawals(response?.data?.items ?? []);
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
      setWithdrawals([]);
      
      if (err.status === 401) {
        router.push('/admin');
        return;
      }
      
      if (err.message) {
        setError(err.message);
      }
    }
  };

  const loadTrades = async () => {
    try {
      setError(null); // Clear any previous errors
      const response = await authedFetchJson('/api/admin/trades');
      
      // Check if response is valid
      if (response && response.ok && response.data) {
        setTrades(response.data.items ?? []);
      } else {
        // If response is not in expected format, treat as empty
        console.warn('Unexpected trades response format:', response);
        setTrades([]);
      }
    } catch (err) {
      console.error('Failed to load trades:', err);
      setTrades([]);
      
      if (err.status === 401) {
        router.push('/admin');
        return;
      }
      
      // Only set error if it's a real error, not just empty data
      if (err.code === 'forbidden') {
        setError('Access denied: Not an admin user');
      } else if (err.code === 'timeout') {
        setError('Request timeout. Please try again.');
      } else if (err.message && err.message !== 'Failed to get trades') {
        setError(err.message);
      } else {
        // Don't set error for network issues or empty data
        setError(null);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/admin/users?tab=${tab}`, undefined, { shallow: true });
  };

  const renderUsersTab = () => (
    <ErrorBoundary>
      <UserList />
    </ErrorBoundary>
  );

  const renderWithdrawalsTab = () => (
    <ErrorBoundary>
      <WithdrawalsList />
    </ErrorBoundary>
  );

  const renderWinLossTab = () => (
    <ErrorBoundary>
      <TradesList />
    </ErrorBoundary>
  );

  return (
    <AdminLayout title="User Management">
      <PageHeader 
        title="User Management" 
        description="View and manage all user accounts, withdrawals, and trades"
      >
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 sm:ml-3 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-red-800">Error</h3>
                <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {[
              { id: 'users', name: 'Users' },
              { id: 'withdrawals', name: 'Withdrawals' },
              { id: 'winloss', name: 'Win/Loss' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  py-2.5 sm:py-2 px-3 sm:px-4 lg:px-1 border-b-2 font-medium text-sm whitespace-nowrap touch-manipulation transition-colors min-w-0 flex-shrink-0
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'withdrawals' && renderWithdrawalsTab()}
        {activeTab === 'winloss' && renderWinLossTab()}
      </PageHeader>
    </AdminLayout>
  );
}
