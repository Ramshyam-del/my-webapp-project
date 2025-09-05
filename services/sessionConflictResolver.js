/**
 * Session Conflict Resolution Service
 * Handles conflicts when multiple browser sessions perform simultaneous actions
 */

import broadcastService from './broadcastService.js';
import crossBrowserAuth from './crossBrowserAuth.js';
import realTimeStateSync from './realTimeStateSync.js';
import crossDeviceNotifications from './crossDeviceNotifications.js';

class SessionConflictResolver {
  constructor() {
    this.conflicts = new Map();
    this.pendingActions = new Map();
    this.resolutionStrategies = new Map();
    this.conflictHistory = [];
    this.maxHistorySize = 100;
    this.conflictTimeout = 30000; // 30 seconds
    
    this.setupConflictTypes();
    this.setupBroadcastListeners();
    this.setupCleanupInterval();
  }

  setupConflictTypes() {
    // Define conflict resolution strategies for different action types
    this.resolutionStrategies.set('trade_execution', {
      strategy: 'first_wins',
      requiresConfirmation: true,
      priority: 'high',
      timeout: 10000
    });

    this.resolutionStrategies.set('balance_update', {
      strategy: 'merge',
      requiresConfirmation: false,
      priority: 'medium',
      timeout: 5000
    });

    this.resolutionStrategies.set('portfolio_modification', {
      strategy: 'last_wins',
      requiresConfirmation: true,
      priority: 'high',
      timeout: 15000
    });

    this.resolutionStrategies.set('settings_update', {
      strategy: 'merge',
      requiresConfirmation: false,
      priority: 'low',
      timeout: 20000
    });

    this.resolutionStrategies.set('watchlist_modification', {
      strategy: 'merge',
      requiresConfirmation: false,
      priority: 'low',
      timeout: 10000
    });

    this.resolutionStrategies.set('alert_management', {
      strategy: 'merge',
      requiresConfirmation: false,
      priority: 'medium',
      timeout: 10000
    });
  }

  setupBroadcastListeners() {
    // Listen for conflict-related messages
    broadcastService.addListener('conflict_detected', this.handleConflictDetected.bind(this));
    broadcastService.addListener('conflict_resolution', this.handleConflictResolution.bind(this));
    broadcastService.addListener('action_lock_request', this.handleActionLockRequest.bind(this));
    broadcastService.addListener('action_lock_release', this.handleActionLockRelease.bind(this));
    broadcastService.addListener('session_action_start', this.handleSessionActionStart.bind(this));
    broadcastService.addListener('session_action_complete', this.handleSessionActionComplete.bind(this));
  }

  setupCleanupInterval() {
    // Clean up expired conflicts and pending actions
    setInterval(() => {
      this.cleanupExpiredConflicts();
      this.cleanupExpiredActions();
    }, 5000);
  }

  /**
   * Register an action before execution to detect conflicts
   */
  async registerAction(actionType, actionData, sessionId = null) {
    const currentSession = sessionId || crossBrowserAuth.getCurrentSessionId();
    const actionId = this.generateActionId(actionType, actionData);
    const timestamp = Date.now();

    const action = {
      id: actionId,
      type: actionType,
      data: actionData,
      sessionId: currentSession,
      timestamp,
      status: 'pending'
    };

    // Check for existing conflicts
    const existingConflict = this.detectConflict(action);
    if (existingConflict) {
      return this.handleConflict(action, existingConflict);
    }

    // Register the action
    this.pendingActions.set(actionId, action);

    // Broadcast action start to other sessions
    broadcastService.broadcast('session_action_start', {
      actionId,
      actionType,
      sessionId: currentSession,
      timestamp,
      data: this.sanitizeActionData(actionData)
    });

    return {
      actionId,
      canProceed: true,
      conflictId: null
    };
  }

  /**
   * Complete an action and notify other sessions
   */
  async completeAction(actionId, result = null, error = null) {
    const action = this.pendingActions.get(actionId);
    if (!action) {
      console.warn('Attempting to complete unknown action:', actionId);
      return;
    }

    action.status = error ? 'failed' : 'completed';
    action.result = result;
    action.error = error;
    action.completedAt = Date.now();

    // Broadcast completion
    broadcastService.broadcast('session_action_complete', {
      actionId,
      sessionId: action.sessionId,
      status: action.status,
      result: this.sanitizeActionData(result),
      error: error?.message
    });

    // Remove from pending actions
    this.pendingActions.delete(actionId);

    // Update state sync if successful
    if (!error && result) {
      this.syncActionResult(action.type, result);
    }
  }

