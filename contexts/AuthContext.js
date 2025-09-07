import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Check if user is authenticated using Supabase
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [Init] Checking auth with Supabase');
        }
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!isMounted) return;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [Init] Auth response:', { user, error });
        }
        
        if (user && !error) {
          setUser(user);
          setIsAuthenticated(true);
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ [Init] Auth successful, user:', user.email);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ [Init] Auth failed - no user');
          }
        }
      } catch (error) {
        // Handle authentication errors gracefully during initialization
        if (error.code === 'unauthorized' || error.status === 401) {
          // This is expected when user is not logged in - don't treat as error
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️ [Init] No active session - user not authenticated');
          }
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
            setError(null); // Don't set error for expected unauthenticated state
          }
        } else {
          // Only log and set error for unexpected errors
          if (process.env.NODE_ENV === 'development') {
            console.error('Auth initialization error:', error);
          }
          setError(error.message);
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Sign up function with JWT backend
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      setError(null);
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext: signUp called with userData:', userData);
      }
      
      // Use Supabase for registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName || userData.first_name,
            last_name: userData.lastName || userData.last_name,
            username: userData.username,
            phone: userData.phone
          }
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext: Supabase signUp response:', { data, error });
      }
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Registration successful - user needs to verify email
      // Don't set session yet, wait for email verification
      return { success: true, data };
    } catch (error) {
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function with JWT backend
  const signIn = async (email, password) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext: Starting sign in process...');
      }
      setLoading(true);
      setError(null);
      
      // Clear any existing user profile data from localStorage before login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tempUserProfile');
        // Also clear any other user-specific cached data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('user') || key.includes('profile') || key.includes('portfolio'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Use Supabase for sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext: Supabase signIn response:', { data, error });
      }

      if (error) {
        throw new Error(error.message);
      }

      // Set user data from Supabase response
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthContext: Sign in successful, user:', data.user);
        }
      }
      
      return { success: true, data };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('AuthContext: Sign in error:', error);
      }
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function with JWT backend
  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use Supabase for sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear user-specific data from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tempUserProfile');
        // Clear any other user-specific cached data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('user') || key.includes('profile') || key.includes('portfolio'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      return { success: true };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign out error:', error);
      }
      // Clear local state even if logout fails
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear user-specific data from localStorage even if logout fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tempUserProfile');
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('user') || key.includes('profile') || key.includes('portfolio'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      return { success: true }; // Still return success since we cleared local state
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        setUser(user);
        setIsAuthenticated(true);
        return true;
      }
      
      // If we get here, authentication failed
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Refresh user data from Supabase
  const refreshUser = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('🔍 [Refresh] Checking auth with Supabase');
      const { data: { user }, error } = await supabase.auth.getUser();

      console.log('🔍 [Refresh] Auth response:', { user, error });
      
      if (user && !error) {
        setUser(user);
        console.log('✅ [Refresh] Auth successful, user:', user.email);
        return user;
      } else {
        // Token might be expired, clear auth state
        setUser(null);
        setIsAuthenticated(false);
        console.log('❌ [Refresh] Auth failed - no user');
        return null;
      }
    } catch (error) {
      console.error('❌ [Refresh] User refresh error:', error);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    checkAuth,
    refreshUser,
    isAuthenticated,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};