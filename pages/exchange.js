import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSafeDocument } from '../utils/safeStorage';

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
  { label: 'TRADE', icon: '💱', route: '/trade' },
];

export default function ExchangePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'trade',
      title: 'Trade Completed',
      message: 'Your BTC/USDT trade has been completed successfully!',
      time: '2 minutes ago',
      isRead: false,
      icon: '💰'
    },
    {
      id: 2,
      type: 'system',
      title: 'System Update',
      message: 'New trading features have been added to the platform.',
      time: '1 hour ago',
      isRead: false,
      icon: '⚙️'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Price Alert',
      message: 'BTC has reached your target price of $45,000!',
      time: '3 hours ago',
      isRead: true,
      icon: '📈'
    },
    {
      id: 4,
      type: 'bonus',
      title: 'Welcome Bonus',
      message: 'You have received a $50 welcome bonus!',
      time: '1 day ago',
      isRead: true,
      icon: '🎁'
    }
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    const document = getSafeDocument();
    if (showNotifications && document) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      const document = getSafeDocument();
      if (document) {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [showNotifications]);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Random chance to add a new notification
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const newNotification = {
          id: Date.now(),
          type: ['trade', 'system', 'alert', 'bonus'][Math.floor(Math.random() * 4)],
          title: 'New Update',
          message: 'You have a new notification from the system.',
          time: 'Just now',
          isRead: false,
          icon: '🔔'
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep max 10 notifications
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trade': return '💰';
      case 'system': return '⚙️';
      case 'alert': return '📈';
      case 'bonus': return '🎁';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'trade': return 'text-green-500';
      case 'system': return 'text-blue-500';
      case 'alert': return 'text-yellow-500';
      case 'bonus': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#181c23]">
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-2xl font-extrabold tracking-widest text-white bg-blue-900 px-2 py-1 rounded">Quantex</span>
        </div>
        
        {/* Notification Button */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v10.5a2 2 0 01-2 2h-11z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1a1d24] border border-gray-700 rounded-lg shadow-xl z-50">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    <div className="text-4xl mb-2">🔕</div>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-gray-800/50' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`text-xl ${getNotificationColor(notification.type)}`}>
                          {notification.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-white">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-full text-center text-sm text-blue-400 hover:text-blue-300"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-3 sm:p-4 flex flex-col items-center rounded-b-2xl">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-2xl sm:text-4xl">🚀</div>
          <div>
            <div className="text-base sm:text-lg font-bold">Welcome to Quantex</div>
            <div className="text-xs text-blue-100">Your gateway to cryptocurrency trading</div>
          </div>
        </div>
      </div>
      
      {/* Navigation - Mobile Responsive */}
      <nav className="flex bg-[#181c23] px-2 sm:px-4 py-2 border-b border-gray-800 overflow-x-auto">
        {navTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.route)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              router.pathname === tab.route
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="text-sm sm:text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Main Content */}
      <div className="flex-1 bg-black p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Quantex</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The ultimate cryptocurrency trading platform with advanced features and real-time market data
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/market')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105"
              >
                View Market
              </button>
              <button 
                onClick={() => router.push('/features')}
                className="bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200"
              >
                Start Trading
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-3">Live Market Data</h3>
              <p className="text-gray-400">
                Real-time cryptocurrency prices and market information from CoinMarketCap API
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">Advanced Trading</h3>
              <p className="text-gray-400">
                Professional trading interface with BUY UP/BUY FALL options
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-white mb-3">Secure Platform</h3>
              <p className="text-gray-400">
                Enterprise-grade security with Supabase authentication
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-white mb-3">Portfolio Tracking</h3>
              <p className="text-gray-400">
                Monitor your investments and track performance over time
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">💱</div>
              <h3 className="text-xl font-bold text-white mb-3">Multiple Cryptocurrencies</h3>
              <p className="text-gray-400">
                Trade Bitcoin, Ethereum, and 9+ other cryptocurrencies
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-white mb-3">Mobile Responsive</h3>
              <p className="text-gray-400">
                Trade anywhere with our mobile-optimized interface
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gray-900 rounded-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">Platform Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">11+</div>
                <div className="text-gray-400">Cryptocurrencies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">24/7</div>
                <div className="text-gray-400">Market Data</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">100%</div>
                <div className="text-gray-400">Secure</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">Real-time</div>
                <div className="text-gray-400">Trading</div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Start Trading?</h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join thousands of traders who trust Quantex for their cryptocurrency trading needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/features')}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200"
              >
                Get Started Now
              </button>
              <button 
                onClick={() => router.push('/market')}
                className="bg-transparent border-2 border-gray-500 text-gray-300 hover:border-white hover:text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200"
              >
                Explore Market
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 