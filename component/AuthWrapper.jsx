import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function AuthWrapper({ children, requireAuth = true, requireAdmin = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await checkUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
          if (requireAuth) {
            router.push('/login');
          }
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [requireAuth, requireAdmin]);

  const checkUser = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && requireAuth) {
        router.push('/login');
        return;
      }

      if (session) {
        setUser(session.user);
        
        // Check if user is admin
        if (requireAdmin) {
          const { data: { user: userData } } = await supabase.auth.getUser();
          const isUserAdmin = userData?.user_metadata?.role === 'admin';
          console.log('Admin check:', { userData, isUserAdmin });
          setIsAdmin(isUserAdmin);
          
          if (!isUserAdmin) {
            console.log('User is not admin, redirecting to dashboard');
            router.push('/dashboard');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      if (requireAuth) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect to login
  }

  if (requireAdmin && !isAdmin) {
    return null; // Will redirect to dashboard
  }

  return children;
} 