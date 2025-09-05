/**
 * BroadcastChannel Service for Cross-Browser Communication
 * Handles real-time state synchronization across browser instances
 */

class BroadcastService {
  constructor() {
    this.channels = new Map();
    this.listeners = new Map();
    this.isSupported = typeof BroadcastChannel !== 'undefined';
    this.fallbackStorage = new Map();
    
    if (!this.isSupported) {
      console.warn('BroadcastChannel not supported, using localStorage fallback');
      this.initStorageFallback();
    }
  }

  /**
   * Create or get a broadcast channel
   */
  getChannel(channelName) {
    if (!this.channels.has(channelName)) {
      if (this.isSupported) {
        const channel = new BroadcastChannel(channelName);
        this.channels.set(channelName, channel);
      } else {
        // Fallback for browsers without BroadcastChannel support
        this.channels.set(channelName, {
          postMessage: (data) => this.postMessageFallback(channelName, data),
          addEventListener: (event, callback) => this.addListenerFallback(channelName, callback),
          removeEventListener: (event, callback) => this.removeListenerFallback(channelName, callback),
          close: () => this.closeChannelFallback(channelName)
        });
      }
    }
    return this.channels.get(channelName);
  }

  /**
   * Send message to all browser instances
   */
  broadcast(channelName, message) {
    try {
      const channel = this.getChannel(channelName);
      const payload = {
        type: message.type,
        data: message.data,
        timestamp: Date.now(),
        source: this.getInstanceId()
      };
      
      channel.postMessage(payload);
      return true;
    } catch (error) {
      console.error('Broadcast error:', error);
      return false;
    }
  }

  /**
   * Listen for messages on a channel
   */
  subscribe(channelName, callback) {
    try {
      const channel = this.getChannel(channelName);
      const wrappedCallback = (event) => {
        // Ignore messages from same instance
        if (event.data?.source === this.getInstanceId()) {
          return;
        }
        callback(event.data || event);
      };
      
      channel.addEventListener('message', wrappedCallback);
      
      // Store callback reference for cleanup
      if (!this.listeners.has(channelName)) {
        this.listeners.set(channelName, new Set());
      }
      this.listeners.get(channelName).add({ original: callback, wrapped: wrappedCallback });
      
      return () => this.unsubscribe(channelName, callback);
    } catch (error) {
      console.error('Subscribe error:', error);
      return () => {};
    }
  }