  /**
   * Detect conflicts between actions
   */
  detectConflict(newAction) {
    for (const [actionId, existingAction] of this.pendingActions) {
      if (this.actionsConflict(newAction, existingAction)) {
        return {
          conflictId: this.generateConflictId(newAction, existingAction),
          existingAction,
          newAction
        };
      }
    }

    return null;
  }

  /**
   * Check if two actions conflict
   */
  actionsConflict(action1, action2) {
    // Same session actions don't conflict
    if (action1.sessionId === action2.sessionId) {
      return false;
    }

    // Check type-specific conflicts
    switch (action1.type) {
      case 'trade_execution':
        return this.tradeActionsConflict(action1, action2);
      case 'portfolio_modification':
        return this.portfolioActionsConflict(action1, action2);
      case 'balance_update':
        return this.balanceActionsConflict(action1, action2);
      case 'settings_update':
        return this.settingsActionsConflict(action1, action2);
      default:
        return false;
    }
  }

  tradeActionsConflict(action1, action2) {
    if (action2.type !== 'trade_execution') return false;
    
    // Conflict if trading the same symbol with insufficient balance
    return action1.data.symbol === action2.data.symbol &&
           (action1.data.side === 'sell' || action2.data.side === 'sell');
  }

  portfolioActionsConflict(action1, action2) {
    if (action2.type !== 'portfolio_modification') return false;
    
    // Conflict if modifying the same portfolio item
    return action1.data.portfolioId === action2.data.portfolioId ||
           action1.data.symbol === action2.data.symbol;
  }

  balanceActionsConflict(action1, action2) {
    if (action2.type !== 'balance_update') return false;
    
    // Conflict if updating the same currency
    return action1.data.currency === action2.data.currency;
  }

  settingsActionsConflict(action1, action2) {
    if (action2.type !== 'settings_update') return false;
    
    // Conflict if updating the same setting key
    return action1.data.key === action2.data.key;
  }

  /**
   * Handle detected conflict
   */
  async handleConflict(newAction, conflictInfo) {
    const conflictId = conflictInfo.conflictId;
    const strategy = this.resolutionStrategies.get(newAction.type);

    if (!strategy) {
      console.warn('No resolution strategy for action type:', newAction.type);
      return { canProceed: false, conflictId, error: 'No resolution strategy' };
    }

    // Create conflict record
    const conflict = {
      id: conflictId,
      type: newAction.type,
      strategy: strategy.strategy,
      actions: [conflictInfo.existingAction, newAction],
      createdAt: Date.now(),
      status: 'pending',
      requiresConfirmation: strategy.requiresConfirmation,
      priority: strategy.priority
    };

    this.conflicts.set(conflictId, conflict);

    // Broadcast conflict detection
    broadcastService.broadcast('conflict_detected', {
      conflictId,
      type: newAction.type,
      strategy: strategy.strategy,
      requiresConfirmation: strategy.requiresConfirmation,
      actions: conflict.actions.map(a => ({
        sessionId: a.sessionId,
        timestamp: a.timestamp,
        data: this.sanitizeActionData(a.data)
      }))
    });

    // Auto-resolve if no confirmation required
    if (!strategy.requiresConfirmation) {
      return this.autoResolveConflict(conflict);
    }

    // Notify user about conflict
    await this.notifyConflict(conflict);

    return {
      canProceed: false,
      conflictId,
      requiresConfirmation: true,
      strategy: strategy.strategy
    };
  }

  /**
   * Auto-resolve conflicts that don't require user confirmation
   */
  async autoResolveConflict(conflict) {
    const resolution = await this.resolveConflict(conflict.id, conflict.strategy);
    return {
      canProceed: resolution.canProceed,
      conflictId: conflict.id,
      resolution
    };
  }

  /**
   * Resolve a conflict using the specified strategy
   */
  async resolveConflict(conflictId, strategy = null, userChoice = null) {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error('Conflict not found: ' + conflictId);
    }

    const resolutionStrategy = strategy || conflict.strategy;
    let resolution;

    switch (resolutionStrategy) {
      case 'first_wins':
        resolution = this.resolveFirstWins(conflict);
        break;
      case 'last_wins':
        resolution = this.resolveLastWins(conflict);
        break;
      case 'merge':
        resolution = this.resolveMerge(conflict);
        break;
      case 'user_choice':
        resolution = this.resolveUserChoice(conflict, userChoice);
        break;
      default:
        throw new Error('Unknown resolution strategy: ' + resolutionStrategy);
    }

