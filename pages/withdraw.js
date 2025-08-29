import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useConfig } from '../hooks/useConfig';

export default function WithdrawPage() {
  const router = useRouter();
  const { config, loading: configLoading } = useConfig();
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [availableBalance] = useState(0.66948577);

  const networks = [
    { id: 'bitcoin', name: 'Bitcoin', icon: '₿', color: 'bg-orange-500' },
    { id: 'ethereum', name: 'Ethereum', icon: 'Ξ', color: 'bg-gray-500' },
    { id: 'tron', name: 'Tron (TRC20)', icon: 'T', color: 'bg-red-500' }
  ];

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        setAddress(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  // Set maximum amount
  const setMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  // Handle withdraw
  const handleWithdraw = () => {
    if (!address.trim()) {
      alert('Please enter a valid address');
      return;
    }
    if (!selectedNetwork) {
      alert('Please select a network');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (parseFloat(amount) > availableBalance) {
      alert('Insufficient balance');
      return;
    }

    // Simulate withdraw process
    alert(`Withdrawing ${amount} USDT to ${address} via ${selectedNetwork} network`);
    router.push('/portfolio');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-gray-800 border-b border-gray-700">
        <button 
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">{config.title || config.officialWebsiteName || 'Quantex'}</h1>
        <button 
          onClick={() => router.push('/portfolio')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          🕒
        </button>
      </div>

      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Send USDT</h2>

        {/* Address Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Address</label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Long press to paste"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handlePaste}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              📋
            </button>
          </div>
        </div>

        {/* Network Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium">Network</label>
            <span className="text-gray-400 text-xs">ℹ️</span>
          </div>
          
          {/* Network Dropdown */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-left text-white focus:outline-none focus:border-blue-500 transition-colors flex items-center justify-between"
            >
              <span className={selectedNetwork ? 'text-white' : 'text-gray-400'}>
                {selectedNetwork || 'Select Network'}
              </span>
              <span className="text-gray-400">▼</span>
            </button>
            
            {showNetworkDropdown && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg mt-1 z-10">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => {
                      setSelectedNetwork(network.name);
                      setShowNetworkDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                  >
                    <div className={`w-6 h-6 ${network.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                      {network.icon}
                    </div>
                    {network.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Network Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => setSelectedNetwork(network.name)}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedNetwork === network.name
                    ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className={`w-8 h-8 ${network.color} rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-2`}>
                  {network.icon}
                </div>
                <span className="text-xs text-center block">{network.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium">Amount</label>
            <span className="text-gray-400 text-xs">ℹ️</span>
          </div>
          
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Minimum 0"
              min="0"
              step="0.00000001"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors pr-20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <span className="text-gray-400 text-sm">USDT</span>
              <button
                onClick={setMaxAmount}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
              >
                Max
              </button>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-400">
            Available {availableBalance.toFixed(8)} USDT
          </div>
        </div>

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={!address.trim() || !selectedNetwork || !amount || parseFloat(amount) <= 0}
          className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-lg transition-colors"
        >
          Withdraw
        </button>
      </div>

      {/* Click outside to close dropdown */}
      {showNetworkDropdown && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowNetworkDropdown(false)}
        />
      )}
    </div>
  );
}