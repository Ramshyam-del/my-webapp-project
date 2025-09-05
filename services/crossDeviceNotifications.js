/**
 * Cross-Device Notification Service
 * Handles notifications for trades, transactions, and important updates across browser instances
 */

import broadcastService, { CHANNELS, MESSAGE_TYPES } from './broadcastService';
import crossBrowserAuth from './crossBrowserAuth';
import realTimeStateSync from './realTimeStateSync';

class CrossDeviceNotifications {
  constructor() {
    this.isInitialized = false;
    this.notificationQueue = [];
    this.activeNotifications = new Map();
    this.notificationListeners = new Set();
    this.permissionStatus = 'default';
    this.isServiceWorkerRegistered = false;
    
    // Notification types
    this.NOTIFICATION_TYPES = {
      TRADE_EXECUTED: 'trade_executed',
      TRADE_FAILED: 'trade_failed',
      ORDER_FILLED: 'order_filled',
      ORDER_CANCELLED: 'order_cancelled',
      DEPOSIT_RECEIVED: 'deposit_received',
      WITHDRAWAL_PROCESSED: 'withdrawal_processed',
      BALANCE_LOW: 'balance_low',
      PRICE_ALERT: 'price_alert',
      SECURITY_ALERT: 'security_alert',
      SYSTEM_MAINTENANCE: 'system_maintenance',
      SESSION_EXPIRED: 'session_expired',
      LOGIN_DETECTED: 'login_detected',
      PORTFOLIO_MILESTONE: 'portfolio_milestone'
    };
    
    // Notification priorities
    this.PRIORITIES = {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      URGENT: 'urgent'
    };
    
    // Notification settings
    this.settings = {
      enableBrowserNotifications: true,
      enableCrossDeviceSync: true,
      enableSoundAlerts: true,
      enablePushNotifications: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      typeSettings: {
        [this.NOTIFICATION_TYPES.TRADE_EXECUTED]: { enabled: true, sound: true, priority: this.PRIORITIES.HIGH },
        [this.NOTIFICATION_TYPES.TRADE_FAILED]: { enabled: true, sound: true, priority: this.PRIORITIES.HIGH },
        [this.NOTIFICATION_TYPES.ORDER_FILLED]: { enabled: true, sound: true, priority: this.PRIORITIES.NORMAL },
        [this.NOTIFICATION_TYPES.ORDER_CANCELLED]: { enabled: true, sound: false, priority: this.PRIORITIES.NORMAL },
        [this.NOTIFICATION_TYPES.DEPOSIT_RECEIVED]: { enabled: true, sound: true, priority: this.PRIORITIES.NORMAL },
        [this.NOTIFICATION_TYPES.WITHDRAWAL_PROCESSED]: { enabled: true, sound: true, priority: this.PRIORITIES.NORMAL },
        [this.NOTIFICATION_TYPES.BALANCE_LOW]: { enabled: true, sound: true, priority: this.PRIORITIES.HIGH },
        [this.NOTIFICATION_TYPES.PRICE_ALERT]: { enabled: true, sound: true, priority: this.PRIORITIES.NORMAL },
        [this.NOTIFICATION_TYPES.SECURITY_ALERT]: { enabled: true, sound: true, priority: this.PRIORITIES.URGENT },
        [this.NOTIFICATION_TYPES.SYSTEM_MAINTENANCE]: { enabled: true, sound: false, priority: this.PRIORITIES.NORMAL },
        [this.NOTIFICATION_TYPES.SESSION_EXPIRED]: { enabled: true, sound: true, priority: this.PRIORITIES.HIGH },
        [this.NOTIFICATION_TYPES.LOGIN_DETECTED]: { enabled: true, sound: false, priority: this.PRIORITIES.NORMAL },
        [this.NOTIFICATION_TYPES.PORTFOLIO_MILESTONE]: { enabled: true, sound: true, priority: this.PRIORITIES.NORMAL }
      }
    };
    
    // Bind methods
    this.handleNotificationMessage = this.handleNotificationMessage.bind(this);
    this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
  }

