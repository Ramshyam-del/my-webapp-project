'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        router.push('/admin/login');
      } else if (event === 'SIGNED_IN' && session) {
        verifyAdminAccess(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('No session found, redirecting to login');
        // Add a small delay to prevent immediate redirect loops
        setTimeout(() => {
          router.push('/admin/login');
        }, 100);
        return;
      }

      await verifyAdminAccess(session);
    } catch (error) {
      console.error('Auth check failed:', error);
      setTimeout(() => {
        router.push('/admin/login');
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAdminAccess = async (session) => {
    try {
      // Verify admin role by calling backend
      const response = await fetch('/api/admin/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.user && data.user.role === 'admin') {
          setIsAuthenticated(true);
        } else {
          console.log('User is not admin, redirecting to login');
          await supabase.auth.signOut();
          router.push('/admin/login');
        }
      } else {
        console.log('Admin verification failed, redirecting to login');
        await supabase.auth.signOut();
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Admin verification error:', error);
      router.push('/admin/login');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return children;
}