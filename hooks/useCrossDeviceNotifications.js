/**
 * React hooks for cross-device notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import crossDeviceNotifications from '../services/crossDeviceNotifications';
import { useCrossBrowserAuthContext } from '../contexts/CrossBrowserAuthContext';

/**
 * Main hook for cross-device notifications
 */
export function useCrossDeviceNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [settings, setSettings] = useState(crossDeviceNotifications.settings);
  const [stats, setStats] = useState(crossDeviceNotifications.getStats());
  const [isInitialized, setIsInitialized] = useState(crossDeviceNotifications.isInitialized);
  const { user } = useCrossBrowserAuthContext();
  const listenerRef = useRef(null);

  // Handle notification events
  const handleNotificationEvent = useCallback((event, data) => {
    switch (event) {
      case 'notification_sent':
      case 'notification_displayed':
        setActiveNotifications(prev => {
          const existing = prev.find(n => n.id === data.id);
          if (existing) {
            return prev.map(n => n.id === data.id ? data : n);
          }
          return [...prev, data];
        });
        setNotifications(prev => [data, ...prev.slice(0, 49)]); // Keep last 50
        break;
      
      case 'notification_read':
        setActiveNotifications(prev => prev.filter(n => n.id !== data.notificationId));
        break;
      
      case 'notifications_cleared':
        setActiveNotifications([]);
        break;
      
      case 'settings_updated':
        setSettings(data);
        break;
    }
    
    // Update stats
    setStats(crossDeviceNotifications.getStats());
  }, []);

  // Initialize notifications
  useEffect(() => {
    if (!user) return;

    const initializeNotifications = async () => {
      try {
        await crossDeviceNotifications.initialize();
        setIsInitialized(true);
        setStats(crossDeviceNotifications.getStats());
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
  }, [user]);

  // Set up event listener
  useEffect(() => {
    if (!isInitialized) return;

    listenerRef.current = crossDeviceNotifications.addListener(handleNotificationEvent);

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
      }
    };
  }, [isInitialized, handleNotificationEvent]);

  // Listen for in-app notifications
  useEffect(() => {
    const handleAppNotification = (event) => {
      const notification = event.detail;
      setActiveNotifications(prev => {
        const existing = prev.find(n => n.id === notification.id);
        if (existing) return prev;
        return [...prev, notification];
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('app-notification', handleAppNotification);
      return () => window.removeEventListener('app-notification', handleAppNotification);
    }
  }, []);

  // Send notification
  const sendNotification = useCallback(async (notificationData) => {
    try {
      await crossDeviceNotifications.sendNotification(notificationData);
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    crossDeviceNotifications.updateSettings(newSettings);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    crossDeviceNotifications.markNotificationAsRead(notificationId);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    crossDeviceNotifications.clearAllNotifications();
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      await crossDeviceNotifications.requestNotificationPermission();
      setStats(crossDeviceNotifications.getStats());
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    }
  }, []);

  return {
    notifications,
    activeNotifications,
    settings,
    stats,
    isInitialized,
    sendNotification,
    updateSettings,
    markAsRead,
    clearAll,
    requestPermission,
    // Notification types for convenience
    NOTIFICATION_TYPES: crossDeviceNotifications.NOTIFICATION_TYPES,
    PRIORITIES: crossDeviceNotifications.PRIORITIES
  };
}

/**
 * Hook for trade notifications
 */
export function useTradeNotifications() {
  const { sendNotification, NOTIFICATION_TYPES, PRIORITIES } = useCrossDeviceNotifications();

  const notifyTradeExecuted = useCallback((trade) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.TRADE_EXECUTED,
      title: 'Trade Executed',
      message: `${trade.side} ${trade.quantity} ${trade.symbol} at $${trade.price}`,
      data: trade,
      priority: PRIORITIES.HIGH,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  const notifyTradeFailed = useCallback((trade, error) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.TRADE_FAILED,
      title: 'Trade Failed',
      message: `Failed to ${trade.side} ${trade.quantity} ${trade.symbol}: ${error}`,
      data: { ...trade, error },
      priority: PRIORITIES.HIGH,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  const notifyOrderFilled = useCallback((order) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.ORDER_FILLED,
      title: 'Order Filled',
      message: `${order.side} order for ${order.quantity} ${order.symbol} filled at $${order.fillPrice}`,
      data: order,
      priority: PRIORITIES.NORMAL,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  const notifyOrderCancelled = useCallback((order) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.ORDER_CANCELLED,
      title: 'Order Cancelled',
      message: `${order.side} order for ${order.quantity} ${order.symbol} cancelled`,
      data: order,
      priority: PRIORITIES.NORMAL,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  return {
    notifyTradeExecuted,
    notifyTradeFailed,
    notifyOrderFilled,
    notifyOrderCancelled
  };
}

/**
 * Hook for balance notifications
 */
export function useBalanceNotifications() {
  const { sendNotification, NOTIFICATION_TYPES, PRIORITIES } = useCrossDeviceNotifications();

  const notifyDeposit = useCallback((amount, balance) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.DEPOSIT_RECEIVED,
      title: 'Deposit Received',
      message: `$${amount.toFixed(2)} deposited to your account`,
      data: { amount, balance },
      priority: PRIORITIES.NORMAL,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  const notifyWithdrawal = useCallback((amount, balance) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.WITHDRAWAL_PROCESSED,
      title: 'Withdrawal Processed',
      message: `$${amount.toFixed(2)} withdrawn from your account`,
      data: { amount, balance },
      priority: PRIORITIES.NORMAL,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  const notifyLowBalance = useCallback((balance, threshold = 100) => {
    if (balance < threshold) {
      return sendNotification({
        type: NOTIFICATION_TYPES.BALANCE_LOW,
        title: 'Low Balance Alert',
        message: `Your account balance is low: $${balance.toFixed(2)}`,
        data: { balance, threshold },
        priority: PRIORITIES.HIGH,
        crossDevice: true
      });
    }
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  return {
    notifyDeposit,
    notifyWithdrawal,
    notifyLowBalance
  };
}

/**
 * Hook for price alert notifications
 */
export function usePriceAlertNotifications() {
  const { sendNotification, NOTIFICATION_TYPES, PRIORITIES } = useCrossDeviceNotifications();

  const notifyPriceAlert = useCallback((alert, currentPrice) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.PRICE_ALERT,
      title: 'Price Alert Triggered',
      message: `${alert.symbol} reached $${currentPrice} (target: $${alert.targetPrice})`,
      data: { alert, currentPrice },
      priority: PRIORITIES.NORMAL,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  const notifyPortfolioMilestone = useCallback((milestone, portfolioValue) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.PORTFOLIO_MILESTONE,
      title: 'Portfolio Milestone',
      message: `Your portfolio reached $${portfolioValue.toFixed(2)}!`,
      data: { milestone, portfolioValue },
      priority: PRIORITIES.NORMAL,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  return {
    notifyPriceAlert,
    notifyPortfolioMilestone
  };
}

/**
 * Hook for security notifications
 */
export function useSecurityNotifications() {
  const { sendNotification, NOTIFICATION_TYPES, PRIORITIES } = useCrossDeviceNotifications();

  const notifySecurityAlert = useCallback((alertType, details) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
      title: 'Security Alert',
      message: `Security alert: ${alertType}`,
      data: { alertType, details },
      priority: PRIORITIES.URGENT,
      crossDevice: true,
      persistent: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  const notifySessionExpired = useCallback(() => {
    return sendNotification({
      type: NOTIFICATION_TYPES.SESSION_EXPIRED,
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
      data: {},
      priority: PRIORITIES.HIGH,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  const notifyLoginDetected = useCallback((deviceInfo) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.LOGIN_DETECTED,
      title: 'New Login Detected',
      message: `Login detected from ${deviceInfo}`,
      data: { deviceInfo },
      priority: PRIORITIES.NORMAL,
      crossDevice: true,
      excludeCurrentDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  return {
    notifySecurityAlert,
    notifySessionExpired,
    notifyLoginDetected
  };
}

/**
 * Hook for system notifications
 */
export function useSystemNotifications() {
  const { sendNotification, NOTIFICATION_TYPES, PRIORITIES } = useCrossDeviceNotifications();

  const notifySystemMaintenance = useCallback((maintenanceInfo) => {
    return sendNotification({
      type: NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
      title: 'System Maintenance',
      message: `Scheduled maintenance: ${maintenanceInfo.message}`,
      data: maintenanceInfo,
      priority: PRIORITIES.NORMAL,
      crossDevice: true
    });
  }, [sendNotification, NOTIFICATION_TYPES, PRIORITIES]);

  return {
    notifySystemMaintenance
  };
}

/**
 * Hook for notification settings management
 */
export function useNotificationSettings() {
  const { settings, updateSettings, stats, requestPermission } = useCrossDeviceNotifications();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateNotificationSettings = useCallback(async (newSettings) => {
    setIsUpdating(true);
    try {
      updateSettings(newSettings);
    } finally {
      setIsUpdating(false);
    }
  }, [updateSettings]);

  const toggleNotificationType = useCallback((type, enabled) => {
    const newSettings = {
      ...settings,
      typeSettings: {
        ...settings.typeSettings,
        [type]: {
          ...settings.typeSettings[type],
          enabled
        }
      }
    };
    updateSettings(newSettings);
  }, [settings, updateSettings]);

  const updateQuietHours = useCallback((quietHours) => {
    const newSettings = {
      ...settings,
      quietHours
    };
    updateSettings(newSettings);
  }, [settings, updateSettings]);

  const enableBrowserNotifications = useCallback(async () => {
    try {
      await requestPermission();
      const newSettings = {
        ...settings,
        enableBrowserNotifications: true
      };
      updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to enable browser notifications:', error);
      throw error;
    }
  }, [settings, updateSettings, requestPermission]);

  return {
    settings,
    stats,
    isUpdating,
    updateNotificationSettings,
    toggleNotificationType,
    updateQuietHours,
    enableBrowserNotifications
  };
}

/**
 * Hook for notification display management
 */
export function useNotificationDisplay() {
  const { activeNotifications, markAsRead, clearAll } = useCrossDeviceNotifications();
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [maxDisplay, setMaxDisplay] = useState(5);

  // Update displayed notifications based on active ones
  useEffect(() => {
    const sortedNotifications = [...activeNotifications]
      .sort((a, b) => {
        // Sort by priority first, then by timestamp
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return b.timestamp - a.timestamp;
      })
      .slice(0, maxDisplay);
    
    setDisplayedNotifications(sortedNotifications);
  }, [activeNotifications, maxDisplay]);

  const dismissNotification = useCallback((notificationId) => {
    markAsRead(notificationId);
  }, [markAsRead]);

  const dismissAll = useCallback(() => {
    clearAll();
  }, [clearAll]);

  return {
    displayedNotifications,
    maxDisplay,
    setMaxDisplay,
    dismissNotification,
    dismissAll,
    hasNotifications: displayedNotifications.length > 0
  };
}