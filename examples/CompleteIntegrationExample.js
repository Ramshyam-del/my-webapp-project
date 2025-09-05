/**
 * Complete Integration Example
 * 
 * This file demonstrates how to integrate all cross-browser synchronization
 * features into a complete React application.
 */

import React, { useState, useEffect } from 'react';
import { CrossBrowserAuthProvider, useCrossBrowserAuthContext } from '../contexts/CrossBrowserAuthContext.js';
import { useRealTimeState, useBalanceSync, usePortfolioSync } from '../hooks/useRealTimeState.js';
import { useCrossDeviceNotifications, useTradeNotifications } from '../hooks/useCrossDeviceNotifications.js';
import { useTradeExecution, useConflictMonitor } from '../hooks/useSessionConflictResolver.js';
import NotificationCenter from '../components/notifications/NotificationCenter.js';
import ConflictManager from '../components/conflicts/ConflictManager.js';
import { broadcastService } from '../services/broadcastService.js';
import { realTimeStateSync } from '../services/realTimeStateSync.js';

// Initialize services
broadcastService.initialize();
realTimeStateSync.initialize();

/**
 * Main Application Component with Cross-Browser Sync
 */
function App() {
  return (
    <CrossBrowserAuthProvider>
      <div className="app">
        <Header />
        <MainContent />
        <NotificationSystem />
        <ConflictSystem />
      </div>
    </CrossBrowserAuthProvider>
  );
}

/**
 * Header Component with Authentication
 */
