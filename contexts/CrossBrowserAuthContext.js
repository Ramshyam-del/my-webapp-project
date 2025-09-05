/**
 * Cross-Browser Authentication Context
 * Provides authentication state and methods throughout the React application
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCrossBrowserAuth } from '../hooks/useCrossBrowserAuth';
import crossBrowserAuth from '../services/crossBrowserAuth';

// Create the context
const CrossBrowserAuthContext = createContext({
  // Auth state
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  sessionToken: null,
  allSessions: [],
  error: null,
  
  // Auth methods
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  updateUser: async () => ({ success: false }),
  
  // Session methods
  loadAllSessions: async () => {},
  invalidateSession: async () => ({ success: false }),
  invalidateOtherSessions: async () => ({ success: false }),
  
  // Utility methods
  clearError: () => {},
  
  // Cross-browser specific
  crossBrowserAuth: null
});

/**
 * Cross-Browser Authentication Provider Component
 */
export function CrossBrowserAuthProvider({ children }) {
  const authHook = useCrossBrowserAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cross-browser auth service
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await crossBrowserAuth.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize cross-browser auth:', error);
        setIsInitialized(true); // Still set to true to prevent infinite loading
      }
    };

    initializeAuth();
  }, []);

  // Context value
  const contextValue = {
    ...authHook,
    crossBrowserAuth,
    isInitialized
  };

  return (
    <CrossBrowserAuthContext.Provider value={contextValue}>
      {children}
    </CrossBrowserAuthContext.Provider>
  );
}

/**
 * Hook to use the Cross-Browser Authentication Context
 */
export function useCrossBrowserAuthContext() {
  const context = useContext(CrossBrowserAuthContext);
  
  if (context === undefined) {
    throw new Error('useCrossBrowserAuthContext must be used within a CrossBrowserAuthProvider');
  }
  
  return context;
}

/**
 * Higher-Order Component for authentication protection
 */
export function withCrossBrowserAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useCrossBrowserAuthContext();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to access this page.</p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}

/**
 * Component for displaying authentication status
 */
export function AuthStatus({ className = '' }) {
  const { 
    isAuthenticated, 
    user, 
    loading, 
    allSessions, 
    error,
    signOut,
    clearError,
    invalidateOtherSessions
  } = useCrossBrowserAuthContext();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        Not authenticated
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex justify-between items-start">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900">
            {user?.email || 'Authenticated'}
          </span>
        </div>
        
        <button
          onClick={signOut}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Sign Out
        </button>
      </div>
      
      {allSessions.length > 1 && (
        <div className="text-xs text-gray-500">
          <span>{allSessions.length} active sessions</span>
          <button
            onClick={invalidateOtherSessions}
            className="ml-2 text-blue-600 hover:text-blue-800"
          >
            Sign out others
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Component for displaying session list
 */
export function SessionList({ className = '' }) {
  const { 
    allSessions, 
    sessionToken, 
    invalidateSession,
    loadAllSessions 
  } = useCrossBrowserAuthContext();
  
  const [loading, setLoading] = useState(false);

  const handleInvalidateSession = async (sessionId) => {
    setLoading(true);
    try {
      await invalidateSession(sessionId);
    } catch (error) {
      console.error('Error invalidating session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await loadAllSessions();
    } catch (error) {
      console.error('Error refreshing sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!allSessions.length) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No active sessions
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900">
          Active Sessions ({allSessions.length})
        </h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="space-y-2">
        {allSessions.map((session) => {
          const isCurrent = session.sessionToken === sessionToken;
          const deviceInfo = session.deviceInfo || {};
          
          return (
            <div
              key={session.id}
              className={`p-3 rounded-lg border ${
                isCurrent 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {isCurrent && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {deviceInfo.platform || 'Unknown Platform'}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-500 space-y-1">
                    <div>Created: {new Date(session.createdAt).toLocaleString()}</div>
                    <div>Last Active: {new Date(session.lastActivityAt).toLocaleString()}</div>
                    {deviceInfo.userAgent && (
                      <div className="truncate" title={deviceInfo.userAgent}>
                        {deviceInfo.userAgent.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                </div>
                
                {!isCurrent && (
                  <button
                    onClick={() => handleInvalidateSession(session.id)}
                    disabled={loading}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CrossBrowserAuthContext;