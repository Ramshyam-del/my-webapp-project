/**
 * Cross-Browser Authentication Service
 * Handles authentication synchronization across multiple browser instances
 */

import { supabase } from '../lib/supabase';
import broadcastService, { CHANNELS, MESSAGE_TYPES } from './broadcastService';

class CrossBrowserAuth {
  constructor() {
    this.isInitialized = false;
    this.currentSession = null;
    this.sessionToken = null;
    this.syncInProgress = false;
    this.authListeners = new Set();
    this.sessionListeners = new Set();
    
    // Bind methods
    this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
    this.handleSessionMessage = this.handleSessionMessage.bind(this);
    this.handleAuthMessage = this.handleAuthMessage.bind(this);
  }

  /**
   * Initialize cross-browser authentication
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set up Supabase auth state listener
      supabase.auth.onAuthStateChange(this.handleAuthStateChange);

      // Set up broadcast channel listeners
      this.setupBroadcastListeners();

      // Check for existing session
      await this.checkExistingSession();

      this.isInitialized = true;
      console.log('Cross-browser authentication initialized');
    } catch (error) {
      console.error('Failed to initialize cross-browser auth:', error);
    }
  }

  /**
   * Set up broadcast channel listeners for auth events
   */
  setupBroadcastListeners() {
    // Listen for session events
    broadcastService.subscribe(CHANNELS.USER_SESSION, this.handleSessionMessage);
    
    // Listen for auth state changes
    broadcastService.subscribe(CHANNELS.AUTH_STATE, this.handleAuthMessage);
  }

