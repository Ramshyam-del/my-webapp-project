/**
 * Conflict Manager Component
 * Displays and manages session conflicts with resolution options
 */

import React, { useState, useCallback } from 'react';
import { useSessionConflictResolver, useConflictMonitor } from '../../hooks/useSessionConflictResolver.js';
import './ConflictManager.css';

const ConflictManager = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolutionStrategy, setResolutionStrategy] = useState('');
  const [userChoice, setUserChoice] = useState(null);

  const {
    conflicts,
    pendingActions,
    stats,
    isLoading,
    error,
    resolveConflict
  } = useSessionConflictResolver();

  const {
    history,
    getConflictsByType,
    getResolutionStats
  } = useConflictMonitor();

  const handleResolveConflict = useCallback(async (conflictId, strategy = null, choice = null) => {
    try {
      await resolveConflict(conflictId, strategy, choice);
      setSelectedConflict(null);
      setResolutionStrategy('');
      setUserChoice(null);
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
    }
  }, [resolveConflict]);

  const handleUserChoiceSelection = useCallback((actionId) => {
    setUserChoice({ selectedActionId: actionId });
  }, []);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionTypeIcon = (type) => {
    const icons = {
      trade_execution: '💱',
      portfolio_modification: '📊',
      balance_update: '💰',
      settings_update: '⚙️',
      watchlist_modification: '👁️',
      alert_management: '🔔'
    };
    return icons[type] || '📝';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#dc2626',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#6b7280'
    };
    return colors[priority] || colors.medium;
  };

  const renderConflictItem = (conflict) => {
    const isSelected = selectedConflict?.id === conflict.id;
    
    return (
      <div 
        key={conflict.id}
        className={`conflict-item ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedConflict(conflict)}
      >
        <div className="conflict-header">
          <div className="conflict-info">
            <span className="conflict-icon">
              {getActionTypeIcon(conflict.type)}
            </span>
            <div className="conflict-details">
              <h4>{conflict.type.replace('_', ' ').toUpperCase()}</h4>
              <p>{conflict.actions.length} sessions involved</p>
            </div>
          </div>
          <div className="conflict-meta">
            <span 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(conflict.priority) }}
            >
              {conflict.priority}
            </span>
            <span className="conflict-time">
              {formatTimestamp(conflict.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="conflict-strategy">
          <span>Strategy: {conflict.strategy.replace('_', ' ')}</span>
          {conflict.requiresConfirmation && (
            <span className="requires-confirmation">Requires Confirmation</span>
          )}
        </div>

        {isSelected && (
          <ConflictDetails 
            conflict={conflict}
            onResolve={handleResolveConflict}
            onUserChoice={handleUserChoiceSelection}
            resolutionStrategy={resolutionStrategy}
            setResolutionStrategy={setResolutionStrategy}
            userChoice={userChoice}
          />
        )}
      </div>
    );
  };

  const renderPendingAction = (action) => {
    return (
      <div key={action.id} className="pending-action">
        <div className="action-header">
          <span className="action-icon">
            {getActionTypeIcon(action.type)}
          </span>
          <div className="action-details">
            <h4>{action.type.replace('_', ' ').toUpperCase()}</h4>
            <p>Session: {action.sessionId}</p>
          </div>
          <span className="action-time">
            {formatTimestamp(action.timestamp)}
          </span>
        </div>
        <div className="action-status">
          <span className={`status-badge status-${action.status}`}>
            {action.status}
          </span>
        </div>
      </div>
    );
  };

  const renderHistoryItem = (conflict) => {
    return (
      <div key={conflict.id} className="history-item">
        <div className="history-header">
          <span className="history-icon">
            {getActionTypeIcon(conflict.type)}
          </span>
          <div className="history-details">
            <h4>{conflict.type.replace('_', ' ').toUpperCase()}</h4>
            <p>Resolved: {conflict.resolution?.strategy || conflict.strategy}</p>
          </div>
          <span className="history-time">
            {formatTimestamp(conflict.resolvedAt || conflict.createdAt)}
          </span>
        </div>
        <div className="history-resolution">
          {conflict.resolution?.winningSessionId && (
            <span>Winner: {conflict.resolution.winningSessionId}</span>
          )}
          {conflict.resolution?.mergedData && (
            <span>Data merged successfully</span>
          )}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const resolutionStats = getResolutionStats();
    
    return (
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Active Conflicts</span>
          <span className="stat-value">{stats.activeConflicts}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Actions</span>
          <span className="stat-value">{stats.pendingActions}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Resolved</span>
          <span className="stat-value">{stats.totalResolved}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Resolution Rate</span>
          <span className="stat-value">
            {stats.totalResolved > 0 ? 
              Math.round((stats.totalResolved / (stats.totalResolved + stats.activeConflicts)) * 100) : 0
            }%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="conflict-manager">
      <div className="conflict-manager-header">
        <h2>Session Conflict Manager</h2>
        <button className="btn-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="conflict-tabs">
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Conflicts ({conflicts.length})
        </button>
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Actions ({pendingActions.length})
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History ({history.length})
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      <div className="conflict-content">
        {isLoading && (
          <div className="loading-indicator">
            <span>Loading...</span>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="conflicts-list">
            {conflicts.length === 0 ? (
              <div className="empty-state">
                <span>🎉</span>
                <h3>No Active Conflicts</h3>
                <p>All sessions are working in harmony!</p>
              </div>
            ) : (
              conflicts.map(renderConflictItem)
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="pending-list">
            {pendingActions.length === 0 ? (
              <div className="empty-state">
                <span>📝</span>
                <h3>No Pending Actions</h3>
                <p>No actions are currently being processed.</p>
              </div>
            ) : (
              pendingActions.map(renderPendingAction)
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-state">
                <span>📚</span>
                <h3>No Conflict History</h3>
                <p>No conflicts have been resolved yet.</p>
              </div>
            ) : (
              history.map(renderHistoryItem)
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-view">
            {renderStats()}
            <div className="resolution-strategies">
              <h3>Available Resolution Strategies</h3>
              <div className="strategies-list">
                {stats.resolutionStrategies.map(strategy => (
                  <div key={strategy} className="strategy-item">
                    <span className="strategy-name">{strategy.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Conflict Details Component
const ConflictDetails = ({ 
  conflict, 
  onResolve, 
  onUserChoice, 
  resolutionStrategy, 
  setResolutionStrategy, 
  userChoice 
}) => {
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await onResolve(
        conflict.id, 
        resolutionStrategy || conflict.strategy, 
        userChoice
      );
    } finally {
      setIsResolving(false);
    }
  };

  const availableStrategies = [
    { value: 'first_wins', label: 'First Wins' },
    { value: 'last_wins', label: 'Last Wins' },
    { value: 'merge', label: 'Merge Data' },
    { value: 'user_choice', label: 'User Choice' }
  ];

  return (
    <div className="conflict-details">
      <h4>Conflict Details</h4>
      
      <div className="actions-involved">
        <h5>Actions Involved:</h5>
        {conflict.actions.map((action, index) => (
          <div key={index} className="action-summary">
            <div className="action-info">
              <span>Session: {action.sessionId}</span>
              <span>Time: {new Date(action.timestamp).toLocaleTimeString()}</span>
            </div>
            {conflict.strategy === 'user_choice' && (
              <button
                className={`btn-select-action ${
                  userChoice?.selectedActionId === action.id ? 'selected' : ''
                }`}
                onClick={() => onUserChoice(action.id)}
              >
                {userChoice?.selectedActionId === action.id ? 'Selected' : 'Select'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="resolution-controls">
        <div className="strategy-selector">
          <label>Resolution Strategy:</label>
          <select 
            value={resolutionStrategy || conflict.strategy}
            onChange={(e) => setResolutionStrategy(e.target.value)}
          >
            {availableStrategies.map(strategy => (
              <option key={strategy.value} value={strategy.value}>
                {strategy.label}
              </option>
            ))}
          </select>
        </div>

        <div className="resolution-actions">
          <button 
            className="btn-resolve"
            onClick={handleResolve}
            disabled={isResolving || (resolutionStrategy === 'user_choice' && !userChoice)}
          >
            {isResolving ? 'Resolving...' : 'Resolve Conflict'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictManager;