/**
 * React hooks for session conflict resolution
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionConflictResolver } from '../services/sessionConflictResolver.js';
import { broadcastService } from '../services/broadcastService.js';

/**
 * Main hook for session conflict resolution
 */
export function useSessionConflictResolver() {
  const [conflicts, setConflicts] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [stats, setStats] = useState({
    activeConflicts: 0,
    pendingActions: 0,
    totalResolved: 0,
    resolutionStrategies: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update state from service
  const updateState = useCallback(() => {
    setConflicts(sessionConflictResolver.getActiveConflicts());
    setPendingActions(sessionConflictResolver.getPendingActions());
    setStats(sessionConflictResolver.getConflictStats());
  }, []);

  // Listen for conflict events
  useEffect(() => {
    const handleConflictDetected = (data) => {
      updateState();
    };

    const handleConflictResolution = (data) => {
      updateState();
    };

    const handleActionStart = (data) => {
      updateState();
    };

    const handleActionComplete = (data) => {
      updateState();
    };

    broadcastService.addListener('conflict_detected', handleConflictDetected);
    broadcastService.addListener('conflict_resolution', handleConflictResolution);
    broadcastService.addListener('session_action_start', handleActionStart);
    broadcastService.addListener('session_action_complete', handleActionComplete);

    // Initial state update
    updateState();

    return () => {
      broadcastService.removeListener('conflict_detected', handleConflictDetected);
      broadcastService.removeListener('conflict_resolution', handleConflictResolution);
      broadcastService.removeListener('session_action_start', handleActionStart);
      broadcastService.removeListener('session_action_complete', handleActionComplete);
    };
  }, [updateState]);

  // Register an action
  const registerAction = useCallback(async (actionType, actionData, sessionId = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sessionConflictResolver.registerAction(actionType, actionData, sessionId);
      updateState();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  // Complete an action
  const completeAction = useCallback(async (actionId, result = null, error = null) => {
    try {
      await sessionConflictResolver.completeAction(actionId, result, error);
      updateState();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [updateState]);

  // Resolve a conflict
  const resolveConflict = useCallback(async (conflictId, strategy = null, userChoice = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const resolution = await sessionConflictResolver.resolveConflict(conflictId, strategy, userChoice);
      updateState();
      return resolution;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  return {
    conflicts,
    pendingActions,
    stats,
    isLoading,
    error,
    registerAction,
    completeAction,
    resolveConflict,
    refresh: updateState
  };
}

/**
 * Hook for managing action execution with conflict detection
 */
export function useConflictAwareAction(actionType, options = {}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [error, setError] = useState(null);
  const currentActionId = useRef(null);

  const { onConflict, onSuccess, onError, autoResolve = false } = options;

  const executeAction = useCallback(async (actionData, actionHandler) => {
    setIsExecuting(true);
    setConflict(null);
    setError(null);

    try {
      // Register the action
      const registration = await sessionConflictResolver.registerAction(actionType, actionData);
      currentActionId.current = registration.actionId;

      // Handle conflict
      if (!registration.canProceed) {
        setConflict({
          id: registration.conflictId,
          requiresConfirmation: registration.requiresConfirmation,
          strategy: registration.strategy
        });

        if (onConflict) {
          onConflict(registration);
        }

        // Auto-resolve if enabled and no confirmation required
        if (autoResolve && !registration.requiresConfirmation) {
          const resolution = await sessionConflictResolver.resolveConflict(registration.conflictId);
          if (resolution.canProceed) {
            return executeActionHandler(actionHandler, actionData);
          }
        }

        return { success: false, conflict: registration };
      }

      // Execute the action
      return executeActionHandler(actionHandler, actionData);
    } catch (err) {
      setError(err.message);
      if (onError) {
        onError(err);
      }
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [actionType, onConflict, onSuccess, onError, autoResolve]);

  const executeActionHandler = useCallback(async (actionHandler, actionData) => {
    try {
      const result = await actionHandler(actionData);
      
      // Complete the action
      if (currentActionId.current) {
        await sessionConflictResolver.completeAction(currentActionId.current, result);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, result };
    } catch (err) {
      // Complete the action with error
      if (currentActionId.current) {
        await sessionConflictResolver.completeAction(currentActionId.current, null, err);
      }
      throw err;
    }
  }, [onSuccess]);

  const resolveConflict = useCallback(async (strategy = null, userChoice = null) => {
    if (!conflict) {
      throw new Error('No active conflict to resolve');
    }

    try {
      const resolution = await sessionConflictResolver.resolveConflict(conflict.id, strategy, userChoice);
      setConflict(null);
      return resolution;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [conflict]);

  const cancelAction = useCallback(() => {
    setConflict(null);
    setError(null);
    currentActionId.current = null;
  }, []);

  return {
    isExecuting,
    conflict,
    error,
    executeAction,
    resolveConflict,
    cancelAction
  };
}

/**
 * Hook for monitoring conflict history and statistics
 */
export function useConflictMonitor() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    activeConflicts: 0,
    pendingActions: 0,
    totalResolved: 0,
    resolutionStrategies: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    try {
      setHistory(sessionConflictResolver.getConflictHistory());
      setStats(sessionConflictResolver.getConflictStats());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleConflictResolution = () => {
      refreshData();
    };

    broadcastService.addListener('conflict_resolution', handleConflictResolution);
    refreshData();

    return () => {
      broadcastService.removeListener('conflict_resolution', handleConflictResolution);
    };
  }, [refreshData]);

  const getConflictsByType = useCallback((type) => {
    return history.filter(conflict => conflict.type === type);
  }, [history]);

  const getResolutionStats = useCallback(() => {
    const strategies = {};
    history.forEach(conflict => {
      const strategy = conflict.resolution?.strategy || conflict.strategy;
      strategies[strategy] = (strategies[strategy] || 0) + 1;
    });
    return strategies;
  }, [history]);

  return {
    history,
    stats,
    isLoading,
    refreshData,
    getConflictsByType,
    getResolutionStats
  };
}

/**
 * Hook for trade execution with conflict resolution
 */
export function useTradeExecution() {
  const conflictAware = useConflictAwareAction('trade_execution', {
    autoResolve: false, // Trades should always require confirmation
    onConflict: (conflict) => {
      console.log('Trade conflict detected:', conflict);
    }
  });

  const executeTrade = useCallback(async (tradeData) => {
    return conflictAware.executeAction(tradeData, async (data) => {
      // Simulate trade execution
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Trade execution failed');
      }

      return response.json();
    });
  }, [conflictAware]);

  return {
    ...conflictAware,
    executeTrade
  };
}

/**
 * Hook for portfolio modifications with conflict resolution
 */
export function usePortfolioModification() {
  const conflictAware = useConflictAwareAction('portfolio_modification', {
    autoResolve: true, // Portfolio changes can be auto-resolved
    onConflict: (conflict) => {
      console.log('Portfolio conflict detected:', conflict);
    }
  });

  const modifyPortfolio = useCallback(async (portfolioData) => {
    return conflictAware.executeAction(portfolioData, async (data) => {
      // Simulate portfolio modification
      const response = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Portfolio modification failed');
      }

      return response.json();
    });
  }, [conflictAware]);

  return {
    ...conflictAware,
    modifyPortfolio
  };
}

/**
 * Hook for settings updates with conflict resolution
 */
export function useSettingsUpdate() {
  const conflictAware = useConflictAwareAction('settings_update', {
    autoResolve: true, // Settings can be auto-merged
    onConflict: (conflict) => {
      console.log('Settings conflict detected:', conflict);
    }
  });

  const updateSettings = useCallback(async (settingsData) => {
    return conflictAware.executeAction(settingsData, async (data) => {
      // Simulate settings update
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Settings update failed');
      }

      return response.json();
    });
  }, [conflictAware]);

  return {
    ...conflictAware,
    updateSettings
  };
}

/**
 * Hook for batch action execution with conflict resolution
 */
export function useBatchActions() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const executeBatch = useCallback(async (actions) => {
    setIsExecuting(true);
    setConflicts([]);
    setResults([]);
    setError(null);

    try {
      const batchResults = [];
      const batchConflicts = [];

      // Register all actions first
      for (const action of actions) {
        try {
          const registration = await sessionConflictResolver.registerAction(
            action.type,
            action.data
          );

          if (!registration.canProceed) {
            batchConflicts.push({
              action,
              conflict: registration
            });
          } else {
            batchResults.push({
              action,
              registration,
              status: 'registered'
            });
          }
        } catch (err) {
          batchResults.push({
            action,
            status: 'error',
            error: err.message
          });
        }
      }

      setConflicts(batchConflicts);
      setResults(batchResults);

      return {
        registered: batchResults.filter(r => r.status === 'registered'),
        conflicts: batchConflicts,
        errors: batchResults.filter(r => r.status === 'error')
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const resolveBatchConflicts = useCallback(async (resolutions) => {
    const resolvedConflicts = [];

    for (const resolution of resolutions) {
      try {
        const result = await sessionConflictResolver.resolveConflict(
          resolution.conflictId,
          resolution.strategy,
          resolution.userChoice
        );
        resolvedConflicts.push({ ...resolution, result });
      } catch (err) {
        resolvedConflicts.push({ ...resolution, error: err.message });
      }
    }

    // Update conflicts state
    setConflicts(prev => prev.filter(c => 
      !resolutions.some(r => r.conflictId === c.conflict.conflictId)
    ));

    return resolvedConflicts;
  }, []);

  return {
    isExecuting,
    conflicts,
    results,
    error,
    executeBatch,
    resolveBatchConflicts
  };
}