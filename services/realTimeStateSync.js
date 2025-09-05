/**
 * Real-Time State Synchronization Service
 * Handles synchronization of user preferences, balances, and application state across browser instances
 */

import broadcastService, { CHANNELS, MESSAGE_TYPES } from './broadcastService';
import crossBrowserAuth from './crossBrowserAuth';
import { supabase } from '../lib/supabase';

class RealTimeStateSync {
  constructor() {
    this.isInitialized = false;
    this.syncInProgress = false;
    this.stateListeners = new Map();
    this.syncQueue = [];
    this.debounceTimers = new Map();
    this.lastSyncTimestamps = new Map();
    
    // State categories
    this.STATE_CATEGORIES = {
      USER_PREFERENCES: 'user_preferences',
      BALANCE: 'balance',
      PORTFOLIO: 'portfolio',
      TRADING_SETTINGS: 'trading_settings',
      UI_STATE: 'ui_state',
      NOTIFICATIONS: 'notifications',
      WATCHLIST: 'watchlist',
      ALERTS: 'alerts'
    };
    
    // Sync intervals (in milliseconds)
    this.SYNC_INTERVALS = {
      [this.STATE_CATEGORIES.USER_PREFERENCES]: 5000,
      [this.STATE_CATEGORIES.BALANCE]: 1000,
      [this.STATE_CATEGORIES.PORTFOLIO]: 2000,
      [this.STATE_CATEGORIES.TRADING_SETTINGS]: 10000,
      [this.STATE_CATEGORIES.UI_STATE]: 3000,
      [this.STATE_CATEGORIES.NOTIFICATIONS]: 1000,
      [this.STATE_CATEGORIES.WATCHLIST]: 5000,
      [this.STATE_CATEGORIES.ALERTS]: 2000
    };
    
    // Bind methods
    this.handleStateMessage = this.handleStateMessage.bind(this);
    this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
  }

  /**
   * Initialize real-time state synchronization
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set up broadcast channel listeners
      this.setupBroadcastListeners();
      
      // Set up auth state listener
      crossBrowserAuth.addAuthListener(this.handleAuthStateChange);
      
      // Initialize state from storage
      await this.initializeStateFromStorage();
      
      this.isInitialized = true;
      console.log('Real-time state sync initialized');
    } catch (error) {
      console.error('Failed to initialize real-time state sync:', error);
    }
  }

  /**
   * Set up broadcast channel listeners
   */
  setupBroadcastListeners() {
    // Listen for state sync messages
    broadcastService.subscribe(CHANNELS.DATA_SYNC, this.handleStateMessage);
    
    // Listen for balance updates
    broadcastService.subscribe(CHANNELS.BALANCE_UPDATE, this.handleStateMessage);
    
    // Listen for portfolio changes
    broadcastService.subscribe(CHANNELS.PORTFOLIO_SYNC, this.handleStateMessage);
    
    // Listen for configuration updates
    broadcastService.subscribe(CHANNELS.CONFIG_SYNC, this.handleStateMessage);
  }

  /**
   * Handle auth state changes
   */
  async handleAuthStateChange(event, session) {
    if (event === 'signed_in' && session?.user) {
      // Load user state when signed in
      await this.loadUserState(session.user.id);
    } else if (event === 'signed_out') {
      // Clear state when signed out
      this.clearAllState();
    }
  }

  /**
   * Handle state broadcast messages
   */
  handleStateMessage(message) {
    if (!message?.type || !message?.data || this.syncInProgress) return;

    const { type, data } = message;
    
    switch (type) {
      case MESSAGE_TYPES.DATA_SYNC:
        this.handleDataSync(data);
        break;
      case MESSAGE_TYPES.BALANCE_UPDATED:
        this.handleBalanceUpdate(data);
        break;
      case MESSAGE_TYPES.PORTFOLIO_CHANGED:
        this.handlePortfolioChange(data);
        break;
      case MESSAGE_TYPES.SETTINGS_UPDATED:
        this.handleSettingsUpdate(data);
        break;
      case MESSAGE_TYPES.THEME_CHANGED:
        this.handleThemeChange(data);
        break;
    }
  }

  /**
   * Handle general data sync
   */
  handleDataSync(data) {
    const { category, state, timestamp, userId } = data;
    
    // Check if this is a newer state
    const lastTimestamp = this.lastSyncTimestamps.get(category) || 0;
    if (timestamp <= lastTimestamp) {
      return; // Ignore older state
    }
    
    // Update local state
    this.updateLocalState(category, state, timestamp);
    
    // Notify listeners
    this.notifyStateListeners(category, state, 'remote_update');
  }

