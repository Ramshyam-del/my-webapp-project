"use client"

import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function AdminTopbar({ title }) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* User menu */}
        <div className="flex items-center space-x-4">
          {!loading && user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-medium text-gray-900">{user.email}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}