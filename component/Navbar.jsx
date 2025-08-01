import { useState, useEffect } from 'react';
import { AuthWrapper } from './AuthWrapper';
import WalletConnectButton from './WalletConnectButton';

export const Navbar = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Smooth scroll for anchor links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAuthenticated(!!localStorage.getItem('token'));
    }
  }, []);

  // Load notifications from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated) {
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        const storedNotifications = JSON.parse(localStorage.getItem(`notifications_${userEmail}`) || '[]');
        setNotifications(storedNotifications);
        setUnreadCount(storedNotifications.filter(n => !n.read).length);
      }
    }
  }, [isAuthenticated]);

  // Listen for new notifications
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== 'undefined' && isAuthenticated) {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          const storedNotifications = JSON.parse(localStorage.getItem(`notifications_${userEmail}`) || '[]');
          setNotifications(storedNotifications);
          setUnreadCount(storedNotifications.filter(n => !n.read).length);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.location.reload();
  };

  const markAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    
    // Update localStorage
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      localStorage.setItem(`notifications_${userEmail}`, JSON.stringify(updatedNotifications));
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    // Update localStorage
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      localStorage.setItem(`notifications_${userEmail}`, JSON.stringify(updatedNotifications));
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    
    // Clear localStorage
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      localStorage.removeItem(`notifications_${userEmail}`);
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <nav className="flex justify-between items-center p-6 px-8 sticky top-0 bg-black bg-opacity-70 z-50 backdrop-blur-sm">
      <div className="flex items-center">
        {/* Exact isometric Y logo SVG */}
        <svg viewBox="0 0 120 140" width="48" height="48" xmlns="http://www.w3.org/2000/svg" className="mr-3">
          {/* Top Left Cube */}
          <g>
            <polygon points="30,35 45,26 60,35 45,44" fill="#2196F3"/>
            <polygon points="30,35 45,44 45,62 30,53" fill="#1976D2"/>
            <polygon points="60,35 45,44 45,62 60,53" fill="#1565C0"/>
          </g>
          {/* Top Center Cube */}
          <g>
            <polygon points="45,26 60,17 75,26 60,35" fill="#2196F3"/>
            <polygon points="45,26 60,35 60,53 45,44" fill="#1976D2"/>
            <polygon points="75,26 60,35 60,53 75,44" fill="#1565C0"/>
          </g>
          {/* Top Right Cube */}
          <g>
            <polygon points="60,35 75,26 90,35 75,44" fill="#2196F3"/>
            <polygon points="60,35 75,44 75,62 60,53" fill="#1976D2"/>
            <polygon points="90,35 75,44 75,62 90,53" fill="#1565C0"/>
          </g>
          {/* Middle Left Cube */}
          <g>
            <polygon points="30,53 45,62 60,71 45,80" fill="#2196F3"/>
            <polygon points="30,53 45,80 45,98 30,89" fill="#1976D2"/>
            <polygon points="60,71 45,80 45,98 60,89" fill="#1565C0"/>
          </g>
          {/* Center Cube */}
          <g>
            <polygon points="45,44 60,53 75,44 60,35" fill="#2196F3"/>
            <polygon points="45,44 60,53 60,71 45,62" fill="#1976D2"/>
            <polygon points="75,44 60,53 60,71 75,62" fill="#1565C0"/>
          </g>
          {/* Middle Right Cube */}
          <g>
            <polygon points="60,53 75,62 90,53 75,44" fill="#2196F3"/>
            <polygon points="60,53 75,44 75,62 60,71" fill="#1976D2"/>
            <polygon points="90,53 75,62 75,80 90,71" fill="#1565C0"/>
          </g>
          {/* Bottom Left Cube */}
          <g>
            <polygon points="30,89 45,98 60,107 45,116" fill="#2196F3"/>
            <polygon points="30,89 45,116 45,134 30,125" fill="#1976D2"/>
            <polygon points="60,107 45,116 45,134 60,125" fill="#1565C0"/>
          </g>
          {/* Bottom Center Cube */}
          <g>
            <polygon points="45,80 60,89 75,80 60,71" fill="#2196F3"/>
            <polygon points="45,80 60,71 60,89 45,98" fill="#1976D2"/>
            <polygon points="75,80 60,71 60,89 75,98" fill="#1565C0"/>
          </g>
          {/* Bottom Right Cube */}
          <g>
            <polygon points="60,89 75,98 90,89 75,80" fill="#2196F3"/>
            <polygon points="60,89 75,80 75,98 60,107" fill="#1976D2"/>
            <polygon points="90,89 75,98 75,116 90,107" fill="#1565C0"/>
          </g>
        </svg>
        <span className="text-3xl font-bold text-blue-600 tracking-widest select-none" style={{ letterSpacing: '2px' }}>
          QUANTEX
        </span>
      </div>
      <div className="flex items-center gap-4">
        <a href="#features" className="hidden md:inline hover:text-cyan-400 text-white">Features</a>
        <a href="#roadmap" className="hidden md:inline hover:text-cyan-400 text-white">Roadmap</a>
        <a href="#tokenomics" className="hidden md:inline hover:text-cyan-400 text-white">Tokenomics</a>
        <WalletConnectButton />
        
        {/* Notification Icon - Always visible */}
        <div className="relative notification-dropdown z-10">
          <button
            onClick={() => {
              if (isAuthenticated) {
                setShowNotifications(!showNotifications);
              } else {
                setShowAuth(true);
              }
            }}
            className="relative p-3 text-white hover:text-cyan-400 transition-colors border border-transparent hover:border-cyan-400 rounded-lg bg-black bg-opacity-20 hover:bg-opacity-30"
            title="Notifications"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V9.75a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 002.25 9.75v7.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            {isAuthenticated && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
            
            {/* Notification Dropdown - Only show when authenticated */}
            {isAuthenticated && showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center space-x-2">
                      {notifications.length > 0 && (
                        <>
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Mark all read
                          </button>
                          <button
                            onClick={clearNotifications}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Clear all
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V9.75a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 002.25 9.75v7.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                      <p className="text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border-l-4 ${
                            notification.read 
                              ? 'bg-gray-50 border-gray-300' 
                              : 'bg-blue-50 border-blue-500'
                          } hover:bg-gray-100 transition-colors cursor-pointer`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                notification.read ? 'text-gray-700' : 'text-gray-900'
                              }`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatNotificationTime(notification.timestamp)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        
        {isAuthenticated ? (
          <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="bg-gray-800 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg transition" onClick={() => setShowAuth(true)}>
            Login
          </button>
        )}
      </div>
      {showAuth && (
        <AuthWrapper setShowAuth={setShowAuth} />
      )}
    </nav>
  );
}; 