  /**
   * Handle balance updates
   */
  handleBalanceUpdate(data) {
    const { balance, portfolio, timestamp } = data;
    
    // Update balance state
    this.updateLocalState(this.STATE_CATEGORIES.BALANCE, { balance }, timestamp);
    
    // Update portfolio state if provided
    if (portfolio) {
      this.updateLocalState(this.STATE_CATEGORIES.PORTFOLIO, { portfolio }, timestamp);
    }
    
    // Notify listeners
    this.notifyStateListeners(this.STATE_CATEGORIES.BALANCE, { balance }, 'balance_update');
    if (portfolio) {
      this.notifyStateListeners(this.STATE_CATEGORIES.PORTFOLIO, { portfolio }, 'portfolio_update');
    }
  }

  /**
   * Handle portfolio changes
   */
  handlePortfolioChange(data) {
    const { portfolio, timestamp } = data;
    
    this.updateLocalState(this.STATE_CATEGORIES.PORTFOLIO, { portfolio }, timestamp);
    this.notifyStateListeners(this.STATE_CATEGORIES.PORTFOLIO, { portfolio }, 'portfolio_change');
  }

  /**
   * Handle settings updates
   */
  handleSettingsUpdate(data) {
    const { settings, category, timestamp } = data;
    
    const stateCategory = category || this.STATE_CATEGORIES.USER_PREFERENCES;
    this.updateLocalState(stateCategory, settings, timestamp);
    this.notifyStateListeners(stateCategory, settings, 'settings_update');
  }

  /**
   * Handle theme changes
   */
  handleThemeChange(data) {
    const { theme, timestamp } = data;
    
    const uiState = this.getLocalState(this.STATE_CATEGORIES.UI_STATE) || {};
    uiState.theme = theme;
    
    this.updateLocalState(this.STATE_CATEGORIES.UI_STATE, uiState, timestamp);
    this.notifyStateListeners(this.STATE_CATEGORIES.UI_STATE, uiState, 'theme_change');
  }

  /**
   * Sync state to other browser instances
   */
  syncState(category, state, options = {}) {
    const { 
      debounce = true, 
      immediate = false,
      broadcast = true,
      persist = true 
    } = options;
    
    const timestamp = Date.now();
    
    // Update local state
    this.updateLocalState(category, state, timestamp);
    
    // Persist to storage if needed
    if (persist) {
      this.persistState(category, state, timestamp);
    }
    
    // Broadcast to other instances
    if (broadcast) {
      if (debounce && !immediate) {
        this.debouncedBroadcast(category, state, timestamp);
      } else {
        this.broadcastState(category, state, timestamp);
      }
    }
    
    // Notify local listeners
    this.notifyStateListeners(category, state, 'local_update');
  }

  /**
   * Debounced broadcast to prevent excessive network traffic
   */
  debouncedBroadcast(category, state, timestamp) {
    const debounceTime = this.SYNC_INTERVALS[category] || 3000;
    
    // Clear existing timer
    if (this.debounceTimers.has(category)) {
      clearTimeout(this.debounceTimers.get(category));
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.broadcastState(category, state, timestamp);
      this.debounceTimers.delete(category);
    }, debounceTime);
    
