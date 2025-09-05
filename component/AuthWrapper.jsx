import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function AuthWrapper({ children, requireAuth = true, requireAdmin = false }) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!requireAuth && !requireAdmin) return;
    if (loading) return; // Wait for auth to complete

    if (!isAuthenticated || !user) {
      // User is not authenticated, redirect to home
      router.push('/');
    } else if (requireAdmin && user.role !== 'admin') {
      // User is authenticated but not admin, redirect to exchange
      router.push('/exchange');
    }
  }, [user, isAuthenticated, loading, requireAuth, requireAdmin, router]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect to home page
  }

  if (requireAdmin && !isAdmin) {
    return null; // Will redirect to exchange
  }

  return children;
}