  /**
   * Initialize cross-device notifications
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load settings from storage
      await this.loadSettings();
      
      // Request notification permission
      await this.requestNotificationPermission();
      
      // Register service worker for push notifications
      await this.registerServiceWorker();
      
      // Set up broadcast listeners
      this.setupBroadcastListeners();
      
      // Set up auth state listener
      crossBrowserAuth.addAuthListener(this.handleAuthStateChange);
      
      // Process queued notifications
      this.processNotificationQueue();
      
      this.isInitialized = true;
      console.log('Cross-device notifications initialized');
    } catch (error) {
      console.error('Failed to initialize cross-device notifications:', error);
    }
  }

  /**
   * Set up broadcast channel listeners
   */
  setupBroadcastListeners() {
    // Listen for notification messages
    broadcastService.subscribe(CHANNELS.NOTIFICATIONS, this.handleNotificationMessage);
    
    // Listen for trade notifications
    broadcastService.subscribe(CHANNELS.TRADE_SYNC, this.handleNotificationMessage);
    
    // Listen for balance notifications
    broadcastService.subscribe(CHANNELS.BALANCE_UPDATE, this.handleNotificationMessage);
  }

  /**
   * Handle auth state changes
   */
  handleAuthStateChange(event, session) {
    if (event === 'signed_in' && session?.user) {
      // Send login notification to other devices
      this.sendNotification({
        type: this.NOTIFICATION_TYPES.LOGIN_DETECTED,
        title: 'New Login Detected',
        message: `Login detected from ${this.getDeviceInfo()}`,
        data: {
          userId: session.user.id,
          deviceInfo: this.getDeviceInfo(),
          timestamp: Date.now()
        },
        crossDevice: true,
        excludeCurrentDevice: true
      });
    }
  }

  /**
   * Handle notification broadcast messages
   */
  handleNotificationMessage(message) {
    if (!message?.type || !message?.data) return;

    const { type, data } = message;
    
    switch (type) {
      case MESSAGE_TYPES.NOTIFICATION_RECEIVED:
        this.handleIncomingNotification(data);
        break;
      case MESSAGE_TYPES.TRADE_EXECUTED:
        this.handleTradeNotification(data);
        break;
      case MESSAGE_TYPES.BALANCE_UPDATED:
        this.handleBalanceNotification(data);
        break;
      case MESSAGE_TYPES.ALERT_TRIGGERED:
        this.handleAlertNotification(data);
        break;
    }
  }

  /**
   * Handle incoming notifications from other devices
   */
  handleIncomingNotification(notificationData) {
    const { notification, excludeCurrentDevice } = notificationData;
    
    // Skip if this notification should exclude current device
    if (excludeCurrentDevice) {
      return;
    }
    
    // Display the notification
    this.displayNotification(notification);
  }

  /**
   * Handle trade notifications
   */
  handleTradeNotification(data) {
    const { trade, type } = data;
    
    let notificationType = this.NOTIFICATION_TYPES.TRADE_EXECUTED;
    let title = 'Trade Executed';
    let message = `${trade.side} ${trade.quantity} ${trade.symbol} at $${trade.price}`;
    
    if (type === 'failed') {
      notificationType = this.NOTIFICATION_TYPES.TRADE_FAILED;
      title = 'Trade Failed';
      message = `Failed to ${trade.side} ${trade.quantity} ${trade.symbol}: ${trade.error}`;
    }
    
    this.sendNotification({
      type: notificationType,
      title,
      message,
      data: trade,
      crossDevice: true
    });
  }

  /**
   * Handle balance notifications
   */
  handleBalanceNotification(data) {
    const { balance, previousBalance, type } = data;
    
    if (type === 'deposit') {
      this.sendNotification({
        type: this.NOTIFICATION_TYPES.DEPOSIT_RECEIVED,
        title: 'Deposit Received',
        message: `$${(balance - previousBalance).toFixed(2)} deposited to your account`,
        data: { balance, previousBalance, amount: balance - previousBalance },
        crossDevice: true
      });
    } else if (type === 'withdrawal') {
      this.sendNotification({
        type: this.NOTIFICATION_TYPES.WITHDRAWAL_PROCESSED,
        title: 'Withdrawal Processed',
        message: `$${(previousBalance - balance).toFixed(2)} withdrawn from your account`,
        data: { balance, previousBalance, amount: previousBalance - balance },
        crossDevice: true
      });
    } else if (type === 'low_balance' && balance < 100) {
      this.sendNotification({
        type: this.NOTIFICATION_TYPES.BALANCE_LOW,
        title: 'Low Balance Alert',
        message: `Your account balance is low: $${balance.toFixed(2)}`,
        data: { balance },
        crossDevice: true
      });
    }
  }

