import { useState } from 'react';
import { useRouter } from 'next/navigation';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    color: 'blue',
    description: 'Overview & Analytics',
    route: '/admin'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: '👥',
    color: 'green',
    description: 'Manage Users & KYC',
    route: '/admin/users',
    subItems: [
      { id: 'user-list', label: 'User List', icon: '📋', route: '/admin/users' },
      { id: 'kyc', label: 'KYC Verification', icon: '✅', route: '/admin/kyc' },
      { id: 'duplicates', label: 'Duplicate Detection', icon: '🔍', route: '/admin/duplicates' }
    ]
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: '💳',
    color: 'purple',
    description: 'Payment & Withdrawals',
    route: '/admin/transactions'
  },
  {
    id: 'funds',
    label: 'Fund Management',
    icon: '💰',
    color: 'yellow',
    description: 'Balance & Operations',
    route: '/admin/funds'
  },
  {
    id: 'mining',
    label: 'Mining Finance',
    icon: '⛏️',
    color: 'orange',
    description: 'Mining Operations',
    route: '/admin/mining'
  },
  {
    id: 'system',
    label: 'System Settings',
    icon: '⚙️',
    color: 'gray',
    description: 'Configuration & Security',
    route: '/admin/system'
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: '🛠️',
    color: 'indigo',
    description: 'Admin Operations',
    route: '/admin/operate'
  }
];

export default function AdminSidebar({ sidebarOpen, setSidebarOpen, currentPath }) {
  const [expandedItems, setExpandedItems] = useState(['users']);
  const router = useRouter();

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (route) => {
    router.push(route);
    setSidebarOpen(false);
  };

  const handleSubItemClick = (route) => {
    router.push(route);
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

  const isActive = (route) => {
    if (route === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(route);
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
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Quantex</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.id}>
              {/* Main Menu Item */}
              <button
                onClick={() => {
                  if (item.subItems) {
                    toggleExpanded(item.id);
                  } else {
                    handleItemClick(item.route);
                  }
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors duration-200
                  ${isActive(item.route) 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getColorClasses(item.color)}`}>
                    <span className="text-sm">{item.icon}</span>
                  </div>
                  <div>
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

              {/* Sub Items */}
              {item.subItems && expandedItems.includes(item.id) && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleSubItemClick(subItem.route)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors duration-200
                        ${isActive(subItem.route) 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>Admin Panel v2.0</p>
            <p className="mt-1">Secure & Efficient</p>
          </div>
        </div>
      </div>
    </>
  );
} 