  /**
   * Handle Supabase auth state changes
   */
  async handleAuthStateChange(event, session) {
    if (this.syncInProgress) return;

    try {
      switch (event) {
        case 'SIGNED_IN':
          await this.handleSignIn(session);
          break;
        case 'SIGNED_OUT':
          await this.handleSignOut();
          break;
        case 'TOKEN_REFRESHED':
          await this.handleTokenRefresh(session);
          break;
        case 'USER_UPDATED':
          await this.handleUserUpdate(session);
          break;
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
    }
  }

  /**
   * Handle sign in event
   */
  async handleSignIn(session) {
    if (!session?.user) return;

    try {
      // Create cross-browser session
      const sessionResult = await this.createCrossBrowserSession(session);
      
      this.currentSession = session;
      this.sessionToken = sessionResult.sessionToken;

      // Broadcast login to other browser instances
      broadcastService.broadcast(CHANNELS.AUTH_STATE, {
        type: MESSAGE_TYPES.AUTH_LOGIN,
        data: {
          user: {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata
          },
          sessionToken: sessionResult.sessionToken,
          expiresAt: sessionResult.expiresAt
        }
      });

      // Notify listeners
      this.notifyAuthListeners('signed_in', session);

    } catch (error) {
      console.error('Error handling sign in:', error);
    }
  }

  /**
   * Handle sign out event
   */
  async handleSignOut() {
    try {
      const sessionToken = this.sessionToken;
      
      // Clear local session data
      this.currentSession = null;
      this.sessionToken = null;

      // Invalidate cross-browser session
      if (sessionToken) {
        await this.invalidateCrossBrowserSession(sessionToken);
      }

      // Broadcast logout to other browser instances
      broadcastService.broadcast(CHANNELS.AUTH_STATE, {
        type: MESSAGE_TYPES.AUTH_LOGOUT,
        data: { sessionToken }
      });

      // Notify listeners
      this.notifyAuthListeners('signed_out', null);

    } catch (error) {
      console.error('Error handling sign out:', error);
    }
  }

  /**
   * Handle token refresh event
   */
  async handleTokenRefresh(session) {
    if (!session?.access_token) return;

    try {
      this.currentSession = session;

      // Update session in backend
      if (this.sessionToken) {
        await this.updateCrossBrowserSession(this.sessionToken, {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: new Date(session.expires_at * 1000)
        });
      }

      // Broadcast token refresh to other browser instances
      broadcastService.broadcast(CHANNELS.AUTH_STATE, {
        type: MESSAGE_TYPES.AUTH_TOKEN_REFRESH,
        data: {
          accessToken: session.access_token,
          expiresAt: session.expires_at
        }
      });

      // Notify listeners
      this.notifyAuthListeners('token_refreshed', session);

    } catch (error) {
      console.error('Error handling token refresh:', error);
    }
  }

  /**
   * Handle user update event
   */
  async handleUserUpdate(session) {
    if (!session?.user) return;

    try {
      this.currentSession = session;

      // Broadcast user update to other browser instances
      broadcastService.broadcast(CHANNELS.AUTH_STATE, {
        type: MESSAGE_TYPES.AUTH_USER_UPDATED,
        data: {
          user: {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata
          }
        }
      });

      // Notify listeners
      this.notifyAuthListeners('user_updated', session);

    } catch (error) {
      console.error('Error handling user update:', error);
    }
  }

  /**
   * Handle session broadcast messages
   */
  handleSessionMessage(message) {
    if (!message?.type || !message?.data) return;

    switch (message.type) {
      case MESSAGE_TYPES.SESSION_CREATED:
        this.handleRemoteSessionCreated(message.data);
        break;
      case MESSAGE_TYPES.SESSION_EXPIRED:
        this.handleRemoteSessionExpired(message.data);
        break;
      case MESSAGE_TYPES.SESSION_LOGOUT:
        this.handleRemoteSessionLogout(message.data);
        break;
    }
  }

  /**
   * Handle auth broadcast messages
   */
  async handleAuthMessage(message) {
    if (!message?.type || !message?.data || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      switch (message.type) {
        case MESSAGE_TYPES.AUTH_LOGIN:
          await this.handleRemoteLogin(message.data);
          break;
        case MESSAGE_TYPES.AUTH_LOGOUT:
          await this.handleRemoteLogout(message.data);
          break;
        case MESSAGE_TYPES.AUTH_TOKEN_REFRESH:
          await this.handleRemoteTokenRefresh(message.data);
          break;
      }
    } catch (error) {
      console.error('Error handling auth message:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Handle remote login from another browser
   */
  async handleRemoteLogin(data) {
    try {
      // Check if we're already signed in with the same user
      const currentSession = await supabase.auth.getSession();
      
      if (currentSession.data.session?.user?.id === data.user.id) {
        console.log('Already signed in with same user');
        return;
      }

      // If different user or not signed in, sync the session
      if (data.sessionToken) {
        await this.syncSessionFromToken(data.sessionToken);
      }

    } catch (error) {
      console.error('Error handling remote login:', error);
    }
  }

  /**
   * Handle remote logout from another browser
   */
  async handleRemoteLogout(data) {
    try {
      // Check if this logout affects our session
      if (data.sessionToken === this.sessionToken) {
        console.log('Session invalidated by another browser');
        await supabase.auth.signOut();
      }

    } catch (error) {
      console.error('Error handling remote logout:', error);
    }
  }

  /**
   * Handle remote token refresh from another browser
   */
  async handleRemoteTokenRefresh(data) {
    try {
      // Update local session if needed
      const currentSession = await supabase.auth.getSession();
      
      if (currentSession.data.session && 
          currentSession.data.session.expires_at < data.expiresAt) {
        // Our token is older, refresh it
        await supabase.auth.refreshSession();
      }

    } catch (error) {
      console.error('Error handling remote token refresh:', error);
    }
  }

  /**
   * Create cross-browser session
   */
  async createCrossBrowserSession(session) {
    try {
      // Temporary fallback: Skip server-side session creation if table doesn't exist
      // and use local session management instead
      console.log('Attempting to create cross-browser session...');
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: Date.now()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Server-side session creation failed, using fallback:', errorData);
        
        // Fallback: Create a local session token
        const fallbackToken = this.generateFallbackSessionToken();
        return {
          success: true,
          sessionToken: fallbackToken,
          sessionId: `fallback-${Date.now()}`,
          expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)),
          fallback: true
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating cross-browser session, using fallback:', error);
      
      // Fallback: Create a local session token
      const fallbackToken = this.generateFallbackSessionToken();
      return {
        success: true,
        sessionToken: fallbackToken,
        sessionId: `fallback-${Date.now()}`,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)),
        fallback: true
      };
    }
  }

  /**
   * Generate a fallback session token for local use
   */
  generateFallbackSessionToken() {
    return 'fallback-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Update cross-browser session
   */
  async updateCrossBrowserSession(sessionToken, sessionData) {
    try {
      // Skip server sync for fallback sessions
      if (sessionToken && sessionToken.startsWith('fallback-')) {
        console.log('Skipping server sync for fallback session');
        return { success: true, fallback: true };
      }
      
      const response = await fetch('/api/sessions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({ sessionData })
      });

      if (!response.ok) {
        console.warn('Failed to update cross-browser session, continuing with local session');
        return { success: true, fallback: true };
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating cross-browser session, continuing with local session:', error);
      return { success: true, fallback: true };
    }
  }

  /**
   * Invalidate cross-browser session
   */
  async invalidateCrossBrowserSession(sessionToken) {
    try {
      // Skip server invalidation for fallback sessions
      if (sessionToken && sessionToken.startsWith('fallback-')) {
        console.log('Skipping server invalidation for fallback session');
        return { success: true, fallback: true };
      }
      
      const response = await fetch('/api/sessions/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        }
      });

      if (!response.ok) {
        console.warn('Failed to invalidate cross-browser session, continuing with local cleanup');
        return { success: true, fallback: true };
      }

      return await response.json();
    } catch (error) {
      console.error('Error invalidating cross-browser session, continuing with local cleanup:', error);
      return { success: true, fallback: true };
    }
  }

  /**
   * Sync session from token
   */
  async syncSessionFromToken(sessionToken) {
    try {
      const response = await fetch('/api/sessions/sync', {
        method: 'GET',
        headers: {
          'X-Session-Token': sessionToken
        }
      });

      if (!response.ok) {
        throw new Error('Failed to sync session');
      }

      const sessionData = await response.json();
      
      if (sessionData.accessToken) {
        // Set the session in Supabase
        await supabase.auth.setSession({
          access_token: sessionData.accessToken,
          refresh_token: sessionData.refreshToken
        });
      }

    } catch (error) {
      console.error('Error syncing session from token:', error);
    }
  }

  /**
   * Check for existing session on initialization
   */
  async checkExistingSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Try to get existing cross-browser session
        const sessionResult = await this.createCrossBrowserSession(session);
        this.currentSession = session;
        this.sessionToken = sessionResult.sessionToken;
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
  }