  /**
   * Handle alert notifications
   */
  handleAlertNotification(data) {
    const { alert, currentPrice } = data;
    
    this.sendNotification({
      type: this.NOTIFICATION_TYPES.PRICE_ALERT,
      title: 'Price Alert Triggered',
      message: `${alert.symbol} reached $${currentPrice} (target: $${alert.targetPrice})`,
      data: { alert, currentPrice },
      crossDevice: true
    });
  }

  /**
   * Send notification
   */
  async sendNotification(notificationData) {
    const {
      type,
      title,
      message,
      data = {},
      crossDevice = false,
      excludeCurrentDevice = false,
      priority = this.PRIORITIES.NORMAL,
      persistent = false,
      actions = []
    } = notificationData;
    
    // Check if notification type is enabled
    const typeSettings = this.settings.typeSettings[type];
    if (!typeSettings?.enabled) {
      return;
    }
    
    // Check quiet hours
    if (this.isQuietHours() && priority !== this.PRIORITIES.URGENT) {
      this.queueNotification(notificationData);
      return;
    }
    
    const notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      data,
      priority: priority || typeSettings.priority,
      timestamp: Date.now(),
      persistent,
      actions,
      deviceId: this.getDeviceId()
    };
    
    // Display locally
    if (!excludeCurrentDevice) {
      this.displayNotification(notification);
    }
    
    // Broadcast to other devices
    if (crossDevice && this.settings.enableCrossDeviceSync) {
      broadcastService.broadcast(CHANNELS.NOTIFICATIONS, {
        type: MESSAGE_TYPES.NOTIFICATION_RECEIVED,
        data: {
          notification,
          excludeCurrentDevice
        }
      });
    }
    
    // Store in state sync
    this.updateNotificationState(notification);
    
