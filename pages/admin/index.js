'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { authedFetchJson } from '../../lib/authedFetch';
import AdminLayout from '../../component/AdminLayout';
import AdminDashboard from '../../component/AdminDashboard';
import AdminAuthGuard from '../../component/AdminAuthGuard';

export default function AdminHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/admin/login');
        return;
      }

      // Verify admin access
      await authedFetchJson('/api/admin/me');
      
      // If we get here, user is authenticated and is admin
      setLoading(false);
    } catch (err) {
      console.error('Auth check failed:', err);
      
      if (err.code === 'unauthorized' || err.code === 'forbidden') {
        // User is not admin or not authenticated
        await supabase.auth.signOut();
        router.replace('/admin/login');
      } else {
        setError('Failed to verify admin access. Please try again.');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Admin Dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminAuthGuard>
      <AdminLayout title="Admin Dashboard">
        <AdminDashboard />
      </AdminLayout>
    </AdminAuthGuard>
  );
}