  /**
   * Add auth state listener
   */
  addAuthListener(callback) {
    this.authListeners.add(callback);
    return () => this.authListeners.delete(callback);
  }

  /**
   * Add session listener
   */
  addSessionListener(callback) {
    this.sessionListeners.add(callback);
    return () => this.sessionListeners.delete(callback);
  }

  /**
   * Notify auth listeners
   */
  notifyAuthListeners(event, session) {
    this.authListeners.forEach(callback => {
      try {
        callback(event, session);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  /**
   * Notify session listeners
   */
  notifySessionListeners(event, data) {
    this.sessionListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }

  /**
   * Get current session info
   */
  getCurrentSession() {
    return {
      session: this.currentSession,
      sessionToken: this.sessionToken,
      isAuthenticated: !!this.currentSession
    };
  }

  /**
   * Get all user sessions
   */
  async getAllSessions() {
    try {
      if (!this.sessionToken) {
        return [];
      }

      const response = await fetch('/api/sessions', {
        method: 'GET',
        headers: {
          'X-Session-Token': this.sessionToken
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    broadcastService.closeChannel(CHANNELS.USER_SESSION);
    broadcastService.closeChannel(CHANNELS.AUTH_STATE);
    this.authListeners.clear();
    this.sessionListeners.clear();
    this.isInitialized = false;
  }
}

// Create singleton instance
const crossBrowserAuth = new CrossBrowserAuth();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  crossBrowserAuth.initialize();
}

export default crossBrowserAuth;
export { CrossBrowserAuth };

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    crossBrowserAuth.cleanup();
  });
}