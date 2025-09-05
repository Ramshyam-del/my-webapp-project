/**
 * React Hooks for Real-Time State Synchronization
 * Provides hooks for managing synchronized state across browser instances
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import realTimeStateSync from '../services/realTimeStateSync';
import { useCrossBrowserAuthContext } from '../contexts/CrossBrowserAuthContext';

/**
 * Main hook for real-time state synchronization
 */
export function useRealTimeState(category, initialState = null) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [source, setSource] = useState(null);
  const { isAuthenticated } = useCrossBrowserAuthContext();
  
  const listenerRef = useRef(null);
  const mountedRef = useRef(true);

  // Handle state updates
  const handleStateUpdate = useCallback((newState, updateSource, stateCategory) => {
    if (!mountedRef.current || stateCategory !== category) return;
    
    setState(newState);
    setLastUpdated(Date.now());
    setSource(updateSource);
    setLoading(false);
  }, [category]);

  // Initialize state and listener
  useEffect(() => {
    mountedRef.current = true;
    
    const initializeState = async () => {
      try {
        // Initialize the sync service
        await realTimeStateSync.initialize();
        
        // Get initial state
        const currentState = realTimeStateSync.getLocalState(category);
        if (currentState && mountedRef.current) {
          setState(currentState);
          setSource('storage_load');
        }
        
        // Set up listener
        listenerRef.current = realTimeStateSync.addStateListener(category, handleStateUpdate);
        
        if (mountedRef.current) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing real-time state:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeState();

    return () => {
      mountedRef.current = false;
      if (listenerRef.current) {
        listenerRef.current();
      }
    };
  }, [category, handleStateUpdate]);

  // Update state function
  const updateState = useCallback((newState, options = {}) => {
    if (!isAuthenticated) {
      console.warn('Cannot update state: user not authenticated');
      return;
    }
    
    realTimeStateSync.syncState(category, newState, options);
  }, [category, isAuthenticated]);

  // Merge state function
  const mergeState = useCallback((partialState, options = {}) => {
    const currentState = state || {};
    const mergedState = { ...currentState, ...partialState };
    updateState(mergedState, options);
  }, [state, updateState]);

  return {
    state,
    loading,
    lastUpdated,
    source,
    updateState,
    mergeState
  };
}

/**
 * Hook for user preferences synchronization
 */
export function useUserPreferences(initialPreferences = {}) {
  const { state, loading, updateState, mergeState } = useRealTimeState(
    realTimeStateSync.STATE_CATEGORIES.USER_PREFERENCES,
    initialPreferences
  );

  const updatePreference = useCallback((key, value) => {
    mergeState({ [key]: value });
  }, [mergeState]);

  const updatePreferences = useCallback((preferences) => {
    mergeState(preferences);
  }, [mergeState]);

  return {
    preferences: state || initialPreferences,
    loading,
    updatePreference,
    updatePreferences
  };
}

/**
 * Hook for balance synchronization
 */
export function useBalanceSync() {
  const { state, loading, lastUpdated, source } = useRealTimeState(
    realTimeStateSync.STATE_CATEGORIES.BALANCE
  );

  return {
    balance: state?.balance || null,
    loading,
    lastUpdated,
    source,
    isRealTime: source === 'remote_update' || source === 'balance_update'
  };
}

/**
 * Hook for portfolio synchronization
 */
export function usePortfolioSync() {
  const { state, loading, lastUpdated, source } = useRealTimeState(
    realTimeStateSync.STATE_CATEGORIES.PORTFOLIO
  );

  return {
    portfolio: state?.portfolio || null,
    loading,
    lastUpdated,
    source,
    isRealTime: source === 'remote_update' || source === 'portfolio_update'
  };
}

/**
 * Hook for trading settings synchronization
 */
export function useTradingSettings(initialSettings = {}) {
  const { state, loading, updateState, mergeState } = useRealTimeState(
    realTimeStateSync.STATE_CATEGORIES.TRADING_SETTINGS,
    initialSettings
  );

  const updateSetting = useCallback((key, value) => {
    mergeState({ [key]: value });
  }, [mergeState]);

  const updateSettings = useCallback((settings) => {
    mergeState(settings);
  }, [mergeState]);

  return {
    settings: state || initialSettings,
    loading,
    updateSetting,
    updateSettings
  };
}

/**
 * Hook for UI state synchronization
 */
export function useUIState(initialUIState = {}) {
  const { state, loading, updateState, mergeState } = useRealTimeState(
    realTimeStateSync.STATE_CATEGORIES.UI_STATE,
    initialUIState
  );

  const updateUIState = useCallback((key, value) => {
    mergeState({ [key]: value });
  }, [mergeState]);

  const setTheme = useCallback((theme) => {
    mergeState({ theme }, { immediate: true });
  }, [mergeState]);

  return {
    uiState: state || initialUIState,
    theme: state?.theme || 'light',
    loading,
    updateUIState,
    setTheme
  };
}

/**
 * Hook for notifications synchronization
 */
export function useNotificationsSync() {
  const { state, loading, updateState, mergeState } = useRealTimeState(
    realTimeStateSync.STATE_CATEGORIES.NOTIFICATIONS,
    { notifications: [], unreadCount: 0 }
  );

  const addNotification = useCallback((notification) => {
    const currentState = state || { notifications: [], unreadCount: 0 };
    const newNotification = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
      ...notification
    };
    
    const updatedState = {
      notifications: [newNotification, ...currentState.notifications],
      unreadCount: currentState.unreadCount + 1
    };
    
    updateState(updatedState, { immediate: true });
  }, [state, updateState]);

  const markAsRead = useCallback((notificationId) => {
    const currentState = state || { notifications: [], unreadCount: 0 };
    const updatedNotifications = currentState.notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    
    const unreadCount = updatedNotifications.filter(notif => !notif.read).length;
    
    updateState({
      notifications: updatedNotifications,
      unreadCount
    });
  }, [state, updateState]);

  const clearNotifications = useCallback(() => {
    updateState({ notifications: [], unreadCount: 0 });
  }, [updateState]);

  return {
    notifications: state?.notifications || [],
    unreadCount: state?.unreadCount || 0,
    loading,
    addNotification,
    markAsRead,
    clearNotifications
  };
}

