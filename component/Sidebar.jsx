import { useState } from 'react';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    color: 'blue',
    description: 'Overview & Analytics'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: '👥',
    color: 'green',
    description: 'Manage Users & KYC',
    subItems: [
      { id: 'user-list', label: 'User List', icon: '📋' },
      { id: 'kyc', label: 'KYC Verification', icon: '✅' },
      { id: 'duplicates', label: 'Duplicate Detection', icon: '🔍' }
    ]
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: '💳',
    color: 'purple',
    description: 'Payment & Withdrawals'
  },
  {
    id: 'funds',
    label: 'Fund Management',
    icon: '💰',
    color: 'yellow',
    description: 'Balance & Operations'
  },
  {
    id: 'mining',
    label: 'Mining Finance',
    icon: '⛏️',
    color: 'orange',
    description: 'Mining Operations'
  },
  {
    id: 'system',
    label: 'System Settings',
    icon: '⚙️',
    color: 'gray',
    description: 'Configuration & Security'
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: '🛠️',
    color: 'indigo',
    description: 'Admin Operations'
  }
];

export const Sidebar = ({ sidebarOpen, setSidebarOpen, currentView, setCurrentView }) => {
  const [expandedItems, setExpandedItems] = useState(['users']);

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (itemId) => {
    setCurrentView(itemId);
    setSidebarOpen(false);
  };

  const handleSubItemClick = (itemId) => {
    setCurrentView(itemId);
    setSidebarOpen(false);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-100',
      green: 'bg-green-500 text-green-100',
      purple: 'bg-purple-500 text-purple-100',
      yellow: 'bg-yellow-500 text-yellow-100',
      orange: 'bg-orange-500 text-orange-100',
      gray: 'bg-gray-500 text-gray-100',
      indigo: 'bg-indigo-500 text-indigo-100'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quantex</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.subItems) {
                    toggleExpanded(item.id);
                  } else {
                    handleItemClick(item.id);
                  }
                }}
                className={`
                  w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200
                  ${currentView === item.id 
                    ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getColorClasses(item.color)}`}>
                    <span className="text-sm">{item.icon}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </div>
                {item.subItems && (
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      expandedItems.includes(item.id) ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Sub-items */}
              {item.subItems && expandedItems.includes(item.id) && (
                <div className="ml-12 mt-2 space-y-1">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleSubItemClick(subItem.id)}
                      className={`
                        w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                        ${currentView === subItem.id 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-gray-50 text-gray-600'
                        }
                      `}
                    >
                      <span className="text-sm">{subItem.icon}</span>
                      <span className="text-sm font-medium">{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">👤</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-500">admin</div>
            </div>
            <button className="p-1 hover:bg-gray-200 rounded">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}; 