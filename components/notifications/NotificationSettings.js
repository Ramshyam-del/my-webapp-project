/**
 * Notification Settings Component
 * Allows users to configure notification preferences
 */

import React, { useState } from 'react';
import { useNotificationSettings } from '../../hooks/useCrossDeviceNotifications';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const {
    settings,
    stats,
    isUpdating,
    updateNotificationSettings,
    toggleNotificationType,
    updateQuietHours,
    enableBrowserNotifications
  } = useNotificationSettings();

  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Handle setting changes
  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  // Handle type setting changes
  const handleTypeSettingChange = (type, key, value) => {
    const newSettings = {
      ...localSettings,
      typeSettings: {
        ...localSettings.typeSettings,
        [type]: {
          ...localSettings.typeSettings[type],
          [key]: value
        }
      }
    };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  // Handle quiet hours change
  const handleQuietHoursChange = (key, value) => {
    const newQuietHours = {
      ...localSettings.quietHours,
      [key]: value
    };
    const newSettings = {
      ...localSettings,
      quietHours: newQuietHours
    };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    try {
      await updateNotificationSettings(localSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Reset settings
  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  // Enable browser notifications
  const handleEnableBrowserNotifications = async () => {
    try {
      await enableBrowserNotifications();
    } catch (error) {
      console.error('Failed to enable browser notifications:', error);
    }
  };

  // Notification type labels
  const typeLabels = {
    trade_executed: 'Trade Executed',
    trade_failed: 'Trade Failed',
    order_filled: 'Order Filled',
    order_cancelled: 'Order Cancelled',
    deposit_received: 'Deposit Received',
    withdrawal_processed: 'Withdrawal Processed',
    balance_low: 'Low Balance Alert',
    price_alert: 'Price Alerts',
    security_alert: 'Security Alerts',
    system_maintenance: 'System Maintenance',
    session_expired: 'Session Expired',
    login_detected: 'Login Detected',
    portfolio_milestone: 'Portfolio Milestones'
  };

  return (
    <div className="notification-settings">
      {/* General Settings */}
      <div className="settings-section">
        <h3>General Settings</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Browser Notifications</label>
            <p>Show notifications in your browser</p>
          </div>
          <div className="setting-control">
            {stats.permissionStatus === 'granted' ? (
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localSettings.enableBrowserNotifications}
                  onChange={(e) => handleSettingChange('enableBrowserNotifications', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            ) : (
              <button
                className="btn-enable-notifications"
                onClick={handleEnableBrowserNotifications}
              >
                Enable Notifications
              </button>
            )}
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Cross-Device Sync</label>
            <p>Sync notifications across all your devices</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localSettings.enableCrossDeviceSync}
                onChange={(e) => handleSettingChange('enableCrossDeviceSync', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Sound Alerts</label>
            <p>Play sounds for notifications</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localSettings.enableSoundAlerts}
                onChange={(e) => handleSettingChange('enableSoundAlerts', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Push Notifications</label>
            <p>Receive push notifications when app is closed</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localSettings.enablePushNotifications}
                onChange={(e) => handleSettingChange('enablePushNotifications', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="settings-section">
        <h3>Quiet Hours</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Enable Quiet Hours</label>
            <p>Suppress non-urgent notifications during specified hours</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localSettings.quietHours.enabled}
                onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {localSettings.quietHours.enabled && (
          <div className="quiet-hours-config">
            <div className="time-inputs">
              <div className="time-input">
                <label>Start Time</label>
                <input
                  type="time"
                  value={localSettings.quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                />
              </div>
              <div className="time-input">
                <label>End Time</label>
                <input
                  type="time"
                  value={localSettings.quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="settings-section">
        <h3>Notification Types</h3>
        <p>Configure which types of notifications you want to receive</p>
        
        <div className="notification-types">
          {Object.entries(localSettings.typeSettings).map(([type, typeSettings]) => (
            <div key={type} className="notification-type">
              <div className="type-header">
                <div className="type-info">
                  <h4>{typeLabels[type] || type}</h4>
                  <span className={`priority-badge priority-${typeSettings.priority}`}>
                    {typeSettings.priority}
                  </span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={typeSettings.enabled}
                    onChange={(e) => handleTypeSettingChange(type, 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              {typeSettings.enabled && (
                <div className="type-settings">
                  <div className="type-setting">
                    <label>Sound</label>
                    <label className="toggle-switch small">
                      <input
                        type="checkbox"
                        checked={typeSettings.sound}
                        onChange={(e) => handleTypeSettingChange(type, 'sound', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="type-setting">
                    <label>Priority</label>
                    <select
                      value={typeSettings.priority}
                      onChange={(e) => handleTypeSettingChange(type, 'priority', e.target.value)}
                      className="priority-select"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="settings-section">
        <h3>System Status</h3>
        
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Permission Status</span>
            <span className={`status-value status-${stats.permissionStatus}`}>
              {stats.permissionStatus}
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Service Worker</span>
            <span className={`status-value status-${stats.isServiceWorkerRegistered ? 'active' : 'inactive'}`}>
              {stats.isServiceWorkerRegistered ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Active Notifications</span>
            <span className="status-value">
              {stats.activeNotifications}
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Queued Notifications</span>
            <span className="status-value">
              {stats.queuedNotifications}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <button
          className="btn-reset"
          onClick={handleReset}
          disabled={!hasChanges || isUpdating}
        >
          Reset
        </button>
        
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={!hasChanges || isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;