/**
 * Hook for watchlist synchronization
 */
export function useWatchlistSync(initialWatchlist = []) {
  const { state, loading, updateState } = useRealTimeState(
    realTimeStateSync.STATE_CATEGORIES.WATCHLIST,
    { watchlist: initialWatchlist }
  );

  const addToWatchlist = useCallback((symbol) => {
    const currentWatchlist = state?.watchlist || [];
    if (!currentWatchlist.includes(symbol)) {
      updateState({ watchlist: [...currentWatchlist, symbol] });
    }
  }, [state, updateState]);

  const removeFromWatchlist = useCallback((symbol) => {
    const currentWatchlist = state?.watchlist || [];
    updateState({ 
      watchlist: currentWatchlist.filter(item => item !== symbol) 
    });
  }, [state, updateState]);

  const setWatchlist = useCallback((watchlist) => {
    updateState({ watchlist });
  }, [updateState]);

  return {
    watchlist: state?.watchlist || initialWatchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    setWatchlist
  };
}

/**
 * Hook for alerts synchronization
 */
export function useAlertsSync() {
  const { state, loading, updateState, mergeState } = useRealTimeState(
    realTimeStateSync.STATE_CATEGORIES.ALERTS,
    { alerts: [] }
  );

  const addAlert = useCallback((alert) => {
    const currentAlerts = state?.alerts || [];
    const newAlert = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      active: true,
      ...alert
    };
    
    updateState({ alerts: [...currentAlerts, newAlert] });
  }, [state, updateState]);

  const updateAlert = useCallback((alertId, updates) => {
    const currentAlerts = state?.alerts || [];
    const updatedAlerts = currentAlerts.map(alert => 
      alert.id === alertId ? { ...alert, ...updates } : alert
    );
    
    updateState({ alerts: updatedAlerts });
  }, [state, updateState]);

  const removeAlert = useCallback((alertId) => {
    const currentAlerts = state?.alerts || [];
    updateState({ 
      alerts: currentAlerts.filter(alert => alert.id !== alertId) 
    });
  }, [state, updateState]);

  const toggleAlert = useCallback((alertId) => {
    const currentAlerts = state?.alerts || [];
    const updatedAlerts = currentAlerts.map(alert => 
      alert.id === alertId ? { ...alert, active: !alert.active } : alert
    );
    
    updateState({ alerts: updatedAlerts });
  }, [state, updateState]);

  return {
    alerts: state?.alerts || [],
    loading,
    addAlert,
    updateAlert,
    removeAlert,
    toggleAlert
  };
}

/**
 * Hook for sync statistics and debugging
 */
export function useSyncStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateStats = () => {
      try {
        const syncStats = realTimeStateSync.getSyncStats();
        setStats(syncStats);
        setLoading(false);
      } catch (error) {
        console.error('Error getting sync stats:', error);
        setLoading(false);
      }
    };

    // Initial load
    updateStats();

    // Update every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const forceSyncAll = useCallback(async () => {
    try {
      await realTimeStateSync.forceSyncAll();
    } catch (error) {
      console.error('Error forcing sync:', error);
    }
  }, []);

  return {
    stats,
    loading,
    forceSyncAll
  };
}

/**
 * Hook for managing multiple state categories
 */
export function useMultiStateSync(categories, initialStates = {}) {
  const [states, setStates] = useState(initialStates);
  const [loading, setLoading] = useState(true);
  const listenersRef = useRef(new Map());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const initializeStates = async () => {
      try {
        await realTimeStateSync.initialize();
        
        const initialStatesData = {};
        
        categories.forEach(category => {
          const currentState = realTimeStateSync.getLocalState(category);
          if (currentState) {
            initialStatesData[category] = currentState;
          }
          
          // Set up listener for each category
          const unsubscribe = realTimeStateSync.addStateListener(
            category,
            (newState, source, stateCategory) => {
              if (!mountedRef.current) return;
              
              setStates(prev => ({
                ...prev,
                [stateCategory]: newState
              }));
            }
          );
          
          listenersRef.current.set(category, unsubscribe);
        });
        
        if (mountedRef.current) {
          setStates(prev => ({ ...prev, ...initialStatesData }));
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing multi-state sync:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeStates();

    return () => {
      mountedRef.current = false;
      listenersRef.current.forEach(unsubscribe => unsubscribe());
      listenersRef.current.clear();
    };
  }, [categories]);

  const updateState = useCallback((category, newState, options = {}) => {
    if (!categories.includes(category)) {
      console.warn(`Category ${category} not in managed categories`);
      return;
    }
    
    realTimeStateSync.syncState(category, newState, options);
  }, [categories]);

  return {
    states,
    loading,
    updateState
  };
}

export default useRealTimeState;