import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useRealTimeBalance = () => {
  const { user, session } = useAuth();
  const [balances, setBalances] = useState({});
  const [totalBalance, setTotalBalance] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!user || !session?.access_token) {
      console.log('No user or session available for WebSocket connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // Use backend URL for WebSocket connection
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? backendUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/balance'
        : 'ws://localhost:4001/ws/balance';
      
      console.log('Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Authenticate with the server
        wsRef.current.send(JSON.stringify({
          type: 'authenticate',
          userId: user.id,
          token: session.access_token
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [user, session]);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'auth_success':
        console.log('WebSocket authentication successful');
        // Subscribe to balance updates
        wsRef.current.send(JSON.stringify({
          type: 'subscribe_balance',
          userId: user.id
        }));
        break;

      case 'auth_error':
        console.error('WebSocket authentication failed:', data.message);
        setIsConnected(false);
        break;

      case 'subscription_success':
        console.log('Successfully subscribed to balance updates');
        break;

      case 'balance_update':
        console.log('Balance update received:', data);
        setBalances(data.balances || {});
        setTotalBalance(data.totalBalance || 0);
        setLastUpdate(new Date(data.timestamp));
        break;

      case 'transaction_notification':
        console.log('Transaction notification received:', data);
        setTransactions(prev => [data.transaction, ...prev.slice(0, 9)]); // Keep last 10 transactions
        
        // Show toast notification for new transactions
        if (typeof window !== 'undefined' && window.showTransactionToast) {
          window.showTransactionToast(data.transaction);
        }
        break;

      case 'error':
        console.error('WebSocket error message:', data.message);
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [user]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const refreshBalance = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_balance',
        userId: user.id
      }));
    }
  }, [user]);

  // Connect when user is available
  useEffect(() => {
    if (user && session?.access_token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, session, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && session?.access_token) {
        // Reconnect if page becomes visible and we're not connected
        if (!isConnected) {
          connect();
        } else {
          // Refresh balance when page becomes visible
          refreshBalance();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, session, isConnected, connect, refreshBalance]);

  return {
    balances,
    totalBalance,
    isConnected,
    lastUpdate,
    transactions,
    refreshBalance,
    connect,
    disconnect
  };
};

export default useRealTimeBalance;