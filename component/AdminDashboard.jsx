"use client"

import Link from 'next/link';

const dashboardCards = [
  {
    title: 'Manage Users',
    description: 'View and manage user accounts, roles, and permissions',
    icon: '👥',
    href: '/admin/users',
    color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  },
  {
    title: 'Process Requests',
    description: 'Review and approve withdrawal requests from users',
    icon: '💰',
    href: '/admin/users?tab=withdrawals',
    color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
  },
  {
    title: 'Win/Loss Management',
    description: 'Manage trade outcomes and view performance metrics',
    icon: '📈',
    href: '/admin/users?tab=winloss',
    color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
  },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Welcome section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome to Admin Dashboard</h2>
        <p className="text-sm sm:text-base text-gray-600">Manage your platform's users, transactions, and operations</p>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {dashboardCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group block"
          >
            <div className={`
              relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 
              hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              touch-manipulation
              ${card.color}
            `}>
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl">{card.icon}</span>
                  <svg 
                    className="h-4 w-4 sm:h-5 sm:w-5 opacity-0 group-hover:opacity-100 transition-opacity" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick stats */}
      <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Users</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl sm:text-2xl">⏳</span>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending Requests</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Trades</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Volume</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}