/**
 * React Hook for Cross-Browser Authentication
 * Provides authentication state and methods with cross-browser synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import crossBrowserAuth from '../services/crossBrowserAuth';
import { supabase } from '../lib/supabase';

/**
 * Main cross-browser authentication hook
 */
export function useCrossBrowserAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [error, setError] = useState(null);
  
  const authListenerRef = useRef(null);
  const sessionListenerRef = useRef(null);

  // Handle auth state changes
  const handleAuthStateChange = useCallback((event, session) => {
    console.log('Auth state changed:', event, session);
    
    setSession(session);
    setUser(session?.user || null);
    setIsAuthenticated(!!session?.user);
    setLoading(false);
    setError(null);

    // Update session token from cross-browser auth
    const currentSessionInfo = crossBrowserAuth.getCurrentSession();
    setSessionToken(currentSessionInfo.sessionToken);
  }, []);

  // Handle session events
  const handleSessionEvent = useCallback((event, data) => {
    console.log('Session event:', event, data);
    
    switch (event) {
      case 'sessions_updated':
        setAllSessions(data.sessions || []);
        break;
      case 'session_expired':
        setError('Session expired. Please sign in again.');
        break;
      case 'session_conflict':
        setError('Session conflict detected. Please refresh the page.');
        break;
    }
  }, []);

  // Initialize authentication
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Ensure cross-browser auth is initialized
        await crossBrowserAuth.initialize();

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Error getting session:', error);
            setError(error.message);
          } else {
            setSession(session);
            setUser(session?.user || null);
            setIsAuthenticated(!!session?.user);
            
            // Get session token from cross-browser auth
            const currentSessionInfo = crossBrowserAuth.getCurrentSession();
            setSessionToken(currentSessionInfo.sessionToken);
          }
          setLoading(false);
        }

        // Set up listeners
        if (mounted) {
          authListenerRef.current = crossBrowserAuth.addAuthListener(handleAuthStateChange);
          sessionListenerRef.current = crossBrowserAuth.addSessionListener(handleSessionEvent);
        }

      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (authListenerRef.current) {
        authListenerRef.current();
      }
      if (sessionListenerRef.current) {
        sessionListenerRef.current();
      }
    };
  }, [handleAuthStateChange, handleSessionEvent]);

  // Load all sessions when authenticated
  useEffect(() => {
    if (isAuthenticated && sessionToken) {
      loadAllSessions();
    } else {
      setAllSessions([]);
    }
  }, [isAuthenticated, sessionToken]);

  // Sign in method
  const signIn = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up method
  const signUp = useCallback(async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out method
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password method
  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user metadata
  const updateUser = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update user error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all user sessions
  const loadAllSessions = useCallback(async () => {
    try {
      const sessions = await crossBrowserAuth.getAllSessions();
      setAllSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, []);

  // Invalidate specific session
  const invalidateSession = useCallback(async (sessionId) => {
    try {
      if (!sessionToken) return { success: false, error: 'No active session' };

      const response = await fetch('/api/sessions/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to invalidate session');
      }

      // Reload sessions
      await loadAllSessions();
      
      return { success: true };
    } catch (error) {
      console.error('Error invalidating session:', error);
      return { success: false, error: error.message };
    }
  }, [sessionToken, loadAllSessions]);

  // Invalidate all other sessions
  const invalidateOtherSessions = useCallback(async () => {
    try {
      if (!sessionToken) return { success: false, error: 'No active session' };

      const response = await fetch('/api/sessions/invalidate-others', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        }
      });

      if (!response.ok) {
        throw new Error('Failed to invalidate other sessions');
      }

      // Reload sessions
      await loadAllSessions();
      
      return { success: true };
    } catch (error) {
      console.error('Error invalidating other sessions:', error);
      return { success: false, error: error.message };
    }
  }, [sessionToken, loadAllSessions]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    session,
    user,
    loading,
    isAuthenticated,
    sessionToken,
    allSessions,
    error,
    
    // Methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUser,
    loadAllSessions,
    invalidateSession,
    invalidateOtherSessions,
    clearError
  };
}

/**
 * Hook for session management only
 */
export function useSessionManager() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const sessionListenerRef = useRef(null);

  useEffect(() => {
    const handleSessionEvent = (event, data) => {
      switch (event) {
        case 'sessions_updated':
          setSessions(data.sessions || []);
          break;
        case 'current_session_updated':
          setCurrentSession(data.session);
          break;
      }
    };

    sessionListenerRef.current = crossBrowserAuth.addSessionListener(handleSessionEvent);

    // Load initial data
    const currentSessionInfo = crossBrowserAuth.getCurrentSession();
    setCurrentSession(currentSessionInfo);

    return () => {
      if (sessionListenerRef.current) {
        sessionListenerRef.current();
      }
    };
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const sessions = await crossBrowserAuth.getAllSessions();
      setSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sessions,
    currentSession,
    loading,
    loadSessions
  };
}

/**
 * Hook for authentication status only (lightweight)
 */
export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const authListenerRef = useRef(null);

  useEffect(() => {
    const handleAuthStateChange = (event, session) => {
      setIsAuthenticated(!!session?.user);
      setUser(session?.user || null);
      setLoading(false);
    };

    authListenerRef.current = crossBrowserAuth.addAuthListener(handleAuthStateChange);

    // Get initial state
    const currentSessionInfo = crossBrowserAuth.getCurrentSession();
    setIsAuthenticated(currentSessionInfo.isAuthenticated);
    setUser(currentSessionInfo.session?.user || null);
    setLoading(false);

    return () => {
      if (authListenerRef.current) {
        authListenerRef.current();
      }
    };
  }, []);

  return {
    isAuthenticated,
    user,
    loading
  };
}

export default useCrossBrowserAuth;