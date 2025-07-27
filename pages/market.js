import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'TRADE', icon: '💱', route: '/trade' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'WALLETS', icon: '👛', route: '/wallets' },
];

export default function Market() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/market')
      .then(res => res.json())
      .then(setData)
      .catch(() => setError('Failed to fetch market data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-extrabold tracking-widest mb-4">MARKET</h1>
        <div className="rounded-2xl bg-[#181c23] p-4">
          <div className="text-lg font-bold mb-2">Market Data</div>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">{error}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="py-2 text-left">NAME</th>
                  <th className="py-2 text-right">LAST PRICE</th>
                  <th className="py-2 text-right">24H CHG%</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.name} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="py-2 text-left">{row.name}</td>
                    <td className="py-2 text-right">{row.price}</td>
                    <td className={`py-2 text-right ${row.change < 0 ? 'text-red-400' : 'text-green-400'}`}>{row.change > 0 ? '+' : ''}{row.change?.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <nav className="flex justify-between items-center bg-[#181c23] px-2 py-2 border-t border-gray-800 mt-auto">
        {navTabs.map(tab => (
          <NavButton
            key={tab.label}
            icon={tab.icon}
            label={tab.label}
            active={router.pathname === tab.route}
            onClick={() => router.push(tab.route)}
          />
        ))}
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      className={`flex flex-col items-center flex-1 py-1 ${active ? 'text-green-400' : 'text-gray-400'}`}
      onClick={onClick}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
} 