import { useEffect } from 'react';
import { useRouter } from 'next/router';

const marketData = [
  { name: 'BTC/USDT', icon: '₿', price: '116031.94', change: -3.20 },
  { name: 'ETH/USDT', icon: 'Ξ', price: '2987.99', change: -0.79 },
  { name: 'BNB/USDT', icon: '🟡', price: '679.35', change: -1.89 },
  { name: 'SOL/USDT', icon: '🟦', price: '158.5107', change: -3.28 },
  { name: 'ADA/USDT', icon: '🟦', price: '0.717548', change: -2.26 },
];

const tickers = [
  { pair: 'BTC/USDT', price: '116031.94', change: -3.20 },
  { pair: 'ETH/USDT', price: '2987.99', change: -0.79 },
  { pair: 'BNB/USDT', price: '679.35', change: -1.89 },
];

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'TRADE', icon: '💱', route: '/trade' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'WALLETS', icon: '👛', route: '/wallets' },
];

export default function ExchangeDashboard() {
  const router = useRouter();
  useEffect(() => {
    // Optionally, require login here
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#181c23]">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-widest text-white bg-blue-900 px-2 py-1 rounded">Quantex</span>
        </div>
        <button className="relative">
          <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
          <span className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full border-2 border-[#181c23]" />
        </button>
      </header>
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 flex flex-col items-center rounded-b-2xl">
        <div className="flex items-center gap-4">
          <img src="/globe.png" alt="globe" className="w-16 h-16" />
          <div>
            <div className="text-lg font-bold">Global Exchange</div>
            <div className="text-xs text-blue-100">Global Business Service Network<br />Coverage, Invest in Global Encrypted</div>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex justify-between px-4 py-4 bg-[#181c23] rounded-b-2xl">
        <ActionButton icon="💰" label="DEPOSIT" />
        <ActionButton icon="💸" label="WITHDRAW" />
        <ActionButton icon="📈" label="STAKING" />
        <ActionButton icon="⚙️" label="SERVICES" />
      </div>
      {/* Market Tickers */}
      <div className="flex justify-between px-4 py-2 bg-black border-b border-gray-800">
        {tickers.map(t => (
          <div key={t.pair} className="flex flex-col items-center">
            <span className="text-xs text-gray-400">{t.pair}</span>
            <span className="font-bold text-sm">{t.price}</span>
            <span className={`text-xs ${t.change < 0 ? 'text-red-400' : 'text-green-400'}`}>{t.change > 0 ? '+' : ''}{t.change}%</span>
          </div>
        ))}
      </div>
      {/* Market Table */}
      <div className="flex-1 bg-[#181c23] px-2 py-4 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="py-2 text-left">NAME</th>
              <th className="py-2 text-right">LAST PRICE</th>
              <th className="py-2 text-right">24H CHG%</th>
            </tr>
          </thead>
          <tbody>
            {marketData.map(row => (
              <tr key={row.name} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="py-2 flex items-center gap-2">
                  <span className="text-xl">{row.icon}</span>
                  <span>{row.name}</span>
                </td>
                <td className="py-2 text-right">{row.price}</td>
                <td className={`py-2 text-right ${row.change < 0 ? 'text-red-400' : 'text-green-400'}`}>{row.change > 0 ? '+' : ''}{row.change}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Bottom Nav */}
      <nav className="flex justify-between items-center bg-[#181c23] px-2 py-2 border-t border-gray-800">
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

function ActionButton({ icon, label }) {
  return (
    <button className="flex flex-col items-center gap-1 flex-1">
      <span className="bg-[#222] rounded-full w-10 h-10 flex items-center justify-center text-2xl mb-1">{icon}</span>
      <span className="text-xs text-gray-200 font-semibold">{label}</span>
    </button>
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