    // Update conflict status
    conflict.status = 'resolved';
    conflict.resolution = resolution;
    conflict.resolvedAt = Date.now();

    // Broadcast resolution
    broadcastService.broadcast('conflict_resolution', {
      conflictId,
      strategy: resolutionStrategy,
      resolution,
      timestamp: Date.now()
    });

    // Add to history
    this.addToHistory(conflict);

    // Clean up
    this.conflicts.delete(conflictId);

    return resolution;
  }

  resolveFirstWins(conflict) {
    const sortedActions = conflict.actions.sort((a, b) => a.timestamp - b.timestamp);
    const winningAction = sortedActions[0];
    
    return {
      canProceed: true,
      winningSessionId: winningAction.sessionId,
      winningAction: winningAction.id,
      rejectedActions: sortedActions.slice(1).map(a => a.id)
    };
  }

  resolveLastWins(conflict) {
    const sortedActions = conflict.actions.sort((a, b) => b.timestamp - a.timestamp);
    const winningAction = sortedActions[0];
    
    return {
      canProceed: true,
      winningSessionId: winningAction.sessionId,
      winningAction: winningAction.id,
      rejectedActions: sortedActions.slice(1).map(a => a.id)
    };
  }

  resolveMerge(conflict) {
    // Attempt to merge conflicting actions
    const mergedData = this.mergeActionData(conflict.actions);
    
    return {
      canProceed: true,
      strategy: 'merge',
      mergedData,
      allActions: conflict.actions.map(a => a.id)
    };
  }

  resolveUserChoice(conflict, userChoice) {
    if (!userChoice || !userChoice.selectedActionId) {
      throw new Error('User choice required for resolution');
    }

    const selectedAction = conflict.actions.find(a => a.id === userChoice.selectedActionId);
    if (!selectedAction) {
      throw new Error('Invalid action selection');
    }

    return {
      canProceed: true,
      winningSessionId: selectedAction.sessionId,
      winningAction: selectedAction.id,
      rejectedActions: conflict.actions.filter(a => a.id !== selectedAction.id).map(a => a.id),
      userChoice: true
    };
  }

  /**
   * Merge action data for merge strategy
   */
  mergeActionData(actions) {
    const actionType = actions[0].type;
    
    switch (actionType) {
      case 'settings_update':
        return this.mergeSettings(actions);
      case 'watchlist_modification':
        return this.mergeWatchlist(actions);
      case 'alert_management':
        return this.mergeAlerts(actions);
      default:
        // Default merge: use latest timestamp for each field
        return this.mergeByLatestField(actions);
    }
  }

  mergeSettings(actions) {
    const merged = {};
    const timestamps = {};
    
    actions.forEach(action => {
      Object.entries(action.data.settings || {}).forEach(([key, value]) => {
        if (!timestamps[key] || action.timestamp > timestamps[key]) {
          merged[key] = value;
          timestamps[key] = action.timestamp;
        }
      });
    });
    
    return { settings: merged, timestamps };
  }

  mergeWatchlist(actions) {
    const symbols = new Set();
    const operations = [];
    
    actions.forEach(action => {
      if (action.data.operation === 'add') {
        symbols.add(action.data.symbol);
        operations.push({ type: 'add', symbol: action.data.symbol, timestamp: action.timestamp });
      } else if (action.data.operation === 'remove') {
        symbols.delete(action.data.symbol);
        operations.push({ type: 'remove', symbol: action.data.symbol, timestamp: action.timestamp });
      }
    });
    
    return { symbols: Array.from(symbols), operations };
  }

  mergeAlerts(actions) {
    const alerts = new Map();
    
    actions.forEach(action => {
      if (action.data.operation === 'create' || action.data.operation === 'update') {
        alerts.set(action.data.alertId, {
          ...action.data.alert,
          timestamp: action.timestamp
        });
      } else if (action.data.operation === 'delete') {
        alerts.delete(action.data.alertId);
      }
    });
    
    return { alerts: Array.from(alerts.values()) };
  }

  mergeByLatestField(actions) {
    const merged = {};
    const timestamps = {};
    
    actions.forEach(action => {
      Object.entries(action.data).forEach(([key, value]) => {
        if (!timestamps[key] || action.timestamp > timestamps[key]) {
          merged[key] = value;
          timestamps[key] = action.timestamp;
        }
      });
    });
    
    return merged;
  }

  /**
   * Notify users about conflicts
   */
  async notifyConflict(conflict) {
    const message = this.generateConflictMessage(conflict);
    
    await crossDeviceNotifications.sendNotification({
      type: 'system',
      title: 'Action Conflict Detected',
      message,
      priority: conflict.priority,
      data: {
        conflictId: conflict.id,
        type: conflict.type,
        requiresConfirmation: conflict.requiresConfirmation
      },
      actions: conflict.requiresConfirmation ? [
        { id: 'resolve', label: 'Resolve Conflict' },
        { id: 'cancel', label: 'Cancel Action' }
      ] : []
    });
  }

  generateConflictMessage(conflict) {
    const actionCount = conflict.actions.length;
    const actionType = conflict.type.replace('_', ' ');
    
    return `${actionCount} sessions are attempting to perform ${actionType} simultaneously. ` +
           `Resolution strategy: ${conflict.strategy.replace('_', ' ')}.`;
  }

  /**
   * Event handlers
   */
  handleConflictDetected(data) {
    console.log('Conflict detected in another session:', data);
    // Update UI to show conflict status
  }

  handleConflictResolution(data) {
    console.log('Conflict resolved:', data);
    // Update UI and sync state if needed
  }

  handleActionLockRequest(data) {
    // Handle requests for exclusive action locks
    console.log('Action lock requested:', data);
  }

  handleActionLockRelease(data) {
    // Handle action lock releases
    console.log('Action lock released:', data);
  }

  handleSessionActionStart(data) {
    // Track actions started in other sessions
    console.log('Session action started:', data);
  }

  handleSessionActionComplete(data) {
    // Handle action completion from other sessions
    console.log('Session action completed:', data);
    
    // Sync state if needed
    if (data.status === 'completed' && data.result) {
      this.syncRemoteActionResult(data);
    }
  }

  /**
   * Utility methods
   */
  generateActionId(actionType, actionData) {
    const hash = this.hashObject({ type: actionType, data: actionData, timestamp: Date.now() });
    return `action_${hash}_${Date.now()}`;
  }

  generateConflictId(action1, action2) {
    const hash = this.hashObject({
      type: action1.type,
      sessions: [action1.sessionId, action2.sessionId].sort(),
      timestamp: Date.now()
    });
    return `conflict_${hash}`;
  }

  hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  sanitizeActionData(data) {
    if (!data) return null;
    
    // Remove sensitive information
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    
    return sanitized;
  }

  syncActionResult(actionType, result) {
    // Sync successful action results with state sync service
    switch (actionType) {
      case 'balance_update':
        realTimeStateSync.syncState('balance', result);
        break;
      case 'portfolio_modification':
        realTimeStateSync.syncState('portfolio', result);
        break;
      case 'settings_update':
        realTimeStateSync.syncState('preferences', result);
        break;
    }
  }

  syncRemoteActionResult(actionData) {
    // Sync results from remote sessions
    if (actionData.result) {
      this.syncActionResult(actionData.actionType, actionData.result);
    }
  }

  addToHistory(conflict) {
    this.conflictHistory.unshift({
      ...conflict,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.conflictHistory.length > this.maxHistorySize) {
      this.conflictHistory = this.conflictHistory.slice(0, this.maxHistorySize);
    }
  }

  cleanupExpiredConflicts() {
    const now = Date.now();
    
    for (const [conflictId, conflict] of this.conflicts) {
      if (now - conflict.createdAt > this.conflictTimeout) {
        console.warn('Conflict expired:', conflictId);
        this.conflicts.delete(conflictId);
      }
    }
  }

  cleanupExpiredActions() {
    const now = Date.now();
    
    for (const [actionId, action] of this.pendingActions) {
      const strategy = this.resolutionStrategies.get(action.type);
      const timeout = strategy?.timeout || 30000;
      
      if (now - action.timestamp > timeout) {
        console.warn('Action expired:', actionId);
        this.pendingActions.delete(actionId);
      }
    }
  }

  /**
   * Public API methods
   */
  getActiveConflicts() {
    return Array.from(this.conflicts.values());
  }

  getPendingActions() {
    return Array.from(this.pendingActions.values());
  }

  getConflictHistory() {
    return [...this.conflictHistory];
  }

  getConflictStats() {
    return {
      activeConflicts: this.conflicts.size,
      pendingActions: this.pendingActions.size,
      totalResolved: this.conflictHistory.length,
      resolutionStrategies: Array.from(this.resolutionStrategies.keys())
    };
  }
}

// Create and export singleton instance
export const sessionConflictResolver = new SessionConflictResolver();
export default sessionConflictResolver;