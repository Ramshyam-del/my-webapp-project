/**
 * Notification Center Component
 * Displays and manages cross-device notifications
 */

import React, { useState, useEffect } from 'react';
import { useNotificationDisplay, useNotificationSettings } from '../../hooks/useCrossDeviceNotifications';
import NotificationItem from './NotificationItem';
import NotificationSettings from './NotificationSettings';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
  const {
    displayedNotifications,
    dismissNotification,
    dismissAll,
    hasNotifications
  } = useNotificationDisplay();
  
  const { stats } = useNotificationSettings();
  const [activeTab, setActiveTab] = useState('notifications');
  const [filter, setFilter] = useState('all');

  // Filter notifications based on selected filter
  const filteredNotifications = displayedNotifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'urgent') return notification.priority === 'urgent';
    if (filter === 'trades') {
      return ['trade_executed', 'trade_failed', 'order_filled', 'order_cancelled'].includes(notification.type);
    }
    if (filter === 'balance') {
      return ['deposit_received', 'withdrawal_processed', 'balance_low'].includes(notification.type);
    }
    if (filter === 'alerts') {
      return ['price_alert', 'security_alert', 'portfolio_milestone'].includes(notification.type);
    }
    return true;
  });

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-center-header">
          <div className="notification-center-title">
            <h2>Notifications</h2>
            <span className="notification-count">
              {stats.activeNotifications} active
            </span>
          </div>
          <div className="notification-center-actions">
            {hasNotifications && (
              <button
                className="btn-clear-all"
                onClick={dismissAll}
                title="Clear all notifications"
              >
                Clear All
              </button>
            )}
            <button
              className="btn-close"
              onClick={onClose}
              title="Close notification center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="notification-center-tabs">
          <button
            className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
            {stats.activeNotifications > 0 && (
              <span className="tab-badge">{stats.activeNotifications}</span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="notification-center-content">
          {activeTab === 'notifications' ? (
            <>
              {/* Filters */}
              <div className="notification-filters">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread</option>
                  <option value="urgent">Urgent</option>
                  <option value="trades">Trades & Orders</option>
                  <option value="balance">Balance & Transactions</option>
                  <option value="alerts">Alerts & Security</option>
                </select>
              </div>

              {/* Notification List */}
              <div className="notification-list">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDismiss={dismissNotification}
                    />
                  ))
                ) : (
                  <div className="no-notifications">
                    <div className="no-notifications-icon">🔔</div>
                    <h3>No notifications</h3>
                    <p>
                      {filter === 'all'
                        ? "You're all caught up!"
                        : `No ${filter} notifications`}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <NotificationSettings />
          )}
        </div>

        {/* Footer */}
        <div className="notification-center-footer">
          <div className="notification-stats">
            <span>Permission: {stats.permissionStatus}</span>
            <span>•</span>
            <span>Service Worker: {stats.isServiceWorkerRegistered ? 'Active' : 'Inactive'}</span>
            {stats.queuedNotifications > 0 && (
              <>
                <span>•</span>
                <span>{stats.queuedNotifications} queued</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;