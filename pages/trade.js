import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'TRADE', icon: '💱', route: '/trade' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'WALLETS', icon: '👛', route: '/wallets' },
];

export default function Trade() {
  const router = useRouter();
  const [market, setMarket] = useState([]);
  const [pair, setPair] = useState('BTC/USDT');
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('buy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/market')
      .then(res => res.json())
      .then(setMarket)
      .catch(() => setError('Failed to fetch market data'))
      .finally(() => setLoading(false));
  }, []);

  const price = market.find(m => m.name === pair)?.price || 0;
  const handleTrade = e => {
    e.preventDefault();
    alert(`${side === 'buy' ? 'Buy' : 'Sell'} ${amount} ${pair.split('/')[0]} at ${price} USDT`);
    setAmount('');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-extrabold tracking-widest mb-4">TRADE</h1>
        <div className="rounded-2xl bg-[#181c23] p-4 mb-4">
          <div className="text-lg font-bold mb-2">Trade {pair}</div>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">{error}</div>
          ) : (
            <form onSubmit={handleTrade} className="space-y-4">
              <div className="flex gap-2 mb-2">
                <select value={pair} onChange={e => setPair(e.target.value)} className="bg-black border border-gray-700 rounded px-3 py-2 text-white">
                  {market.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
                <button type="button" className={`px-4 py-2 rounded font-bold ${side === 'buy' ? 'bg-green-500' : 'bg-gray-700'}`} onClick={() => setSide('buy')}>Buy</button>
                <button type="button" className={`px-4 py-2 rounded font-bold ${side === 'sell' ? 'bg-red-500' : 'bg-gray-700'}`} onClick={() => setSide('sell')}>Sell</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Price:</label>
                <span className="font-mono text-base">{price}</span>
              </div>
              <div>
                <label className="block text-sm mb-1">Amount</label>
                <input className="w-full border rounded px-3 py-2 text-black" value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="any" required />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Total:</span>
                <span className="font-mono text-base">{(Number(amount) * Number(price)).toFixed(6)}</span>
              </div>
              <button type="submit" className="w-full py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-700">Confirm {side === 'buy' ? 'Buy' : 'Sell'}</button>
            </form>
          )}
        </div>
        <div className="rounded-2xl bg-[#181c23] p-4">
          <div className="text-lg font-bold mb-2">Recent Trades</div>
          {/* Replace with real trade data if available */}
          <div className="text-xs text-gray-400">No recent trades yet.</div>
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