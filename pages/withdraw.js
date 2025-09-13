import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useConfig } from '../hooks/useConfig';
import { supabase } from '../lib/supabase';

export default function WithdrawPage() {
  const router = useRouter();
  const { config, loading: configLoading } = useConfig();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userBalances, setUserBalances] = useState({});
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [withdrawalNote, setWithdrawalNote] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [showInitialZeroBalance, setShowInitialZeroBalance] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const currencies = [
    { 
      id: 'USDT', 
      name: 'USDT (Tether)', 
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png', 
      color: 'bg-green-500' 
    },
    { 
      id: 'BTC', 
      name: 'BTC (Bitcoin)', 
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', 
      color: 'bg-orange-500' 
    },
    { 
      id: 'ETH', 
      name: 'ETH (Ethereum)', 
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', 
      color: 'bg-blue-500' 
    }
  ];

  // Fetch crypto prices for conversion calculations
  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(`/api/crypto/prices?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCryptoPrices(data);
      } else {
        // Fallback prices if API fails
        setCryptoPrices({
          'BTC': 43250.75,
          'ETH': 2650.30,
          'USDT': 1.00
        });
      }
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Fallback prices
      setCryptoPrices({
        'BTC': 43250.75,
        'ETH': 2650.30,
        'USDT': 1.00
      });
    }
  };

  const networks = [
    { 
      id: 'bitcoin', 
      name: 'Bitcoin', 
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', 
      color: 'bg-orange-500' 
    },
    { 
      id: 'ethereum', 
      name: 'Ethereum', 
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', 
      color: 'bg-gray-500' 
    },
    { 
      id: 'tron', 
      name: 'Tron (TRC20)', 
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png', 
      color: 'bg-red-500' 
    }
  ];

  // Fetch user balance data
  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      setBalanceLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUserBalances({});
        return;
      }

      const response = await fetch(`/api/portfolio/balance?userId=${user.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Store all currency balances
        const balances = {};
        if (data.currencies && Array.isArray(data.currencies)) {
          data.currencies.forEach(currency => {
            balances[currency.currency] = currency.balance || 0;
          });
        }
        setUserBalances(balances);
      } else {
        console.error('Failed to fetch balance');
        setUserBalances({});
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setUserBalances({});
    } finally {
      setBalanceLoading(false);
    }
  };

  // Get available balance for selected currency and network combination
  const getAvailableBalance = () => {
    if (!selectedCurrency || !selectedNetwork) {
      return 0;
    }

    // If user selects Bitcoin network and USDT currency, show total USDT equivalent of BTC holdings
    if (selectedNetwork === 'Bitcoin' && selectedCurrency === 'USDT') {
      const btcBalance = userBalances['BTC'] || 0;
      const btcPrice = cryptoPrices['BTC'] || 0;
      const usdtBalance = userBalances['USDT'] || 0;
      
      // Return total USDT equivalent (existing USDT + BTC converted to USDT)
      return usdtBalance + (btcBalance * btcPrice);
    }
    
    // If user selects Ethereum network and USDT currency, show total USDT equivalent of ETH holdings
    if (selectedNetwork === 'Ethereum' && selectedCurrency === 'USDT') {
      const ethBalance = userBalances['ETH'] || 0;
      const ethPrice = cryptoPrices['ETH'] || 0;
      const usdtBalance = userBalances['USDT'] || 0;
      
      // Return total USDT equivalent (existing USDT + ETH converted to USDT)
      return usdtBalance + (ethBalance * ethPrice);
    }
    
    // For other combinations, return the direct balance
    if (!userBalances[selectedCurrency]) {
      return 0;
    }
    return userBalances[selectedCurrency] || 0;
  };

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
    const balance = getAvailableBalance();
    setAmount(balance.toString());
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!user) {
      alert('Please log in to make a withdrawal');
      return;
    }
    if (!selectedCurrency) {
      alert('Please select a currency');
      return;
    }
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
    const balance = getAvailableBalance();
    if (parseFloat(amount) > balance) {
      alert('Insufficient balance');
      return;
    }

    setWithdrawalLoading(true);
    
    try {
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Please log in again to continue');
        router.push('/login');
        return;
      }

      // Call the withdrawal API endpoint
      const response = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          currency: selectedCurrency,
          amount: parseFloat(amount),
          wallet_address: address,
          network: selectedNetwork
        })
      });

      const result = await response.json();

      if (result.ok) {
        setSuccessMessage('Withdrawal request submitted successfully! Your request is now pending admin approval.');
        setShowSuccessModal(true);
        // Reset form
        setAddress('');
        setAmount('');
        setWithdrawalNote('');
      } else {
        alert(`Error: ${result.message || 'Failed to submit withdrawal request'}`);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Failed to submit withdrawal request. Please try again.');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Check authentication and load user
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch balance when user is loaded
  useEffect(() => {
    if (user && !authLoading) {
      fetchBalance();
    }
  }, [user, authLoading]);

  useEffect(() => {
    setMounted(true);
    fetchCryptoPrices();
  }, []);

  // Fetch prices when currency or network changes to ensure fresh data
  useEffect(() => {
    if (selectedCurrency && selectedNetwork) {
      fetchCryptoPrices();
    }
  }, [selectedCurrency, selectedNetwork]);

  if (!mounted || configLoading || authLoading || balanceLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p>Redirecting to login...</p>
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
        <h2 className="text-2xl font-bold mb-6 text-center">
          {selectedCurrency ? `Send ${selectedCurrency}` : 'Withdraw Funds'}
        </h2>

        {/* Currency Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Currency</label>
          <div className="relative">
            <button
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-left text-white focus:outline-none focus:border-blue-500 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {selectedCurrency && (
                  <img 
                    src={currencies.find(c => c.id === selectedCurrency)?.icon} 
                    alt={currencies.find(c => c.id === selectedCurrency)?.name}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                )}
                {selectedCurrency && (
                  <div className={`w-5 h-5 ${currencies.find(c => c.id === selectedCurrency)?.color} rounded-full flex items-center justify-center text-white text-xs font-bold`} style={{display: 'none'}}>
                    {selectedCurrency.charAt(0)}
                  </div>
                )}
                <span className={selectedCurrency ? 'text-white' : 'text-gray-400'}>
                  {selectedCurrency ? currencies.find(c => c.id === selectedCurrency)?.name : 'Select Currency'}
                </span>
              </div>
              <span className="text-gray-400">▼</span>
            </button>
            
            {showCurrencyDropdown && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg mt-1 z-20">
                {currencies.map((currency) => (
                  <button
                    key={currency.id}
                    onClick={() => {
                      setSelectedCurrency(currency.id);
                      setShowCurrencyDropdown(false);
                      // Reset network selection when currency changes
                      setSelectedNetwork('');
                      setShowInitialZeroBalance(currency.id === '' || selectedNetwork === '');
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                  >
                    <img 
                      src={currency.icon} 
                      alt={currency.name}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className={`w-6 h-6 ${currency.color} rounded-full flex items-center justify-center text-white text-sm font-bold`} style={{display: 'none'}}>
                      {currency.id.charAt(0)}
                    </div>
                    {currency.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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
                      setShowInitialZeroBalance(selectedCurrency === '' || network.name === '');
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                  >
                    <img 
                      src={network.icon} 
                      alt={network.name}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className={`w-6 h-6 ${network.color} rounded-full flex items-center justify-center text-white text-sm font-bold`} style={{display: 'none'}}>
                      {network.id.charAt(0).toUpperCase()}
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
                onClick={() => {
                  setSelectedNetwork(network.name);
                  setShowInitialZeroBalance(selectedCurrency === '' || network.name === '');
                }}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedNetwork === network.name
                    ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                  <img 
                    src={network.icon} 
                    alt={network.name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className={`w-8 h-8 ${network.color} rounded-full flex items-center justify-center text-white text-sm font-bold`} style={{display: 'none'}}>
                    {network.id.charAt(0).toUpperCase()}
                  </div>
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
              <span className="text-gray-400 text-sm">{selectedCurrency || 'USDT'}</span>
              <button
                onClick={setMaxAmount}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
              >
                Max
              </button>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-400">
             Available: {showInitialZeroBalance || !selectedCurrency || !selectedNetwork ? 0 : (getAvailableBalance() || 0).toFixed(8)} {selectedCurrency || 'Currency'}
           </div>
        </div>

        {/* Withdrawal Note */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Note (Optional)</label>
          <textarea
            value={withdrawalNote}
            onChange={(e) => setWithdrawalNote(e.target.value)}
            placeholder="Add a note for this withdrawal..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        {/* Withdraw Button */}
         <button
           onClick={handleWithdraw}
           disabled={withdrawalLoading || !selectedCurrency || !address.trim() || !selectedNetwork || !amount || parseFloat(amount) <= 0}
           className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
         >
          {withdrawalLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
              Processing...
            </>
          ) : (
            'Withdraw'
          )}
        </button>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white text-center">Success!</h3>
            </div>
            
            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-gray-700 text-center leading-relaxed mb-6">
                {successMessage}
              </p>
              
              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Currency:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedCurrency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-sm font-medium text-gray-900">{amount} {selectedCurrency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Network:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedNetwork}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending Approval
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/portfolio');
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  View Portfolio
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Make Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showNetworkDropdown || showCurrencyDropdown) && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowNetworkDropdown(false);
            setShowCurrencyDropdown(false);
          }}
        />
      )}
    </div>
  );
}