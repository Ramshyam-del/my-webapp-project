import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'SPOT', icon: '💱', route: '/spot' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'WALLETS', icon: '👛', route: '/wallets' },
];

function DepositModal({ open, onClose, walletAddresses }) {
  const [selectedCrypto, setSelectedCrypto] = useState('usdt');
  
  if (!open) return null;

  const cryptoOptions = [
    { value: 'usdt', label: 'USDT', icon: '💚', network: 'ERC-20 Token' },
    { value: 'btc', label: 'BTC', icon: '₿', network: 'Bitcoin Network' },
    { value: 'eth', label: 'ETH', icon: 'Ξ', network: 'Ethereum Network' }
  ];

  const currentAddress = walletAddresses[selectedCrypto];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        <h2 className="text-lg font-bold mb-4">Deposit {selectedCrypto.toUpperCase()}</h2>
        
        <div className="mb-4">
          <label className="block text-sm mb-2 font-medium">Select Cryptocurrency</label>
          <div className="grid grid-cols-3 gap-2">
            {cryptoOptions.map((crypto) => (
              <button
                key={crypto.value}
                type="button"
                onClick={() => setSelectedCrypto(crypto.value)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedCrypto === crypto.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{crypto.icon}</div>
                <div className="text-xs font-medium">{crypto.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2 text-sm text-gray-700">Send {selectedCrypto.toUpperCase()} to this address:</div>
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs font-mono break-all">{currentAddress}</div>
        <div className="flex justify-center mb-4">
          <img src="/qr-mock.png" alt="QR Code" className="w-32 h-32 bg-gray-200 rounded" />
        </div>
        <div className="text-xs text-gray-500">Only send {selectedCrypto.toUpperCase()} ({cryptoOptions.find(c => c.value === selectedCrypto)?.network}) to this address.</div>
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
  const [walletAddresses, setWalletAddresses] = useState({
    usdt: '0x1234abcd5678efgh9012ijkl3456mnop7890qrst',
    btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    eth: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  });

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

  // Load wallet addresses from admin configuration
  useEffect(() => {
    const loadWalletAddresses = () => {
      console.log('Loading wallet addresses...');
      const savedConfig = localStorage.getItem('webConfig');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          console.log('Loaded config:', config);
          const newAddresses = {
            usdt: config.usdtAddress || '0x1234abcd5678efgh9012ijkl3456mnop7890qrst',
            btc: config.btcAddress || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            eth: config.ethAddress || '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
          };
          
          console.log('New addresses:', newAddresses);
          
          // Only update if addresses actually changed
          setWalletAddresses(prev => {
            console.log('Previous addresses:', prev);
            if (JSON.stringify(prev) !== JSON.stringify(newAddresses)) {
              console.log('Wallet addresses updated:', newAddresses);
              return newAddresses;
            }
            console.log('No change detected');
            return prev;
          });
        } catch (error) {
          console.error('Error loading wallet addresses:', error);
        }
      } else {
        console.log('No saved config found');
      }
    };

    // Load initial addresses
    loadWalletAddresses();

    // Listen for storage changes (when admin updates configuration)
    const handleStorageChange = (e) => {
      if (e.key === 'webConfig') {
        console.log('Storage change detected for webConfig');
        loadWalletAddresses();
      }
    };

    // Listen for custom events (for same-tab updates)
    const handleCustomStorageEvent = (event) => {
      console.log('Custom storage event detected', event);
      loadWalletAddresses();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('webConfigUpdated', handleCustomStorageEvent);

    // Also check for changes every 1 second (for same-tab updates)
    const interval = setInterval(loadWalletAddresses, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('webConfigUpdated', handleCustomStorageEvent);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} walletAddresses={walletAddresses} />
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