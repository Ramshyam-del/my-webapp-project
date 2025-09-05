import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { hybridFetch, checkHybridAuth } from '../lib/hybridFetch';

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
        
        // Check if user is authenticated by calling /me endpoint
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [Init] Checking auth with:', `${API_BASE_URL}/api/auth/me`);
        }
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include', // Include cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!isMounted) return;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [Init] Auth response status:', response.status);
        }
        
        if (response.ok) {
          const data = await response.json();
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [Init] Auth response data:', data);
          }
          if (data.ok && data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ [Init] Auth successful, user:', data.user.email);
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
            if (process.env.NODE_ENV === 'development') {
              console.log('❌ [Init] Auth failed - no user in response');
            }
          }
        } else {
          // No valid token or user not found
          setUser(null);
          setIsAuthenticated(false);
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ [Init] Auth failed with status:', response.status);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth initialization error:', error);
        }
        setError(error.message);
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
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
      
      // Use hybridFetch for consistency
      const response = await hybridFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          phone: userData.phone
        })
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext: Backend signUp response:', response.data);
      }
      
      // Registration successful - user needs to verify email
      // Don't set session yet, wait for email verification
      return { success: true, data: response.data };
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
      
      // Use hybridFetch for consistency
      const response = await hybridFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext: Backend signIn response:', response.data);
      }

      // Set user data from backend response (JWT tokens are in cookies)
      if (response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthContext: Sign in successful, user:', response.data.user);
        }
      }
      
      return { success: true, data: response.data };
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
      // Use hybridFetch for consistency
      await hybridFetch('/api/auth/logout', {
        method: 'POST'
      });
      
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
      const response = await hybridFetch('/api/auth/me');
      
      if (response.data && response.data.ok && response.data.user) {
        setUser(response.data.user);
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

  // Refresh user data from backend
  const refreshUser = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('🔍 [Refresh] Checking auth with hybridFetch');
      const response = await hybridFetch('/api/auth/me');

      console.log('🔍 [Refresh] Auth response:', response);
      
      if (response.data && response.data.ok && response.data.user) {
        setUser(response.data.user);
        console.log('✅ [Refresh] Auth successful, user:', response.data.user.email);
        return response.data.user;
      } else {
        // Token might be expired, clear auth state
        setUser(null);
        setIsAuthenticated(false);
        console.log('❌ [Refresh] Auth failed - no user in response');
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