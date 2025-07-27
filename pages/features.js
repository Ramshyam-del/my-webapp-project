import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const navTabs = [
  { label: 'HOME', icon: '🏠', route: '/exchange' },
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'TRADE', icon: '💱', route: '/trade' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'WALLETS', icon: '👛', route: '/wallets' },
];

const fallbackFeatures = [
  { icon: '✨', title: 'Staking Rewards', desc: 'Earn rewards by staking your crypto assets.' },
  { icon: '🔒', title: 'Secure Wallet', desc: 'Your funds are protected with industry-leading security.' },
  { icon: '⚡', title: 'Instant Withdrawals', desc: 'Withdraw your assets instantly, anytime.' },
  { icon: '📱', title: 'Mobile App', desc: 'Trade and manage your assets on the go.' },
  { icon: '🌎', title: 'Global Access', desc: 'Access your account from anywhere in the world.' },
];

export default function Features() {
  const router = useRouter();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/features')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setFeatures)
      .catch(() => setFeatures(fallbackFeatures))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-extrabold tracking-widest mb-4">FEATURES</h1>
        <div className="rounded-2xl bg-[#181c23] p-4">
          <div className="text-lg font-bold mb-2">Platform Features</div>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-4 flex items-center gap-4">
                  <span className="text-3xl">{f.icon}</span>
                  <div>
                    <div className="font-bold text-base mb-1">{f.title}</div>
                    <div className="text-xs text-gray-300">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
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