  /**
   * Remove listener from channel
   */
  unsubscribe(channelName, callback) {
    try {
      const channel = this.channels.get(channelName);
      const listeners = this.listeners.get(channelName);
      
      if (channel && listeners) {
        const listener = Array.from(listeners).find(l => l.original === callback);
        if (listener) {
          channel.removeEventListener('message', listener.wrapped);
          listeners.delete(listener);
        }
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  }

  /**
   * Close a specific channel
   */
  closeChannel(channelName) {
    try {
      const channel = this.channels.get(channelName);
      if (channel) {
        if (this.isSupported) {
          channel.close();
        }
        this.channels.delete(channelName);
        this.listeners.delete(channelName);
      }
    } catch (error) {
      console.error('Close channel error:', error);
    }
  }

  /**
   * Close all channels
   */
  closeAll() {
    try {
      for (const [channelName] of this.channels) {
        this.closeChannel(channelName);
      }
    } catch (error) {
      console.error('Close all channels error:', error);
    }
  }

  /**
   * Get unique instance ID
   */
  getInstanceId() {
    if (!this.instanceId) {
      this.instanceId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.instanceId;
  }

  /**
   * Initialize localStorage fallback for unsupported browsers
   */
  initStorageFallback() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('broadcast_')) {
          const channelName = event.key.replace('broadcast_', '');
          const listeners = this.listeners.get(channelName);
          
          if (listeners && event.newValue) {
            try {
              const data = JSON.parse(event.newValue);
              listeners.forEach(listener => {
                if (data.source !== this.getInstanceId()) {
                  listener.wrapped({ data });
                }
              });
            } catch (error) {
              console.error('Storage fallback parse error:', error);
            }
          }
        }
      });
    }
  }

  /**
   * Fallback postMessage using localStorage
   */
  postMessageFallback(channelName, data) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `broadcast_${channelName}`;
        window.localStorage.setItem(key, JSON.stringify(data));
        // Remove immediately to trigger storage event
        setTimeout(() => {
          try {
            window.localStorage.removeItem(key);
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 100);
      }
    } catch (error) {
      console.error('PostMessage fallback error:', error);
    }
  }

  /**
   * Fallback addEventListener using internal listeners
   */
  addListenerFallback(channelName, callback) {
    if (!this.listeners.has(channelName)) {
      this.listeners.set(channelName, new Set());
    }
    this.listeners.get(channelName).add({ original: callback, wrapped: callback });
  }

  /**
   * Fallback removeEventListener
   */
  removeListenerFallback(channelName, callback) {
    const listeners = this.listeners.get(channelName);
    if (listeners) {
      const listener = Array.from(listeners).find(l => l.original === callback);
      if (listener) {
        listeners.delete(listener);
      }
    }
  }

  /**
   * Fallback close channel
   */
  closeChannelFallback(channelName) {
    this.listeners.delete(channelName);
  }

  /**
   * Check if BroadcastChannel is supported
   */
  isChannelSupported() {
    return this.isSupported;
  }

  /**
   * Get active channels count
   */
  getActiveChannelsCount() {
    return this.channels.size;
  }

  /**
   * Get channel names
   */
  getChannelNames() {
    return Array.from(this.channels.keys());
  }
}

// Predefined channel names for the application
export const CHANNELS = {
  USER_SESSION: 'user_session',
  BALANCE_UPDATE: 'balance_update',
  TRADE_UPDATE: 'trade_update',
  NOTIFICATION: 'notification',
  CONFIG_UPDATE: 'config_update',
  AUTH_STATE: 'auth_state',
  PORTFOLIO_UPDATE: 'portfolio_update',
  MARKET_DATA: 'market_data'
};

// Message types for structured communication
export const MESSAGE_TYPES = {
  // Session management
  SESSION_CREATED: 'session_created',
  SESSION_UPDATED: 'session_updated',
  SESSION_EXPIRED: 'session_expired',
  SESSION_LOGOUT: 'session_logout',
  SESSION_SYNC: 'session_sync',
  
  // Authentication
  AUTH_STATE_CHANGED: 'auth_state_changed',
  AUTH_LOGIN: 'auth_login',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_TOKEN_REFRESH: 'auth_token_refresh',
  AUTH_USER_UPDATED: 'auth_user_updated',
  
  // Balance updates
  BALANCE_CHANGED: 'balance_changed',
  BALANCE_SYNC: 'balance_sync',
  
  // Trading
  TRADE_OPENED: 'trade_opened',
  TRADE_CLOSED: 'trade_closed',
  TRADE_UPDATED: 'trade_updated',
  
  // Notifications
  NOTIFICATION_NEW: 'notification_new',
  NOTIFICATION_READ: 'notification_read',
  
  // Configuration
  CONFIG_CHANGED: 'config_changed',
  THEME_CHANGED: 'theme_changed',
  
  // Portfolio
  PORTFOLIO_UPDATED: 'portfolio_updated',
  WATCHLIST_UPDATED: 'watchlist_updated',
  
  // Market data
  PRICE_UPDATE: 'price_update',
  MARKET_STATUS: 'market_status',
  
  // General
  DATA_SYNC: 'data_sync',
  HEARTBEAT: 'heartbeat'
};

// Create singleton instance
const broadcastService = new BroadcastService();

// Export both the class and singleton
export { BroadcastService };
export default broadcastService;

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    broadcastService.closeAll();
  });
}