    // Notify listeners
    this.notifyListeners('notification_sent', notification);
  }

  /**
   * Display notification
   */
  async displayNotification(notification) {
    const { type, title, message, data, priority, actions } = notification;
    const typeSettings = this.settings.typeSettings[type];
    
    // Store active notification
    this.activeNotifications.set(notification.id, notification);
    
    // Play sound if enabled
    if (typeSettings?.sound && this.settings.enableSoundAlerts) {
      this.playNotificationSound(priority);
    }
    
    // Show browser notification
    if (this.settings.enableBrowserNotifications && this.permissionStatus === 'granted') {
      try {
        const browserNotification = new Notification(title, {
          body: message,
          icon: this.getNotificationIcon(type),
          badge: '/icons/badge-96x96.png',
          tag: notification.id,
          requireInteraction: priority === this.PRIORITIES.URGENT,
          actions: actions.map(action => ({
            action: action.id,
            title: action.title,
            icon: action.icon
          })),
          data: {
            notificationId: notification.id,
            type,
            ...data
          }
        });
        
        // Handle notification click
        browserNotification.onclick = () => {
          this.handleNotificationClick(notification);
          browserNotification.close();
        };
        
        // Handle notification close
        browserNotification.onclose = () => {
          this.activeNotifications.delete(notification.id);
        };
        
        // Auto-close non-persistent notifications
        if (!notification.persistent) {
          setTimeout(() => {
            browserNotification.close();
          }, this.getNotificationDuration(priority));
        }
        
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
    
    // Show in-app notification
    this.showInAppNotification(notification);
    
    // Notify listeners
    this.notifyListeners('notification_displayed', notification);
  }

  /**
   * Show in-app notification
   */
  showInAppNotification(notification) {
    // This will be handled by the UI components using the notification state
    const event = new CustomEvent('app-notification', {
      detail: notification
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notification) {
    const { type, data } = notification;
    
    // Navigate based on notification type
    switch (type) {
      case this.NOTIFICATION_TYPES.TRADE_EXECUTED:
      case this.NOTIFICATION_TYPES.TRADE_FAILED:
        this.navigateToTrades(data.tradeId);
        break;
      case this.NOTIFICATION_TYPES.ORDER_FILLED:
      case this.NOTIFICATION_TYPES.ORDER_CANCELLED:
        this.navigateToOrders(data.orderId);
        break;
      case this.NOTIFICATION_TYPES.DEPOSIT_RECEIVED:
      case this.NOTIFICATION_TYPES.WITHDRAWAL_PROCESSED:
        this.navigateToTransactions();
        break;
      case this.NOTIFICATION_TYPES.BALANCE_LOW:
        this.navigateToDeposit();
        break;
      case this.NOTIFICATION_TYPES.PRICE_ALERT:
        this.navigateToChart(data.alert.symbol);
        break;
      case this.NOTIFICATION_TYPES.SECURITY_ALERT:
        this.navigateToSecurity();
        break;
    }
    
    // Mark as read
    this.markNotificationAsRead(notification.id);
  }

  /**
   * Navigation helpers
   */
  navigateToTrades(tradeId) {
    if (typeof window !== 'undefined') {
      window.location.href = `/trades${tradeId ? `?trade=${tradeId}` : ''}`;
    }
  }

  navigateToOrders(orderId) {
    if (typeof window !== 'undefined') {
      window.location.href = `/orders${orderId ? `?order=${orderId}` : ''}`;
    }
  }

  navigateToTransactions() {
    if (typeof window !== 'undefined') {
      window.location.href = '/transactions';
    }
  }

  navigateToDeposit() {
    if (typeof window !== 'undefined') {
      window.location.href = '/deposit';
    }
  }

  navigateToChart(symbol) {
    if (typeof window !== 'undefined') {
      window.location.href = `/chart?symbol=${symbol}`;
    }
  }

  navigateToSecurity() {
    if (typeof window !== 'undefined') {
      window.location.href = '/security';
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound(priority) {
    if (typeof window === 'undefined') return;
    
    try {
      const soundFile = this.getNotificationSound(priority);
      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  /**
   * Get notification sound file
   */
  getNotificationSound(priority) {
    switch (priority) {
      case this.PRIORITIES.URGENT:
        return '/sounds/urgent-notification.mp3';
      case this.PRIORITIES.HIGH:
        return '/sounds/high-notification.mp3';
      default:
        return '/sounds/notification.mp3';
    }
  }

  /**
   * Get notification icon
   */
  getNotificationIcon(type) {
    const iconMap = {
      [this.NOTIFICATION_TYPES.TRADE_EXECUTED]: '/icons/trade-success.png',
      [this.NOTIFICATION_TYPES.TRADE_FAILED]: '/icons/trade-error.png',
      [this.NOTIFICATION_TYPES.ORDER_FILLED]: '/icons/order-filled.png',
      [this.NOTIFICATION_TYPES.ORDER_CANCELLED]: '/icons/order-cancelled.png',
      [this.NOTIFICATION_TYPES.DEPOSIT_RECEIVED]: '/icons/deposit.png',
      [this.NOTIFICATION_TYPES.WITHDRAWAL_PROCESSED]: '/icons/withdrawal.png',
      [this.NOTIFICATION_TYPES.BALANCE_LOW]: '/icons/balance-low.png',
      [this.NOTIFICATION_TYPES.PRICE_ALERT]: '/icons/price-alert.png',
      [this.NOTIFICATION_TYPES.SECURITY_ALERT]: '/icons/security-alert.png',
      [this.NOTIFICATION_TYPES.SYSTEM_MAINTENANCE]: '/icons/maintenance.png',
      [this.NOTIFICATION_TYPES.SESSION_EXPIRED]: '/icons/session-expired.png',
      [this.NOTIFICATION_TYPES.LOGIN_DETECTED]: '/icons/login.png',
      [this.NOTIFICATION_TYPES.PORTFOLIO_MILESTONE]: '/icons/milestone.png'
    };
    
    return iconMap[type] || '/icons/notification-default.png';
  }

  /**
   * Get notification duration based on priority
   */
  getNotificationDuration(priority) {
    switch (priority) {
      case this.PRIORITIES.URGENT:
        return 10000; // 10 seconds
      case this.PRIORITIES.HIGH:
        return 7000;  // 7 seconds
      case this.PRIORITIES.NORMAL:
        return 5000;  // 5 seconds
      case this.PRIORITIES.LOW:
        return 3000;  // 3 seconds
      default:
        return 5000;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return;
    }
    
    try {
      this.permissionStatus = await Notification.requestPermission();
      console.log('Notification permission:', this.permissionStatus);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  /**
   * Register service worker for push notifications
   */
  async registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.isServiceWorkerRegistered = true;
      console.log('Service worker registered:', registration);
    } catch (error) {
      console.error('Error registering service worker:', error);
    }
  }

  /**
   * Check if it's quiet hours
   */
  isQuietHours() {
    if (!this.settings.quietHours.enabled) {
      return false;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Queue notification for later
   */
  queueNotification(notificationData) {
    this.notificationQueue.push({
      ...notificationData,
      queuedAt: Date.now()
    });
  }

  /**
   * Process queued notifications
   */
  processNotificationQueue() {
    if (this.isQuietHours()) {
      return;
    }
    
    const queuedNotifications = [...this.notificationQueue];
    this.notificationQueue = [];
    
    queuedNotifications.forEach(notification => {
      this.sendNotification(notification);
    });
  }

  /**
   * Update notification state
   */
  updateNotificationState(notification) {
    realTimeStateSync.syncState(
      realTimeStateSync.STATE_CATEGORIES.NOTIFICATIONS,
      {
        notifications: [notification],
        timestamp: Date.now()
      },
      { immediate: true }
    );
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId) {
    this.activeNotifications.delete(notificationId);
    this.notifyListeners('notification_read', { notificationId });
  }

  /**
   * Get device info
   */
  getDeviceInfo() {
    if (typeof window === 'undefined') return 'Unknown Device';
    
    const platform = navigator.platform || 'Unknown Platform';
    const userAgent = navigator.userAgent || '';
    
    if (userAgent.includes('Mobile')) {
      return `Mobile (${platform})`;
    } else if (userAgent.includes('Tablet')) {
      return `Tablet (${platform})`;
    } else {
      return `Desktop (${platform})`;
    }
  }

  /**
   * Get device ID
   */
  getDeviceId() {
    if (typeof window === 'undefined') return 'unknown';
    
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const savedSettings = localStorage.getItem('notification_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.notifyListeners('settings_updated', this.settings);
  }

  /**
   * Add notification listener
   */
  addListener(callback) {
    this.notificationListeners.add(callback);
    return () => this.notificationListeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners(event, data) {
    this.notificationListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Get notification statistics
   */
  getStats() {
    return {
      activeNotifications: this.activeNotifications.size,
      queuedNotifications: this.notificationQueue.length,
      permissionStatus: this.permissionStatus,
      isServiceWorkerRegistered: this.isServiceWorkerRegistered,
      settings: this.settings
    };
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications() {
    this.activeNotifications.clear();
    this.notificationQueue = [];
    this.notifyListeners('notifications_cleared', {});
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear active notifications
    this.activeNotifications.clear();
    
    // Clear queue
    this.notificationQueue = [];
    
    // Clear listeners
    this.notificationListeners.clear();
    
    // Close broadcast channels
    broadcastService.closeChannel(CHANNELS.NOTIFICATIONS);
    
    this.isInitialized = false;
  }
}

// Create singleton instance
const crossDeviceNotifications = new CrossDeviceNotifications();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  crossDeviceNotifications.initialize();
}

export default crossDeviceNotifications;
export { CrossDeviceNotifications };

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    crossDeviceNotifications.cleanup();
  });
}