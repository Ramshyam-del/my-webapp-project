/**
 * React Hook for BroadcastChannel Service
 * Provides easy integration with cross-browser communication
 */

import { useEffect, useCallback, useRef } from 'react';
import broadcastService, { CHANNELS, MESSAGE_TYPES } from '../services/broadcastService';

/**
 * Hook for broadcasting and listening to cross-browser messages
 * @param {string} channelName - The broadcast channel name
 * @param {function} onMessage - Callback for received messages
 * @param {object} options - Configuration options
 */
export const useBroadcast = (channelName, onMessage, options = {}) => {
  const {
    autoSubscribe = true,
    filterMessageTypes = null,
    debounceMs = 0
  } = options;

  const unsubscribeRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastMessageRef = useRef(null);

  // Debounced message handler
  const debouncedHandler = useCallback((message) => {
    if (debounceMs > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        if (onMessage) {
          onMessage(message);
        }
        lastMessageRef.current = message;
      }, debounceMs);
    } else {
      if (onMessage) {
        onMessage(message);
      }
      lastMessageRef.current = message;
    }
  }, [onMessage, debounceMs]);

  // Message handler with filtering
  const messageHandler = useCallback((message) => {
    // Filter by message types if specified
    if (filterMessageTypes && Array.isArray(filterMessageTypes)) {
      if (!filterMessageTypes.includes(message.type)) {
        return;
      }
    }

    debouncedHandler(message);
  }, [filterMessageTypes, debouncedHandler]);

  // Subscribe to channel
  useEffect(() => {
    if (autoSubscribe && channelName && messageHandler) {
      unsubscribeRef.current = broadcastService.subscribe(channelName, messageHandler);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [channelName, messageHandler, autoSubscribe]);

  // Broadcast function
  const broadcast = useCallback((messageType, data) => {
    if (!channelName) {
      console.warn('Cannot broadcast: no channel name provided');
      return false;
    }

    return broadcastService.broadcast(channelName, {
      type: messageType,
      data
    });
  }, [channelName]);

  // Manual subscribe function
  const subscribe = useCallback((callback) => {
    if (!channelName) {
      console.warn('Cannot subscribe: no channel name provided');
      return () => {};
    }

    return broadcastService.subscribe(channelName, callback || messageHandler);
  }, [channelName, messageHandler]);

  // Manual unsubscribe function
  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  return {
    broadcast,
    subscribe,
    unsubscribe,
    isSupported: broadcastService.isChannelSupported(),
    lastMessage: lastMessageRef.current
  };
};

/**
 * Hook for session synchronization across browsers
 */
export const useSessionSync = (onSessionUpdate) => {
  const { broadcast, lastMessage } = useBroadcast(
    CHANNELS.USER_SESSION,
    onSessionUpdate,
    {
      filterMessageTypes: [
        MESSAGE_TYPES.SESSION_CREATED,
        MESSAGE_TYPES.SESSION_UPDATED,
        MESSAGE_TYPES.SESSION_EXPIRED,
        MESSAGE_TYPES.SESSION_LOGOUT
      ]
    }
  );

  const broadcastSessionUpdate = useCallback((sessionData) => {
    return broadcast(MESSAGE_TYPES.SESSION_UPDATED, sessionData);
  }, [broadcast]);

  const broadcastSessionCreated = useCallback((sessionData) => {
    return broadcast(MESSAGE_TYPES.SESSION_CREATED, sessionData);
  }, [broadcast]);

  const broadcastSessionExpired = useCallback((sessionId) => {
    return broadcast(MESSAGE_TYPES.SESSION_EXPIRED, { sessionId });
  }, [broadcast]);

  const broadcastLogout = useCallback((sessionId) => {
    return broadcast(MESSAGE_TYPES.SESSION_LOGOUT, { sessionId });
  }, [broadcast]);

  return {
    broadcastSessionUpdate,
    broadcastSessionCreated,
    broadcastSessionExpired,
    broadcastLogout,
    lastSessionMessage: lastMessage
  };
};

/**
 * Hook for authentication state synchronization
 */
export const useAuthSync = (onAuthChange) => {
  const { broadcast, lastMessage } = useBroadcast(
    CHANNELS.AUTH_STATE,
    onAuthChange,
    {
      filterMessageTypes: [
        MESSAGE_TYPES.AUTH_LOGIN,
        MESSAGE_TYPES.AUTH_LOGOUT,
        MESSAGE_TYPES.AUTH_TOKEN_REFRESH
      ]
    }
  );

  const broadcastLogin = useCallback((userData) => {
    return broadcast(MESSAGE_TYPES.AUTH_LOGIN, userData);
  }, [broadcast]);

  const broadcastLogout = useCallback(() => {
    return broadcast(MESSAGE_TYPES.AUTH_LOGOUT, {});
  }, [broadcast]);

  const broadcastTokenRefresh = useCallback((tokenData) => {
    return broadcast(MESSAGE_TYPES.AUTH_TOKEN_REFRESH, tokenData);
  }, [broadcast]);

  return {
    broadcastLogin,
    broadcastLogout,
    broadcastTokenRefresh,
    lastAuthMessage: lastMessage
  };
};

/**
 * Hook for balance synchronization across browsers
 */
export const useBalanceSync = (onBalanceUpdate) => {
  const { broadcast, lastMessage } = useBroadcast(
    CHANNELS.BALANCE_UPDATE,
    onBalanceUpdate,
    {
      filterMessageTypes: [
        MESSAGE_TYPES.BALANCE_CHANGED,
        MESSAGE_TYPES.BALANCE_SYNC
      ],
      debounceMs: 500 // Debounce balance updates
    }
  );

  const broadcastBalanceChange = useCallback((balanceData) => {
    return broadcast(MESSAGE_TYPES.BALANCE_CHANGED, balanceData);
  }, [broadcast]);

  const broadcastBalanceSync = useCallback((balanceData) => {
    return broadcast(MESSAGE_TYPES.BALANCE_SYNC, balanceData);
  }, [broadcast]);

  return {
    broadcastBalanceChange,
    broadcastBalanceSync,
    lastBalanceMessage: lastMessage
  };
};

/**
 * Hook for trade synchronization across browsers
 */
export const useTradeSync = (onTradeUpdate) => {
  const { broadcast, lastMessage } = useBroadcast(
    CHANNELS.TRADE_UPDATE,
    onTradeUpdate,
    {
      filterMessageTypes: [
        MESSAGE_TYPES.TRADE_OPENED,
        MESSAGE_TYPES.TRADE_CLOSED,
        MESSAGE_TYPES.TRADE_UPDATED
      ]
    }
  );

  const broadcastTradeOpened = useCallback((tradeData) => {
    return broadcast(MESSAGE_TYPES.TRADE_OPENED, tradeData);
  }, [broadcast]);

  const broadcastTradeClosed = useCallback((tradeData) => {
    return broadcast(MESSAGE_TYPES.TRADE_CLOSED, tradeData);
  }, [broadcast]);

  const broadcastTradeUpdated = useCallback((tradeData) => {
    return broadcast(MESSAGE_TYPES.TRADE_UPDATED, tradeData);
  }, [broadcast]);

  return {
    broadcastTradeOpened,
    broadcastTradeClosed,
    broadcastTradeUpdated,
    lastTradeMessage: lastMessage
  };
};

/**
 * Hook for notification synchronization across browsers
 */
export const useNotificationSync = (onNotification) => {
  const { broadcast, lastMessage } = useBroadcast(
    CHANNELS.NOTIFICATION,
    onNotification,
    {
      filterMessageTypes: [
        MESSAGE_TYPES.NOTIFICATION_NEW,
        MESSAGE_TYPES.NOTIFICATION_READ
      ]
    }
  );

  const broadcastNewNotification = useCallback((notificationData) => {
    return broadcast(MESSAGE_TYPES.NOTIFICATION_NEW, notificationData);
  }, [broadcast]);

  const broadcastNotificationRead = useCallback((notificationId) => {
    return broadcast(MESSAGE_TYPES.NOTIFICATION_READ, { notificationId });
  }, [broadcast]);

  return {
    broadcastNewNotification,
    broadcastNotificationRead,
    lastNotificationMessage: lastMessage
  };
};

/**
 * Hook for configuration synchronization across browsers
 */
export const useConfigSync = (onConfigChange) => {
  const { broadcast, lastMessage } = useBroadcast(
    CHANNELS.CONFIG_UPDATE,
    onConfigChange,
    {
      filterMessageTypes: [
        MESSAGE_TYPES.CONFIG_CHANGED,
        MESSAGE_TYPES.THEME_CHANGED
      ]
    }
  );

  const broadcastConfigChange = useCallback((configData) => {
    return broadcast(MESSAGE_TYPES.CONFIG_CHANGED, configData);
  }, [broadcast]);

  const broadcastThemeChange = useCallback((themeData) => {
    return broadcast(MESSAGE_TYPES.THEME_CHANGED, themeData);
  }, [broadcast]);

  return {
    broadcastConfigChange,
    broadcastThemeChange,
    lastConfigMessage: lastMessage
  };
};

/**
 * Hook for portfolio synchronization across browsers
 */
export const usePortfolioSync = (onPortfolioUpdate) => {
  const { broadcast, lastMessage } = useBroadcast(
    CHANNELS.PORTFOLIO_UPDATE,
    onPortfolioUpdate,
    {
      filterMessageTypes: [
        MESSAGE_TYPES.PORTFOLIO_UPDATED,
        MESSAGE_TYPES.WATCHLIST_UPDATED
      ],
      debounceMs: 1000 // Debounce portfolio updates
    }
  );

  const broadcastPortfolioUpdate = useCallback((portfolioData) => {
    return broadcast(MESSAGE_TYPES.PORTFOLIO_UPDATED, portfolioData);
  }, [broadcast]);

  const broadcastWatchlistUpdate = useCallback((watchlistData) => {
    return broadcast(MESSAGE_TYPES.WATCHLIST_UPDATED, watchlistData);
  }, [broadcast]);

  return {
    broadcastPortfolioUpdate,
    broadcastWatchlistUpdate,
    lastPortfolioMessage: lastMessage
  };
};

export default useBroadcast;