function Header() {
  const { user, signIn, signOut, isLoading, sessions } = useCrossBrowserAuthContext();
  const [showSessions, setShowSessions] = useState(false);

  const handleLogin = async (email, password) => {
    try {
      await signIn(email, password);
      // User will be automatically logged in across all browser instances
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <header className="header">
      <h1>Cross-Browser Sync Demo</h1>
      
      {user ? (
        <div className="user-info">
          <span>Welcome, {user.email}!</span>
          <button onClick={() => setShowSessions(!showSessions)}>
            Sessions ({sessions.length})
          </button>
          <button onClick={signOut}>Sign Out</button>
          
          {showSessions && (
            <div className="sessions-dropdown">
              {sessions.map(session => (
                <div key={session.id} className="session-item">
                  <span>{session.browser}</span>
                  <span>{new Date(session.lastActivity).toLocaleString()}</span>
                  {session.current && <span className="current">Current</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
      )}
    </header>
  );
}

/**
 * Login Form Component
 */
function LoginForm({ onSubmit, isLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}

/**
 * Main Content with Real-Time Sync Features
 */
function MainContent() {
  const { user } = useCrossBrowserAuthContext();

  if (!user) {
    return (
      <main className="main-content">
        <h2>Please sign in to access the application</h2>
      </main>
    );
  }

  return (
    <main className="main-content">
      <div className="dashboard">
        <UserPreferencesPanel />
        <BalancePanel />
        <PortfolioPanel />
        <TradingPanel />
      </div>
    </main>
  );
}

/**
 * User Preferences with Real-Time Sync
 */
function UserPreferencesPanel() {
  const {
    state: preferences,
    updateState: updatePreferences,
    isLoading,
    lastSync
  } = useRealTimeState('preferences', {
    theme: 'light',
    language: 'en',
    notifications: true,
    currency: 'USD'
  });

  const handlePreferenceChange = (key, value) => {
    updatePreferences({ [key]: value });
    // Change will be synchronized across all browser instances
  };

  return (
    <div className="panel preferences-panel">
      <h3>Preferences {isLoading && '(Syncing...)'}</h3>
      <p className="last-sync">Last sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</p>
      
      <div className="preference-item">
        <label>Theme:</label>
        <select 
          value={preferences.theme} 
          onChange={(e) => handlePreferenceChange('theme', e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      
      <div className="preference-item">
        <label>Language:</label>
        <select 
          value={preferences.language} 
          onChange={(e) => handlePreferenceChange('language', e.target.value)}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>
      
      <div className="preference-item">
        <label>
          <input
            type="checkbox"
            checked={preferences.notifications}
            onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
          />
          Enable Notifications
        </label>
      </div>
      
      <div className="preference-item">
        <label>Currency:</label>
        <select 
          value={preferences.currency} 
          onChange={(e) => handlePreferenceChange('currency', e.target.value)}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="BTC">BTC</option>
        </select>
      </div>
    </div>
  );
}

/**
 * Balance Panel with Real-Time Updates
 */
function BalancePanel() {
  const {
    balance,
    updateBalance,
    isLoading,
    lastSync
  } = useBalanceSync();

  // Simulate balance update
  const simulateDeposit = () => {
    const newBalance = {
      ...balance,
      USD: (balance.USD || 0) + 1000,
      lastUpdated: Date.now()
    };
    updateBalance(newBalance);
  };

  return (
    <div className="panel balance-panel">
      <h3>Balance {isLoading && '(Syncing...)'}</h3>
      <p className="last-sync">Last sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</p>
      
      <div className="balance-items">
        <div className="balance-item">
          <span className="currency">USD:</span>
          <span className="amount">${(balance.USD || 0).toLocaleString()}</span>
        </div>
        <div className="balance-item">
          <span className="currency">BTC:</span>
          <span className="amount">{(balance.BTC || 0).toFixed(8)}</span>
        </div>
        <div className="balance-item">
          <span className="currency">ETH:</span>
          <span className="amount">{(balance.ETH || 0).toFixed(6)}</span>
        </div>
      </div>
      
      <button onClick={simulateDeposit} className="deposit-btn">
        Simulate $1000 Deposit
      </button>
    </div>
  );
}

/**
 * Portfolio Panel with Real-Time Sync
 */
function PortfolioPanel() {
  const {
    portfolio,
    updatePortfolio,
    isLoading,
    lastSync
  } = usePortfolioSync();

  const addPosition = (symbol, amount, price) => {
    const newPortfolio = {
      ...portfolio,
      positions: {
        ...portfolio.positions,
        [symbol]: {
          amount: (portfolio.positions?.[symbol]?.amount || 0) + amount,
          avgPrice: price,
          lastUpdated: Date.now()
        }
      }
    };
    updatePortfolio(newPortfolio);
  };

  return (
    <div className="panel portfolio-panel">
      <h3>Portfolio {isLoading && '(Syncing...)'}</h3>
      <p className="last-sync">Last sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</p>
      
      <div className="positions">
        {portfolio.positions && Object.entries(portfolio.positions).map(([symbol, position]) => (
          <div key={symbol} className="position-item">
            <span className="symbol">{symbol}:</span>
            <span className="amount">{position.amount}</span>
            <span className="price">${position.avgPrice}</span>
          </div>
        ))}
      </div>
      
      <button onClick={() => addPosition('BTC', 0.1, 45000)} className="add-position-btn">
        Add 0.1 BTC Position
      </button>
    </div>
  );
}

/**
 * Trading Panel with Conflict Resolution
 */
function TradingPanel() {
  const { sendTradeNotification } = useTradeNotifications();
  const {
    executeTrade,
    isExecuting,
    conflict,
    resolveConflict,
    error
  } = useTradeExecution();
  
  const [tradeForm, setTradeForm] = useState({
    symbol: 'BTC',
    side: 'buy',
    amount: 0.1,
    price: 45000
  });

  const handleTrade = async () => {
    const tradeData = {
      ...tradeForm,
      timestamp: Date.now(),
      id: `trade_${Date.now()}`
    };

    const result = await executeTrade(tradeData);
    
    if (result.success) {
      // Send success notification to all devices
      await sendTradeNotification({
        title: 'Trade Executed',
        message: `Successfully ${tradeData.side} ${tradeData.amount} ${tradeData.symbol}`,
        priority: 'high',
        data: { tradeId: result.tradeId }
      });
    } else if (result.conflict) {
      console.log('Trade conflict detected:', result.conflict);
    } else {
      // Send error notification
      await sendTradeNotification({
        title: 'Trade Failed',
        message: result.error || 'Unknown error occurred',
        priority: 'urgent'
      });
    }
  };

  const handleConflictResolution = async (strategy) => {
    await resolveConflict(strategy);
  };

  return (
    <div className="panel trading-panel">
      <h3>Trading</h3>
      
      <div className="trade-form">
        <div className="form-row">
          <label>Symbol:</label>
          <select 
            value={tradeForm.symbol} 
            onChange={(e) => setTradeForm({...tradeForm, symbol: e.target.value})}
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="ADA">ADA</option>
          </select>
        </div>
        
        <div className="form-row">
          <label>Side:</label>
          <select 
            value={tradeForm.side} 
            onChange={(e) => setTradeForm({...tradeForm, side: e.target.value})}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        
        <div className="form-row">
          <label>Amount:</label>
          <input
            type="number"
            step="0.001"
            value={tradeForm.amount}
            onChange={(e) => setTradeForm({...tradeForm, amount: parseFloat(e.target.value)})}
          />
        </div>
        
        <div className="form-row">
          <label>Price:</label>
          <input
            type="number"
            value={tradeForm.price}
            onChange={(e) => setTradeForm({...tradeForm, price: parseFloat(e.target.value)})}
          />
        </div>
        
        <button 
          onClick={handleTrade}
          disabled={isExecuting}
          className="execute-btn"
        >
          {isExecuting ? 'Executing...' : `${tradeForm.side.toUpperCase()} ${tradeForm.symbol}`}
        </button>
      </div>
      
      {conflict && (
        <div className="conflict-alert">
          <h4>Conflict Detected</h4>
          <p>Multiple sessions are trying to execute trades simultaneously.</p>
          <div className="conflict-actions">
            <button onClick={() => handleConflictResolution('first_wins')}>
              First Wins
            </button>
            <button onClick={() => handleConflictResolution('last_wins')}>
              Last Wins
            </button>
            <button onClick={() => handleConflictResolution('user_choice')}>
              Let Me Choose
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-alert">
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Notification System
 */
function NotificationSystem() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount } = useCrossDeviceNotifications();

  return (
    <div className="notification-system">
      <button 
        className="notification-toggle"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      
      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}

/**
 * Conflict Management System
 */
function ConflictSystem() {
  const [showConflicts, setShowConflicts] = useState(false);
  const { conflicts, pendingActions } = useConflictMonitor();
  const hasIssues = conflicts.length > 0 || pendingActions.length > 0;

  return (
    <div className="conflict-system">
      <button 
        className="conflict-toggle"
        onClick={() => setShowConflicts(!showConflicts)}
      >
        Conflicts {hasIssues && <span className="badge warning">{conflicts.length}</span>}
      </button>
      
      {showConflicts && (
        <ConflictManager onClose={() => setShowConflicts(false)} />
      )}
    </div>
  );
}

// CSS Styles (would typically be in a separate CSS file)
const styles = `
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

.sessions-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 250px;
}

.session-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.session-item:last-child {
  border-bottom: none;
}

.current {
  color: #007bff;
  font-weight: bold;
}

.login-form {
  display: flex;
  gap: 10px;
  align-items: center;
}

.login-form input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.panel {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.panel h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.last-sync {
  font-size: 12px;
  color: #666;
  margin-bottom: 15px;
}

.preference-item, .form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.preference-item label, .form-row label {
  font-weight: 500;
}

.balance-items, .positions {
  margin-bottom: 15px;
}

.balance-item, .position-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.currency, .symbol {
  font-weight: 500;
}

.amount, .price {
  font-family: monospace;
}

.trade-form {
  margin-bottom: 20px;
}

.execute-btn, .deposit-btn, .add-position-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.execute-btn:hover, .deposit-btn:hover, .add-position-btn:hover {
  background: #0056b3;
}

.execute-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.conflict-alert {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
}

.conflict-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.conflict-actions button {
  background: #ffc107;
  color: #212529;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.error-alert {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
  color: #721c24;
}

.notification-system, .conflict-system {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.conflict-system {
  top: 70px;
}

.notification-toggle, .conflict-toggle {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 20px;
  cursor: pointer;
  position: relative;
}

.conflict-toggle {
  background: #dc3545;
}

.badge {
  background: #dc3545;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  margin-left: 5px;
}

.badge.warning {
  background: #ffc107;
  color: #212529;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default App;