    this.debounceTimers.set(category, timer);
  }

  /**
   * Broadcast state to other browser instances
   */
  broadcastState(category, state, timestamp) {
    const currentSession = crossBrowserAuth.getCurrentSession();
    
    if (!currentSession.isAuthenticated) {
      return;
    }
    
    const message = {
      type: MESSAGE_TYPES.DATA_SYNC,
      data: {
        category,
        state,
        timestamp,
        userId: currentSession.session?.user?.id
      }
    };
    
    // Choose appropriate channel based on category
    let channel = CHANNELS.DATA_SYNC;
    
    switch (category) {
      case this.STATE_CATEGORIES.BALANCE:
        channel = CHANNELS.BALANCE_UPDATE;
        message.type = MESSAGE_TYPES.BALANCE_UPDATED;
        break;
      case this.STATE_CATEGORIES.PORTFOLIO:
        channel = CHANNELS.PORTFOLIO_SYNC;
        message.type = MESSAGE_TYPES.PORTFOLIO_CHANGED;
        break;
      case this.STATE_CATEGORIES.USER_PREFERENCES:
      case this.STATE_CATEGORIES.TRADING_SETTINGS:
        channel = CHANNELS.CONFIG_SYNC;
        message.type = MESSAGE_TYPES.SETTINGS_UPDATED;
        break;
      case this.STATE_CATEGORIES.UI_STATE:
        if (state.theme) {
          channel = CHANNELS.CONFIG_SYNC;
          message.type = MESSAGE_TYPES.THEME_CHANGED;
          message.data = { theme: state.theme, timestamp };
        }
        break;
    }
    
    broadcastService.broadcast(channel, message);
  }

  /**
   * Update local state
   */
  updateLocalState(category, state, timestamp) {
    // Store in memory
    if (typeof window !== 'undefined') {
      const stateKey = `realtime_state_${category}`;
      const stateData = {
        state,
        timestamp,
        lastUpdated: Date.now()
      };
      
      try {
        localStorage.setItem(stateKey, JSON.stringify(stateData));
      } catch (error) {
        console.warn('Failed to store state in localStorage:', error);
      }
    }
    
    // Update timestamp
    this.lastSyncTimestamps.set(category, timestamp);
  }

  /**
   * Get local state
   */
  getLocalState(category) {
    if (typeof window === 'undefined') return null;
    
    try {
      const stateKey = `realtime_state_${category}`;
      const stateData = localStorage.getItem(stateKey);
      
      if (stateData) {
        const parsed = JSON.parse(stateData);
        return parsed.state;
      }
    } catch (error) {
      console.warn('Failed to get state from localStorage:', error);
    }
    
    return null;
  }

  /**
   * Persist state to backend
   */
  async persistState(category, state, timestamp) {
    try {
      const currentSession = crossBrowserAuth.getCurrentSession();
      
      if (!currentSession.isAuthenticated || !currentSession.sessionToken) {
        return;
      }
      
      const response = await fetch('/api/sessions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': currentSession.sessionToken
        },
        body: JSON.stringify({
          sessionData: {
            stateCategory: category,
            state,
            timestamp
          }
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to persist state to backend');
      }
    } catch (error) {
      console.error('Error persisting state:', error);
    }
  }

  /**
   * Load user state from backend
   */
  async loadUserState(userId) {
    try {
      const currentSession = crossBrowserAuth.getCurrentSession();
      
      if (!currentSession.sessionToken) {
        return;
      }
      
      const response = await fetch('/api/sessions/state', {
        method: 'GET',
        headers: {
          'X-Session-Token': currentSession.sessionToken
        }
      });
      
      if (!response.ok) {
        console.warn('Failed to load user state from backend');
        return;
      }
      
      const userData = await response.json();
      
      // Update local state with backend data
      Object.entries(userData.state || {}).forEach(([category, stateData]) => {
        if (stateData && stateData.state) {
          this.updateLocalState(category, stateData.state, stateData.timestamp);
          this.notifyStateListeners(category, stateData.state, 'backend_load');
        }
      });
      
    } catch (error) {
      console.error('Error loading user state:', error);
    }
  }

  /**
   * Initialize state from local storage
   */
  async initializeStateFromStorage() {
    if (typeof window === 'undefined') return;
    
    Object.values(this.STATE_CATEGORIES).forEach(category => {
      const state = this.getLocalState(category);
      if (state) {
        this.notifyStateListeners(category, state, 'storage_load');
      }
    });
  }

  /**
   * Clear all state
   */
  clearAllState() {
    if (typeof window === 'undefined') return;
    
    Object.values(this.STATE_CATEGORIES).forEach(category => {
      const stateKey = `realtime_state_${category}`;
      try {
        localStorage.removeItem(stateKey);
      } catch (error) {
        console.warn('Failed to clear state from localStorage:', error);
      }
    });
    
    this.lastSyncTimestamps.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  /**
   * Add state listener
   */
  addStateListener(category, callback) {
    if (!this.stateListeners.has(category)) {
      this.stateListeners.set(category, new Set());
    }
    
    this.stateListeners.get(category).add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.stateListeners.get(category);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.stateListeners.delete(category);
        }
      }
    };
  }

  /**
   * Notify state listeners
   */
  notifyStateListeners(category, state, source) {
    const listeners = this.stateListeners.get(category);
    if (!listeners) return;
    
    listeners.forEach(callback => {
      try {
        callback(state, source, category);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Force sync all state
   */
  async forceSyncAll() {
    const currentSession = crossBrowserAuth.getCurrentSession();
    
    if (!currentSession.isAuthenticated) {
      return;
    }
    
    Object.values(this.STATE_CATEGORIES).forEach(category => {
      const state = this.getLocalState(category);
      if (state) {
        this.syncState(category, state, { immediate: true, debounce: false });
      }
    });
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    return {
      categories: Object.keys(this.STATE_CATEGORIES).length,
      activeListeners: Array.from(this.stateListeners.values()).reduce((sum, set) => sum + set.size, 0),
      pendingDebounces: this.debounceTimers.size,
      lastSyncTimestamps: Object.fromEntries(this.lastSyncTimestamps)
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Clear listeners
    this.stateListeners.clear();
    
    // Close broadcast channels
    broadcastService.closeChannel(CHANNELS.DATA_SYNC);
    broadcastService.closeChannel(CHANNELS.BALANCE_UPDATE);
    broadcastService.closeChannel(CHANNELS.PORTFOLIO_SYNC);
    broadcastService.closeChannel(CHANNELS.CONFIG_SYNC);
    
    this.isInitialized = false;
  }
}

// Create singleton instance
const realTimeStateSync = new RealTimeStateSync();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  realTimeStateSync.initialize();
}

export default realTimeStateSync;
export { RealTimeStateSync };

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realTimeStateSync.cleanup();
  });
}