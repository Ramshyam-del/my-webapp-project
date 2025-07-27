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

export const DashboardCards = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 px-2 sm:px-0">
      {defaultCards.map((card) => (
        <div
          key={card.key}
          className={`rounded-xl shadow-lg p-5 sm:p-6 bg-gradient-to-br ${card.gradient} text-white flex flex-col items-start justify-between min-h-[100px] sm:min-h-[120px]`}
        >
          <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{card.title}</div>
          <div className="text-xl sm:text-2xl font-bold">
            {loading
              ? '...'
              : metrics && metrics[card.key] !== undefined
                ? (typeof metrics[card.key] === 'number'
                    ? metrics[card.key].toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : metrics[card.key])
                : 'N/A'}
          </div>
        </div>
      ))}
    </div>
  );
}; 