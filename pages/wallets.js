import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'TRADE', icon: '💱', route: '/trade' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'WALLETS', icon: '👛', route: '/wallets' },
];

function DepositModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        <h2 className="text-lg font-bold mb-4">Deposit USDT</h2>
        <div className="mb-2 text-sm text-gray-700">Send USDT to this address:</div>
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs font-mono break-all">0x1234abcd5678efgh9012ijkl3456mnop7890qrst</div>
        <div className="flex justify-center mb-4">
          <img src="/qr-mock.png" alt="QR Code" className="w-32 h-32 bg-gray-200 rounded" />
        </div>
        <div className="text-xs text-gray-500">Only send USDT (ERC20) to this address.</div>
      </div>
    </div>
  );
}

function WithdrawModal({ open, onClose }) {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  useEffect(() => { setAddress(''); setAmount(''); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        <h2 className="text-lg font-bold mb-4">Withdraw USDT</h2>
        <form onSubmit={e => { e.preventDefault(); alert('Withdrawal request submitted!'); onClose(); }}>
          <div className="mb-4">
            <label className="block text-sm mb-1">Withdrawal Address</label>
            <input className="w-full border rounded px-3 py-2" value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Amount</label>
            <input className="w-full border rounded px-3 py-2" value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="any" required />
          </div>
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold w-full">Confirm Withdraw</button>
        </form>
      </div>
    </div>
  );
}

export default function Wallets() {
  const router = useRouter();
  const [assets, setAssets] = useState({ usdt: 304.56, btc: 0, eth: 0 });
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:4000/api/user/assets', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setAssets({
          usdt: data.usdt ?? 0,
          btc: data.btc ?? 0,
          eth: data.eth ?? 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-extrabold tracking-widest mb-4">WALLETS</h1>
        <div className="rounded-2xl bg-gradient-to-tr from-green-400 via-green-300 to-green-200 p-6 text-black relative mb-4">
          <div className="text-xs font-semibold mb-1 flex items-center gap-1">
            TOTAL ACCOUNT ASSETS (USDT)
            <span className="text-gray-700 cursor-pointer" title="Info">ⓘ</span>
            <span className="ml-auto text-gray-700 cursor-pointer" title="Show/Hide">👁️</span>
          </div>
          <div className="text-4xl font-bold mb-2">{loading ? '...' : assets.usdt.toFixed(2)}</div>
          <div className="flex justify-between mt-4">
            <button onClick={() => setDepositOpen(true)} className="flex items-center gap-1 bg-black bg-opacity-10 rounded-lg px-4 py-2 font-semibold text-black"><span>📥</span> DEPOSIT</button>
            <button onClick={() => setWithdrawOpen(true)} className="flex items-center gap-1 bg-black bg-opacity-10 rounded-lg px-4 py-2 font-semibold text-black"><span>📤</span> WITHDRAW</button>
          </div>
        </div>
        <div className="rounded-2xl bg-[#181c23] p-4">
          <div className="text-lg font-bold mb-2">ASSET LIST</div>
          <div className="mb-2 border-b border-gray-700 pb-2">
            <div className="text-base font-bold mb-1">USDT</div>
            <div className="flex justify-between text-xs text-gray-300">
              <div className="flex-1">AVAILABLE<br /><span className="text-white text-base font-mono">{loading ? '...' : assets.usdt.toFixed(6)}</span></div>
              <div className="flex-1 text-center">FROZEN<br /><span className="text-white text-base font-mono">0.000000</span></div>
              <div className="flex-1 text-right">≈USDT<br /><span className="text-white text-base font-mono">{loading ? '...' : assets.usdt.toFixed(6)}</span></div>
            </div>
          </div>
          <div className="mb-2 border-b border-gray-700 pb-2">
            <div className="text-base font-bold mb-1">BTC</div>
            <div className="flex justify-between text-xs text-gray-300">
              <div className="flex-1">AVAILABLE<br /><span className="text-white text-base font-mono">{loading ? '...' : assets.btc.toFixed(6)}</span></div>
              <div className="flex-1 text-center">FROZEN<br /><span className="text-white text-base font-mono">0.000000</span></div>
              <div className="flex-1 text-right">≈USDT<br /><span className="text-white text-base font-mono">{loading ? '...' : (assets.btc * 0).toFixed(6)}</span></div>
            </div>
          </div>
          <div className="mb-2 border-b border-gray-700 pb-2">
            <div className="text-base font-bold mb-1">ETH</div>
            <div className="flex justify-between text-xs text-gray-300">
              <div className="flex-1">AVAILABLE<br /><span className="text-white text-base font-mono">{loading ? '...' : assets.eth.toFixed(6)}</span></div>
              <div className="flex-1 text-center">FROZEN<br /><span className="text-white text-base font-mono">0.000000</span></div>
              <div className="flex-1 text-right">≈USDT<br /><span className="text-white text-base font-mono">{loading ? '...' : (assets.eth * 0).toFixed(6)}</span></div>
            </div>
          </div>
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