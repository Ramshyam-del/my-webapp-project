import { useEffect, useState } from 'react';

const defaultCards = [
  { key: 'totalUsers', title: 'Total Users', gradient: 'from-cyan-400 to-blue-500' },
  { key: 'totalRecharge', title: 'Total Recharge Amount', gradient: 'from-green-400 to-cyan-500' },
  { key: 'totalWithdrawals', title: 'Total Withdrawals', gradient: 'from-pink-400 to-red-500' },
  { key: 'todayRegistered', title: 'Today Registered Users', gradient: 'from-yellow-400 to-orange-500' },
  { key: 'todayRecharge', title: 'Today Recharge Amount', gradient: 'from-purple-400 to-pink-500' },
  { key: 'todayWithdrawals', title: 'Today Withdrawal Amount', gradient: 'from-indigo-400 to-purple-500' },
  { key: 'todayContractVolume', title: 'Today Seconds Contract Volume', gradient: 'from-blue-400 to-cyan-600' },
];

export const DashboardCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      changeType: 'positive',
      icon: '👥',
      color: 'blue',
      description: 'Registered users'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: '+8%',
      changeType: 'positive',
      icon: '🟢',
      color: 'green',
      description: 'Online today'
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      change: '+23%',
      changeType: 'positive',
      icon: '💳',
      color: 'purple',
      description: 'This month'
    },
    {
      title: 'Total Recharge',
      value: `$${stats.totalRecharge.toLocaleString()}`,
      change: '+15%',
      changeType: 'positive',
      icon: '💰',
      color: 'yellow',
      description: 'Total deposits'
    },
    {
      title: 'Total Withdrawals',
      value: `$${stats.totalWithdrawals.toLocaleString()}`,
      change: '+5%',
      changeType: 'positive',
      icon: '💸',
      color: 'orange',
      description: 'Total withdrawals'
    },
    {
      title: 'Pending KYC',
      value: stats.pendingKYC,
      change: '-3',
      changeType: 'negative',
      icon: '⏳',
      color: 'red',
      description: 'Awaiting verification'
    }
  ];

  const getColorClasses = (color, type = 'bg') => {
    const colors = {
      blue: type === 'bg' ? 'bg-blue-500' : 'text-blue-600',
      green: type === 'bg' ? 'bg-green-500' : 'text-green-600',
      purple: type === 'bg' ? 'bg-purple-500' : 'text-purple-600',
      yellow: type === 'bg' ? 'bg-yellow-500' : 'text-yellow-600',
      orange: type === 'bg' ? 'bg-orange-500' : 'text-orange-600',
      red: type === 'bg' ? 'bg-red-500' : 'text-red-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-10 h-10 ${getColorClasses(card.color)} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-lg">{card.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">{card.description}</p>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-xs text-gray-500">from last month</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 