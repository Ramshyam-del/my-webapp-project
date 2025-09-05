/**
 * Individual Notification Item Component
 */

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import './NotificationItem.css';

const NotificationItem = ({ notification, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const {
    id,
    type,
    title,
    message,
    data,
    priority,
    timestamp,
    persistent,
    actions = []
  } = notification;

  // Get notification icon based on type
  const getNotificationIcon = () => {
    const iconMap = {
      trade_executed: '✅',
      trade_failed: '❌',
      order_filled: '📈',
      order_cancelled: '🚫',
      deposit_received: '💰',
      withdrawal_processed: '💸',
      balance_low: '⚠️',
      price_alert: '📊',
      security_alert: '🔒',
      system_maintenance: '🔧',
      session_expired: '⏰',
      login_detected: '👤',
      portfolio_milestone: '🎯'
    };
    
    return iconMap[type] || '🔔';
  };

  // Get priority class
  const getPriorityClass = () => {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'normal':
        return 'priority-normal';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-normal';
    }
  };

  // Handle dismiss with animation
  const handleDismiss = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300);
  };

  // Handle action click
  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick(notification);
    }
    
    // Auto-dismiss after action unless persistent
    if (!persistent) {
      handleDismiss();
    }
  };

  // Format timestamp
  const formatTime = () => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Just now';
    }
  };

  // Render additional data
  const renderAdditionalData = () => {
    if (!data || Object.keys(data).length === 0) return null;

    switch (type) {
      case 'trade_executed':
      case 'trade_failed':
        return (
          <div className="notification-trade-data">
            {data.symbol && <span className="trade-symbol">{data.symbol}</span>}
            {data.quantity && <span className="trade-quantity">{data.quantity}</span>}
            {data.price && <span className="trade-price">${data.price}</span>}
          </div>
        );
      
      case 'deposit_received':
      case 'withdrawal_processed':
        return (
          <div className="notification-balance-data">
            {data.amount && (
              <span className="balance-amount">
                ${data.amount.toFixed(2)}
              </span>
            )}
            {data.balance && (
              <span className="balance-total">
                Balance: ${data.balance.toFixed(2)}
              </span>
            )}
          </div>
        );
      
      case 'price_alert':
        return (
          <div className="notification-alert-data">
            {data.alert?.symbol && (
              <span className="alert-symbol">{data.alert.symbol}</span>
            )}
            {data.currentPrice && (
              <span className="alert-price">
                Current: ${data.currentPrice}
              </span>
            )}
            {data.alert?.targetPrice && (
              <span className="alert-target">
                Target: ${data.alert.targetPrice}
              </span>
            )}
          </div>
        );
      
      case 'portfolio_milestone':
        return (
          <div className="notification-milestone-data">
            {data.portfolioValue && (
              <span className="milestone-value">
                ${data.portfolioValue.toFixed(2)}
              </span>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className={`notification-item ${getPriorityClass()} ${isAnimating ? 'dismissing' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Main Content */}
      <div className="notification-main">
        <div className="notification-icon">
          {getNotificationIcon()}
        </div>
        
        <div className="notification-content">
          <div className="notification-header">
            <h4 className="notification-title">{title}</h4>
            <div className="notification-meta">
              <span className="notification-time">{formatTime()}</span>
              {persistent && (
                <span className="notification-persistent">📌</span>
              )}
            </div>
          </div>
          
          <p className="notification-message">{message}</p>
          
          {renderAdditionalData()}
          
          {/* Expanded Details */}
          {isExpanded && (
            <div className="notification-details">
              <div className="notification-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">Type:</span>
                  <span className="metadata-value">{type}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Priority:</span>
                  <span className="metadata-value">{priority}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Time:</span>
                  <span className="metadata-value">
                    {new Date(timestamp).toLocaleString()}
                  </span>
                </div>
                {data.deviceId && (
                  <div className="metadata-item">
                    <span className="metadata-label">Device:</span>
                    <span className="metadata-value">{data.deviceId}</span>
                  </div>
                )}
              </div>
              
              {/* Raw Data (for debugging) */}
              {process.env.NODE_ENV === 'development' && data && (
                <details className="notification-raw-data">
                  <summary>Raw Data</summary>
                  <pre>{JSON.stringify(data, null, 2)}</pre>
                </details>
              )}
            </div>
          )}
        </div>
        
        <div className="notification-actions">
          {/* Custom Actions */}
          {actions.length > 0 && (
            <div className="notification-custom-actions">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className={`notification-action ${action.style || 'primary'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(action);
                  }}
                  title={action.title}
                >
                  {action.icon && <span className="action-icon">{action.icon}</span>}
                  {action.title}
                </button>
              ))}
            </div>
          )}
          
          {/* Dismiss Button */}
          <button
            className="notification-dismiss"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            title="Dismiss notification"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Priority Indicator */}
      <div className="notification-priority-indicator"></div>
    </div>
  );
};

export default NotificationItem;