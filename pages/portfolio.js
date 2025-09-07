import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { safeLocalStorage, safeWindow, getSafeDocument } from '../utils/safeStorage';
import { supabase } from '../lib/supabase';
import useRealTimeBalance from '../hooks/useRealTimeBalance';
import { useAuth } from '../contexts/AuthContext';

// Cryptocurrency list with more trading pairs
const cryptoList = [
  { id: 'bitcoin', name: 'Bitcoin/BTC', symbol: 'BTC', icon: '₿' },
  { id: 'ethereum', name: 'Ethereum/ETH', symbol: 'ETH', icon: 'Ξ' },
  { id: 'tether', name: 'Tether/USDT', symbol: 'USDT', icon: 'T' },
  { id: 'binancecoin', name: 'BNB/BNB', symbol: 'BNB', icon: 'B' },
  { id: 'solana', name: 'Solana/SOL', symbol: 'SOL', icon: 'S' },
  { id: 'cardano', name: 'Cardano/ADA', symbol: 'ADA', icon: 'A' },
  { id: 'polkadot', name: 'Polkadot/DOT', symbol: 'DOT', icon: 'D' },
  { id: 'dogecoin', name: 'Dogecoin/DOGE', symbol: 'DOGE', icon: 'Ð' },
  { id: 'avalanche-2', name: 'Avalanche/AVAX', symbol: 'AVAX', icon: 'A' },
  { id: 'chainlink', name: 'Chainlink/LINK', symbol: 'LINK', icon: 'L' },
  { id: 'polygon', name: 'Polygon/MATIC', symbol: 'MATIC', icon: 'M' },
  { id: 'litecoin', name: 'Litecoin/LTC', symbol: 'LTC', icon: 'Ł' },
  { id: 'uniswap', name: 'Uniswap/UNI', symbol: 'UNI', icon: 'U' },
  { id: 'bitcoin-cash', name: 'Bitcoin Cash/BCH', symbol: 'BCH', icon: 'B' },
  { id: 'stellar', name: 'Stellar/XLM', symbol: 'XLM', icon: 'X' },
  { id: 'vechain', name: 'VeChain/VET', symbol: 'VET', icon: 'V' },
  { id: 'filecoin', name: 'Filecoin/FIL', symbol: 'FIL', icon: 'F' },
  { id: 'cosmos', name: 'Cosmos/ATOM', symbol: 'ATOM', icon: 'A' },
  { id: 'monero', name: 'Monero/XMR', symbol: 'XMR', icon: 'M' },
  { id: 'algorand', name: 'Algorand/ALGO', symbol: 'ALGO', icon: 'A' },
  { id: 'tezos', name: 'Tezos/XTZ', symbol: 'XTZ', icon: 'T' },
  { id: 'aave', name: 'Aave/AAVE', symbol: 'AAVE', icon: 'A' },
  { id: 'compound', name: 'Compound/COMP', symbol: 'COMP', icon: 'C' },
  { id: 'synthetix-network-token', name: 'Synthetix/SNX', symbol: 'SNX', icon: 'S' },
  { id: 'yearn-finance', name: 'Yearn Finance/YFI', symbol: 'YFI', icon: 'Y' },
  { id: 'decentraland', name: 'Decentraland/MANA', symbol: 'MANA', icon: 'M' },
  { id: 'the-sandbox', name: 'The Sandbox/SAND', symbol: 'SAND', icon: 'S' },
  { id: 'enjin-coin', name: 'Enjin Coin/ENJ', symbol: 'ENJ', icon: 'E' },
  { id: 'axie-infinity', name: 'Axie Infinity/AXS', symbol: 'AXS', icon: 'A' },
  { id: 'gala', name: 'Gala/GALA', symbol: 'GALA', icon: 'G' },
  { id: 'flow', name: 'Flow/FLOW', symbol: 'FLOW', icon: 'F' },
  { id: 'near', name: 'NEAR Protocol/NEAR', symbol: 'NEAR', icon: 'N' },
  { id: 'fantom', name: 'Fantom/FTM', symbol: 'FTM', icon: 'F' },
  { id: 'harmony', name: 'Harmony/ONE', symbol: 'ONE', icon: 'O' },
  { id: 'kusama', name: 'Kusama/KSM', symbol: 'KSM', icon: 'K' },
  { id: 'zilliqa', name: 'Zilliqa/ZIL', symbol: 'ZIL', icon: 'Z' },
  { id: 'icon', name: 'ICON/ICX', symbol: 'ICX', icon: 'I' },
  { id: 'ontology', name: 'Ontology/ONT', symbol: 'ONT', icon: 'O' },
  { id: 'neo', name: 'NEO/NEO', symbol: 'NEO', icon: 'N' },
  { id: 'qtum', name: 'Qtum/QTUM', symbol: 'QTUM', icon: 'Q' },
  { id: 'verge', name: 'Verge/XVG', symbol: 'XVG', icon: 'V' },
  { id: 'siacoin', name: 'Siacoin/SC', symbol: 'SC', icon: 'S' },
  { id: 'steem', name: 'Steem/STEEM', symbol: 'STEEM', icon: 'S' },
  { id: 'waves', name: 'Waves/WAVES', symbol: 'WAVES', icon: 'W' },
  { id: 'nxt', name: 'NXT/NXT', symbol: 'NXT', icon: 'N' },
  { id: 'bytecoin', name: 'Bytecoin/BCN', symbol: 'BCN', icon: 'B' },
  { id: 'digibyte', name: 'DigiByte/DGB', symbol: 'DGB', icon: 'D' },
  { id: 'vertcoin', name: 'Vertcoin/VTC', symbol: 'VTC', icon: 'V' },
  { id: 'feathercoin', name: 'Feathercoin/FTC', symbol: 'FTC', icon: 'F' },
  { id: 'novacoin', name: 'Novacoin/NVC', symbol: 'NVC', icon: 'N' },
  { id: 'primecoin', name: 'Primecoin/XPM', symbol: 'XPM', icon: 'P' },
  { id: 'peercoin', name: 'Peercoin/PPC', symbol: 'PPC', icon: 'P' },
  { id: 'namecoin', name: 'Namecoin/NMC', symbol: 'NMC', icon: 'N' }
];

const navTabs = [
    { label: 'HOME', icon: '🏠', route: '/exchange' },
    { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
    { label: 'MARKET', icon: '📊', route: '/market' },
    { label: 'FEATURES', icon: '✨', route: '/features' },
    { label: 'TRADE', icon: '💱', route: '/trade' },
  ];

export default function PortfolioPage() {
  const router = useRouter();
  const [marketData, setMarketData] = useState([]);
  
  // Authentication context
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  
  // Real-time balance hook
  const { 
    balances: realTimeBalances, 
    totalBalance: realTimeTotalBalance, 
    isConnected: wsConnected, 
    lastUpdate: balanceLastUpdate,
    transactions: recentTransactions,
    refreshBalance 
  } = useRealTimeBalance();
  // Portfolio data is now fetched via portfolioBalance from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAddresses, setDepositAddresses] = useState({ usdt: '', btc: '', eth: '' });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [withdrawalNetwork, setWithdrawalNetwork] = useState('ethereum');
  const [withdrawalNote, setWithdrawalNote] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    username: "",
    officialId: "",
    vipLevel: "Bronze", // Default VIP level
    email: "",
    phone: ""
  });
  const [alerts, setAlerts] = useState([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    cryptoId: '',
    targetPrice: '',
    condition: 'above', // 'above' or 'below'
    enabled: true
  });
  const [transactions, setTransactions] = useState([]);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('all'); // 'all', 'buy', 'sell', 'deposit', 'withdraw'

  const [showCustomerServiceModal, setShowCustomerServiceModal] = useState(false);
  const [customerServiceForm, setCustomerServiceForm] = useState({
    email: '',
    subject: '',
    description: '',
    department: 'support' // 'support' or 'finance'
  });
  const [contactConfig, setContactConfig] = useState({
    telegram: '',
    whatsapp: '',
    email: ''
  });
  const [kycStatus, setKycStatus] = useState({
    status: 'required', // 'required', 'pending', 'approved', 'rejected'
    verifiedAt: null,
    loading: true
  });
  const [portfolioBalance, setPortfolioBalance] = useState({
    totalBalance: 0,
    currencies: [],
    summary: { totalCurrencies: 0, totalBalance: 0, lastUpdated: null }
  });
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Fetch contact configuration (API first, then localStorage fallback)
  const fetchContactConfig = async () => {
    try {
      let telegram = '';
      let whatsapp = '';
      let email = '';

      try {
        const response = await fetch('/api/admin/config');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            telegram = data.data.telegram || telegram;
            whatsapp = data.data.whatsapp || whatsapp;
            email = data.data.email || email;
          }
        }
      } catch (_ignore) {}

      // Fallback to localStorage saved by /admin/operate if API not yet updated
      try {
        const saved = safeLocalStorage.getItem('webConfig');
        if (saved) {
          const cfg = JSON.parse(saved);
          telegram = telegram || cfg.telegram || '';
          whatsapp = whatsapp || cfg.whatsapp || '';
          email = email || cfg.email || cfg.emailAddress || '';
        }
      } catch (_e) {}

      setContactConfig({ telegram, whatsapp, email });
    } catch (error) {
      console.error('Error fetching contact config:', error);
    }
  };

  // Fetch user's KYC status from database
  const fetchKycStatus = async () => {
    try {
      setKycStatus(prev => ({ ...prev, loading: true }));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setKycStatus({ status: 'required', verifiedAt: null, loading: false });
        return;
      }
      
      const { data: user, error } = await supabase
        .from('users')
        .select('kyc_status, updated_at')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching KYC status:', error);
        setKycStatus({ status: 'required', verifiedAt: null, loading: false });
        return;
      }
      
      let status = 'required';
      if (user.kyc_status === 'approved') {
        status = 'approved';
      } else if (user.kyc_status === 'rejected') {
        status = 'rejected';
      } else if (user.kyc_status === 'pending') {
        status = 'pending';
      }
      
      setKycStatus({
        status,
        verifiedAt: user.updated_at,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      setKycStatus({ status: 'required', verifiedAt: null, loading: false });
    }
  };

  // Load deposit addresses from webConfig stored by admin /admin/operate
  const loadDepositAddressesFromLocal = () => {
    try {
      const saved = safeLocalStorage.getItem('webConfig');
      if (!saved) return;
      const cfg = JSON.parse(saved);
      const next = {
        usdt: cfg.usdtAddress || (cfg.deposit_addresses?.usdt ?? ''),
        btc: cfg.btcAddress || (cfg.deposit_addresses?.btc ?? ''),
        eth: cfg.ethAddress || (cfg.deposit_addresses?.eth ?? ''),
      };
      console.log('Loading deposit addresses:', next);
      setDepositAddresses(next);
    } catch (_e) {
      console.error('Error loading deposit addresses:', _e);
    }
  };

  // Handle withdrawal submission
  const handleWithdrawalSubmit = async () => {
    if (!withdrawAmount || !withdrawalAddress || !selectedCurrency) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const availableBalance = realTimeBalances[selectedCurrency] || 0;
    if (amount > availableBalance) {
      alert(`Insufficient balance. Available: ${availableBalance} ${selectedCurrency}`);
      return;
    }

    setWithdrawalLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to submit a withdrawal request');
        return;
      }

      const response = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          currency: selectedCurrency,
          amount: amount,
          wallet_address: withdrawalAddress,
          network: withdrawalNetwork,
          user_note: withdrawalNote || null
        })
      });

      const result = await response.json();

      if (result.ok) {
        alert(`Withdrawal request submitted successfully! Your request is now pending admin approval.`);
        
        // Reset form
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawalAddress('');
        setWithdrawalNote('');
        setSelectedCurrency('USDT');
        setWithdrawalNetwork('ethereum');
        
        // Refresh balance
        refreshBalance();
      } else {
        alert(`Error: ${result.message || 'Failed to submit withdrawal request'}`);
      }
    } catch (error) {
      console.error('Withdrawal submission error:', error);
      alert('Failed to submit withdrawal request. Please try again.');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Update user profile based on authenticated user
  const updateUserProfile = () => {
    if (isAuthenticated && user) {
      setUserProfile({
        username: user.username || user.email?.split('@')[0] || 'User',
        officialId: user.id?.slice(-8) || 'ID' + Math.random().toString(36).substr(2, 6),
        vipLevel: user.vip_level || "Bronze",
        email: user.email || '',
        phone: user.phone || ''
      });
    } else {
      // Clear any stale temp profile data
      localStorage.removeItem('tempUserProfile');
      
      // Set default guest profile
      setUserProfile({
        username: 'Guest User',
        officialId: 'GUEST' + Math.random().toString(36).substr(2, 6),
        vipLevel: "Bronze",
        email: '',
        phone: ''
      });
    }
  };

  // Fetch user's portfolio balance from database
  const fetchPortfolioBalance = async () => {
    console.log('🚀 fetchPortfolioBalance function called!');
    
    try {
      setBalanceLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Portfolio balance fetch - Session:', session);
      
      // Only use authenticated user data - no fallbacks
      if (!session) {
        console.log('No session found, user must be authenticated');
        setPortfolioBalance({ totalBalance: 0, currencies: [] });
        return;
      }
      
      const userId = session.user.id; // Use actual user ID from auth
      console.log('Fetching balance for user ID:', userId);
      
      const apiUrl = `/api/portfolio/balance?userId=${userId}`;
      console.log('Making API request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Balance API response status:', response.status);
      console.log('Balance API response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Balance API response data:', JSON.stringify(data, null, 2));
      console.log('About to call setPortfolioBalance with:', data);
      setPortfolioBalance(data);
      console.log('setPortfolioBalance called successfully');
      setBalanceLoading(false);
      
    } catch (error) {
      console.error('Error fetching portfolio balance:', error);
      setBalanceLoading(false);
      // Fallback to default values if API fails
      setPortfolioBalance({
        totalBalance: 0,
        currencies: [],
        summary: { totalCurrencies: 0, totalBalance: 0, lastUpdated: null }
      });
    }
  };

  // Get effective balance data (real-time if available, otherwise API data)
  const getEffectiveBalanceData = () => {
    console.log('getEffectiveBalanceData called');
    console.log('wsConnected:', wsConnected);
    console.log('realTimeBalances:', realTimeBalances);
    console.log('portfolioBalance:', portfolioBalance);
    
    if (wsConnected && realTimeBalances && Object.keys(realTimeBalances).length > 0) {
      console.log('Using real-time balance data');
      // Convert real-time balances to portfolio format
      const currencies = Object.entries(realTimeBalances).map(([currency, balance]) => ({
        currency: currency.toUpperCase(),
        balance: parseFloat(balance) || 0,
        value: parseFloat(balance) || 0 // Will be calculated with market data
      }));
      
      const result = {
        totalBalance: realTimeTotalBalance || 0,
        currencies,
        summary: {
          totalCurrencies: currencies.length,
          totalBalance: realTimeTotalBalance || 0,
          lastUpdated: balanceLastUpdate
        },
        isRealTime: true
      };
      console.log('Real-time balance result:', result);
      return result;
    }
    
    console.log('Using API balance data');
    const result = {
      ...portfolioBalance,
      isRealTime: false
    };
    console.log('API balance result:', result);
    return result;
  };

  // Fetch real-time price data from internal API
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use internal API endpoint - same as market page
      const response = await fetch('/api/crypto/top-all', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Map API data to our crypto list format
        const formattedData = cryptoList.map(crypto => {
          // Find matching data from API
          const apiData = data.data.find(item => 
            item.symbol === crypto.symbol || item.id === crypto.id
          );
          
          if (apiData) {
            return {
              id: crypto.id,
              name: `${crypto.symbol}/USDT`,
              icon: crypto.icon,
              price: parseFloat(apiData.price).toFixed(2),
              change: parseFloat(apiData.change_24h || 0).toFixed(2),
              volume: parseFloat(apiData.volume || 0),
              marketCap: parseFloat(apiData.market_cap || 0),
            };
          }
          
          // Fallback data if not found in API
          return {
            id: crypto.id,
            name: `${crypto.symbol}/USDT`,
            icon: crypto.icon,
            price: '0.00',
            change: '0.00',
            volume: 0,
            marketCap: 0,
          };
        });
        
        setMarketData(formattedData);
        setLoading(false);
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
      
    } catch (err) {
      console.error('Error fetching market data:', err);
      
      // Show error message and provide fallback data
      setError('Unable to load market data. Using cached data.');
      
      // Provide some fallback data so the page isn't completely broken
      const fallbackData = cryptoList.slice(0, 5).map(crypto => ({
        id: crypto.id,
        name: `${crypto.symbol}/USDT`,
        icon: crypto.icon,
        price: '0.00',
        change: '0.00',
        volume: 0,
        marketCap: 0,
      }));
      
      setMarketData(fallbackData);
      setLoading(false);
      
      // Retry after 10 seconds
      setTimeout(() => {
        fetchMarketData();
      }, 10000);
    }
  };

  // Note: Portfolio data is now fetched from API via fetchPortfolioBalance()
  // No longer using localStorage for portfolio data

  // Load alerts from localStorage
  const loadAlerts = () => {
    const saved = safeLocalStorage.getItem('priceAlerts');
    if (saved) {
      setAlerts(JSON.parse(saved));
    }
  };

  // Save alerts to localStorage
  const saveAlerts = (newAlerts) => {
    safeLocalStorage.setItem('priceAlerts', JSON.stringify(newAlerts));
  };

  // Load transactions from localStorage
  const loadTransactions = () => {
    // Clear any existing mock transaction data
    safeLocalStorage.removeItem('transactions');
    setTransactions([]);
  };

  // Save transactions to localStorage
  const saveTransactions = (newTransactions) => {
    safeLocalStorage.setItem('transactions', JSON.stringify(newTransactions));
  };

  // Add transaction
  const addTransaction = (transactionData) => {
    const newTransaction = {
      id: Date.now().toString(),
      ...transactionData,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
  };

  // Get filtered transactions
  const getFilteredTransactions = () => {
    if (transactionFilter === 'all') {
      return transactions;
    }
    return transactions.filter(tx => tx.type === transactionFilter);
  };

  // Calculate transaction statistics
  const getTransactionStats = () => {
    const stats = {
      total: transactions.length,
      buy: transactions.filter(tx => tx.type === 'buy').length,
      sell: transactions.filter(tx => tx.type === 'sell').length,
      deposit: transactions.filter(tx => tx.type === 'deposit').length,
      withdraw: transactions.filter(tx => tx.type === 'withdraw').length,
      totalValue: transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
    };
    return stats;
  };





  // Add new alert
  const addAlert = (alertData) => {
    const newAlertItem = {
      id: Date.now().toString(),
      ...alertData,
      createdAt: new Date().toISOString(),
      triggered: false
    };
    const updatedAlerts = [...alerts, newAlertItem];
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
  };

  // Remove alert
  const removeAlert = (alertId) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
  };

  // Toggle alert enabled/disabled
  const toggleAlert = (alertId) => {
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
    );
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
  };

  // Check if alerts should be triggered
  const checkAlerts = () => {
    if (!marketData.length) return;
    
    alerts.forEach(alert => {
      if (alert.triggered || !alert.enabled) return;
      
      const crypto = marketData.find(c => c.id === alert.cryptoId);
      if (!crypto) return;
      
      const currentPrice = parseFloat(crypto.price);
      const targetPrice = parseFloat(alert.targetPrice);
      
      let shouldTrigger = false;
      if (alert.condition === 'above' && currentPrice >= targetPrice) {
        shouldTrigger = true;
      } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
        shouldTrigger = true;
      }
      
      if (shouldTrigger) {
        // Mark as triggered
        const updatedAlerts = alerts.map(a => 
          a.id === alert.id ? { ...a, triggered: true } : a
        );
        setAlerts(updatedAlerts);
        saveAlerts(updatedAlerts);
        
        // Show notification
        const cryptoName = crypto.name;
        const message = `${cryptoName} is now ${alert.condition} $${targetPrice}! Current price: $${currentPrice.toFixed(2)}`;
        alert(`🚨 Price Alert: ${message}`);
      }
    });
  };

  // Add to portfolio
  const addToPortfolio = async (cryptoId, amount, price) => {
    try {
      // Record transaction first
      const crypto = cryptoList.find(c => c.id === cryptoId);
      addTransaction({
        type: 'buy',
        cryptoId,
        cryptoName: crypto ? crypto.name : cryptoId,
        amount: amount,
        price: price,
        totalValue: amount * price,
        description: `Bought ${amount} ${crypto ? crypto.symbol : cryptoId} at $${price}`
      });
      
      // Refresh portfolio data from API
      await fetchPortfolioBalance();
      
    } catch (error) {
      console.error('Error adding to portfolio:', error);
    }
  };

  // Remove from portfolio - now updates via API
  const removeFromPortfolio = async (cryptoId) => {
    try {
      const holdings = getRealHoldings();
      const item = holdings.find(holding => holding.cryptoId === cryptoId);
      
      if (item) {
        // Record sell transaction before removing
        const crypto = cryptoList.find(c => c.id === cryptoId);
        const currentPrice = marketData.find(c => c.id === cryptoId)?.price || item.avgPrice;
        
        addTransaction({
          type: 'sell',
          cryptoId,
          cryptoName: crypto ? crypto.name : cryptoId,
          amount: item.amount,
          price: currentPrice,
          totalValue: item.amount * currentPrice,
          description: `Sold ${item.amount} ${crypto ? crypto.symbol : cryptoId} at $${currentPrice}`
        });
      }
      
      // Refresh portfolio data from API
      await fetchPortfolioBalance();
      
    } catch (error) {
      console.error('Error removing from portfolio:', error);
    }
  };

  // Calculate portfolio value
  const calculatePortfolioValue = () => {
    const holdings = getRealHoldings();
    if (!marketData.length || !holdings.length) return { totalValue: 0, totalSpent: 0, profit: 0 };

    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    // For real data without historical cost basis, we'll use current value as spent
    const totalSpent = totalValue; // Placeholder - would need historical data
    const profit = 0; // Would need historical data to calculate

    return { totalValue, totalSpent, profit };
  };

  // Update user profile when authentication state changes
  useEffect(() => {
    if (!authLoading) {
      updateUserProfile();
    }
  }, [user, isAuthenticated, authLoading]);

  // Redirect to login if not authenticated (after auth loading is complete)
  // TEMPORARILY DISABLED FOR TESTING
  // useEffect(() => {
  //   if (!authLoading && !isAuthenticated) {
  //     router.push('/login');
  //   }
  // }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    console.log('🎯 Portfolio useEffect is running!');
    
    setMounted(true);
    fetchContactConfig(); // Fetch contact configuration
    loadDepositAddressesFromLocal();
    loadAlerts();
    loadTransactions(); // Load transactions on mount

    
    // Always fetch portfolio balance on mount
    console.log('🔥 About to call fetchPortfolioBalance');
    try {
      fetchPortfolioBalance(); // Fetch portfolio balance from database
      console.log('✅ fetchPortfolioBalance called successfully');
    } catch (error) {
      console.error('❌ Error calling fetchPortfolioBalance:', error);
    }
    
    // Fetch KYC status on mount
    fetchKycStatus();
    
    // Listen for KYC status updates from admin
    let kycChannel;
    try {
      kycChannel = new BroadcastChannel('kyc-status-updates');
      kycChannel.addEventListener('message', (event) => {
        if (event.data.type === 'KYC_STATUS_UPDATED' && event.data.userId && user?.id === event.data.userId) {
          console.log('🔄 Received KYC status update:', event.data);
          // Refresh KYC status immediately
          fetchKycStatus();
        }
      });
    } catch (error) {
      console.log('BroadcastChannel not supported:', error);
    }
    
    fetchMarketData();
    const marketInterval = setInterval(fetchMarketData, 30000);
    
    // Set up automatic balance refresh every 30 seconds
    const balanceInterval = setInterval(() => {
      if (!wsConnected) {
        fetchPortfolioBalance();
      }
    }, 30000);
    
    // Listen for admin config updates from /admin/operate
    const document = getSafeDocument();
    const onCfg = () => {
      loadDepositAddressesFromLocal();
      fetchContactConfig();
    };
    if (document) document.addEventListener('webConfigUpdated', onCfg);
    
    // Listen for page visibility changes to refresh balance when user returns
    const handleVisibilityChange = () => {
      if (!document.hidden && !wsConnected) {
        fetchPortfolioBalance();
      }
    };
    if (document) document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(marketInterval);
      clearInterval(balanceInterval);
      if (document) {
        document.removeEventListener('webConfigUpdated', onCfg);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (kycChannel) {
        kycChannel.close();
      }
    };
  }, [wsConnected]);

  // Handle real-time transaction notifications
  useEffect(() => {
    if (recentTransactions && recentTransactions.length > 0) {
      // Update local transactions list with new real-time transactions
      setTransactions(prev => {
        const newTransactions = recentTransactions.filter(rt => 
          !prev.some(pt => pt.id === rt.id)
        );
        return [...newTransactions, ...prev].slice(0, 50); // Keep last 50 transactions
      });
    }
  }, [recentTransactions]);

  // Setup global toast notification function for transactions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showTransactionToast = (transaction) => {
        // You can integrate with react-hot-toast here if needed
        console.log('New transaction:', transaction);
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.showTransactionToast;
      }
    };
  }, []);

  // Check alerts when market data updates
  useEffect(() => {
    if (marketData.length > 0) {
      checkAlerts();
    }
  }, [marketData]);

  // Get real holdings from portfolio data
  const getRealHoldings = () => {
    if (!portfolioBalance.currencies || portfolioBalance.currencies.length === 0) return [];
    
    return portfolioBalance.currencies.map(currency => {
      if (currency.balance <= 0) return null;
      
      // Handle USDT as a special case (stablecoin with $1 value)
      if (currency.currency === 'USDT') {
        return {
          cryptoId: 'tether',
          symbol: 'USDT',
          name: 'Tether/USDT',
          amount: currency.balance,
          currentValue: currency.balance * 1.00, // USDT is always $1
          profit: 0,
          profitPercent: 0,
          icon: 'T',
          avgPrice: 1.00
        };
      }
      
      // For other currencies, try to find matching market data
      const crypto = marketData.find(c => c.name.split('/')[0] === currency.currency || c.id === currency.currency.toLowerCase());
      if (!crypto) {
        // If no market data found, still show the balance with unknown price
        const cryptoInfo = cryptoList.find(c => c.symbol === currency.currency);
        return {
          cryptoId: cryptoInfo?.id || currency.currency.toLowerCase(),
          symbol: currency.currency,
          name: cryptoInfo?.name || `${currency.currency}/USDT`,
          amount: currency.balance,
          currentValue: 0, // Unknown value without market data
          profit: 0,
          profitPercent: 0,
          icon: cryptoInfo?.icon || currency.currency.charAt(0).toUpperCase(),
          avgPrice: 0
        };
      }
      
      const currentPrice = parseFloat(crypto.price);
      const amount = currency.balance;
      const currentValue = amount * currentPrice;
      
      // For real data, we don't have historical cost basis, so we'll show current value
      // In a real implementation, you'd need to track purchase history
      const profit = 0; // Would need historical data to calculate
      const profitPercent = 0; // Would need historical data to calculate
      
      return {
        cryptoId: crypto.id,
        symbol: currency.currency,
        name: crypto.name,
        amount: amount,
        currentValue: currentValue,
        profit: profit,
        profitPercent: profitPercent,
        icon: crypto.icon || currency.currency.charAt(0).toUpperCase(),
        avgPrice: currentPrice // Current price as placeholder
      };
    }).filter(Boolean); // Remove null items
  };

  // Calculate total portfolio value
  const calculateTotalPortfolioValue = () => {
    const holdings = getRealHoldings();
    return holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  };

  // Get holdings data - use real data from API
  const getHoldingsData = () => {
    return getRealHoldings();
  };

  // Calculate portfolio totals
  const calculatePortfolioTotals = () => {
    const holdings = getRealHoldings();
    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    // For real data without historical cost basis, we'll use current value as spent
    // In a real implementation, you'd track actual purchase costs
    const totalSpent = totalValue; // Placeholder - would need historical data
    const totalProfit = 0; // Would need historical data to calculate
    
    return {
      totalValue,
      totalSpent,
      totalProfit
    };
  };

  const portfolioTotals = calculatePortfolioTotals();
  const holdingsData = getHoldingsData();
  const totalPortfolioValue = calculateTotalPortfolioValue();

  // User data from authentication
  const userData = {
    username: userProfile.username,
    officialId: userProfile.officialId,
    vipLevel: userProfile.vipLevel,
    totalBalance: portfolioTotals.totalValue || 0,
    totalWithdrawn: 0,
    creditScore: 100
  };

  // Handle Telegram click
  const handleTelegramClick = () => {
    if (contactConfig.telegram) {
      // Open Telegram link in new tab
      const telegramUrl = contactConfig.telegram.startsWith('http') 
        ? contactConfig.telegram 
        : `https://t.me/${contactConfig.telegram.replace('@', '')}`;
      window.open(telegramUrl, '_blank');
    } else {
      alert('Telegram link not configured yet. Please contact support.');
    }
  };

  // Handle WhatsApp click
  const handleWhatsAppClick = () => {
    if (contactConfig.whatsapp) {
      // Open WhatsApp link in new tab
      const whatsappUrl = contactConfig.whatsapp.startsWith('http') 
        ? contactConfig.whatsapp 
        : `https://wa.me/${contactConfig.whatsapp.replace(/[^\d]/g, '')}`;
      window.open(whatsappUrl, '_blank');
    } else {
      alert('WhatsApp link not configured yet. Please contact support.');
    }
  };

  // Handle customer service form submission
  const handleCustomerServiceSubmit = (e) => {
    e.preventDefault();
    
    if (!customerServiceForm.email || !customerServiceForm.subject || !customerServiceForm.description) {
      alert('Please fill in all required fields.');
      return;
    }

    // Simulate form submission
    console.log('Customer Service Request:', customerServiceForm);
    
    // Show success message
    alert(`Your ${customerServiceForm.department === 'support' ? 'support' : 'finance'} request has been submitted successfully! We'll get back to you soon.`);
    
    // Reset form and close modal
    setCustomerServiceForm({
      email: '',
      subject: '',
      description: '',
      department: 'support'
    });
    setShowCustomerServiceModal(false);
  };

  // Handle logout
  const handleLogout = () => {
    // Show confirmation dialog
    const document = getSafeDocument();
    const confirmLogout = document?.confirm?.('Are you sure you want to log out?') || true;
    
    if (confirmLogout) {
      // Only clear authentication token, keep user data
      safeLocalStorage.removeItem('token');
      // Keep portfolio, alerts, transactions, etc. - don't clear user data
      
      // Show logout message
      alert('You have been successfully logged out.');
      
      // Redirect to login page
      router.push('/');
    }
  };

  if (!mounted) {
    return null;
  }

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
        <div className="relative flex items-center justify-between px-4 py-6 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                <span className="text-white text-xl font-bold">💼</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 animate-bounce"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Portfolio</h1>
              <div className="flex items-center gap-3 mt-1">
                {loading ? (
                  <div className="flex items-center gap-2 text-xs text-blue-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                    <span className="font-medium animate-pulse">Syncing Live Data...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Live • Updated</span>
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-gray-300">
              <span className="text-sm font-medium">Support</span>
            </div>
            <button 
              onClick={() => setShowCustomerServiceModal(true)}
              className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="text-lg">🎧</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced User Information */}
      <div 
        className="relative px-4 py-6 bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-b border-gray-600/50 cursor-pointer hover:from-gray-700/80 hover:to-gray-600/80 transition-all duration-300 group"
        onClick={() => setShowProfileModal(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-8">
              <div className="group/item">
                <div className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Username
                </div>
                <div className="text-base font-bold text-white group-hover/item:text-blue-400 transition-colors">{userProfile.username}</div>
              </div>
              <div className="group/item">
                <div className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Official ID
                </div>
                <div className="text-base font-bold text-white group-hover/item:text-purple-400 transition-colors font-mono">{userProfile.officialId}</div>
              </div>
            </div>
          </div>
          <div className="text-right group/vip">
            <div className="text-xs text-gray-400 font-medium mb-2 flex items-center justify-end gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              VIP Level
            </div>
            <div className="relative">
              <div className="text-lg font-bold text-yellow-400 group-hover/vip:text-yellow-300 transition-colors flex items-center gap-2">
                <span className="text-xl">👑</span>
                {userProfile.vipLevel}
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg opacity-0 group-hover/vip:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          </div>
        </div>
        <div className="absolute top-2 right-2 text-gray-400 group-hover:text-white transition-colors">
          <span className="text-sm">✏️</span>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="px-4 py-6 bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-b border-gray-600/50">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/deposit')}
            className="relative group bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <div className="relative flex items-center justify-center gap-3">
              <span className="text-2xl animate-bounce">💰</span>
              <div className="text-left">
                <div className="font-bold">Deposit</div>
                <div className="text-xs text-green-100 opacity-80">Add Funds</div>
              </div>
            </div>
          </button>
          <button 
            onClick={() => router.push('/withdraw')}
            className="relative group bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 text-white py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <div className="relative flex items-center justify-center gap-3">
              <span className="text-2xl animate-bounce">💸</span>
              <div className="text-left">
                <div className="font-bold">Withdraw</div>
                <div className="text-xs text-red-100 opacity-80">Cash Out</div>
              </div>
            </div>
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 flex justify-center gap-4">
          <button 
            onClick={() => {
              if (wsConnected) {
                refreshBalance();
              } else {
                fetchPortfolioBalance();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700/50 hover:bg-blue-600/50 rounded-lg text-xs text-blue-300 hover:text-white transition-all duration-200 border border-blue-600/30 hover:border-blue-500/50"
            disabled={balanceLoading}
          >
            <span className={balanceLoading ? 'animate-spin' : ''}>{balanceLoading ? '⟳' : '🔄'}</span>
            <span>Refresh</span>
          </button>

          <button 
            onClick={() => setShowTransactionsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-xs text-gray-300 hover:text-white transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50"
          >
            <span>📋</span>
            <span>History</span>
          </button>
          <button 
            onClick={() => setShowAlertsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-xs text-gray-300 hover:text-white transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50"
          >
            <span>🔔</span>
            <span>Alerts</span>
          </button>
        </div>
      </div>

      {/* Enhanced Financial Summary */}
      <div className="px-4 py-6 bg-gradient-to-br from-gray-800/80 to-gray-700/80 border-b border-gray-600/50">
        <div className="space-y-4">
          {/* Main Balance Card */}
          <div className="relative p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></span>
                  <span className="text-sm text-blue-300 font-medium">Total Portfolio Value</span>
                </div>
                <span className="text-xs text-blue-400">💎</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {balanceLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-400 animate-pulse">Loading...</span>
                  </div>
                ) : (
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ${getEffectiveBalanceData().totalBalance.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-300/80">
                <span>USD • {getEffectiveBalanceData().isRealTime ? 'Real-time' : 'API'} Balance</span>
                {wsConnected && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-green-400">Live</span>
                  </div>
                )}
                {!wsConnected && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    <span className="text-yellow-400">Polling</span>
                  </div>
                )}
              </div>
            </div>
          </div>



          {/* Credit Score */}
          <div className="p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <span className="text-sm text-purple-300 font-medium">Credit Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-purple-400">{userData.creditScore}</div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xs ${i < Math.floor(userData.creditScore / 20) ? 'text-yellow-400' : 'text-gray-600'}`}>
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${userData.creditScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Balances */}
      {!balanceLoading && getEffectiveBalanceData().currencies.length > 0 && (
        <div className="px-4 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Currency Balances</h3>
            {getEffectiveBalanceData().isRealTime && (
              <div className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-green-400">Live Updates</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {getEffectiveBalanceData().currencies.map((currency, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {currency.currency === 'USDT' ? 'T' : 
                     currency.currency === 'BTC' ? '₿' : 
                     currency.currency === 'ETH' ? 'Ξ' : 
                     currency.currency.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-300">{currency.currency}</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {currency.balance.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Holdings Section */}
      <div className="px-4 py-6 bg-gradient-to-br from-gray-800/90 to-gray-700/90 border-b border-gray-600/50">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">💎</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Holdings</h2>
              <div className="text-xs text-gray-400">{holdingsData.length} Assets • Live Tracking</div>
            </div>
          </div>

        </div>
        
        <div className="space-y-4">
          {holdingsData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-4xl">💎</div>
              </div>
              <div className="text-gray-300 text-lg font-medium mb-2">No holdings yet</div>
              <div className="text-gray-500 text-sm mb-6">Start building your crypto portfolio today</div>

            </div>
          ) : (
            holdingsData.map((holding, index) => (
              <div key={index} className="group relative bg-gradient-to-r from-gray-700/80 to-gray-600/80 rounded-xl p-5 border border-gray-600/50 hover:border-gray-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20">
                {/* Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {holding.icon}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          holding.profitPercent >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {holding.profitPercent >= 0 ? '↗' : '↘'}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{holding.name}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          {holding.symbol}
                          <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                          <span className="text-xs text-gray-500">{holding.amount} {holding.symbol}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">${holding.currentValue?.toLocaleString() || '0.00'}</div>
                      <div className={`text-sm font-bold flex items-center gap-1 justify-end ${
                        holding.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span>{holding.profitPercent >= 0 ? '📈' : '📉'}</span>
                        {holding.profitPercent >= 0 ? '+' : ''}{holding.profitPercent?.toFixed(2) || '0.00'}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          holding.profitPercent >= 0 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                            : 'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ 
                          width: `${Math.min(Math.abs(holding.profitPercent || 0), 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end items-center">
                    <button 
                      onClick={() => removeFromPortfolio(holding.cryptoId || holding.symbol)}
                      className="px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 text-sm rounded-lg transition-all duration-200 border border-red-500/30 hover:border-red-500/50"
                    >
                      <span className="flex items-center gap-1">
                        <span>🗑️</span>
                        Remove
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Enhanced Price Alerts Section */}
      <div className="px-4 py-6 bg-gradient-to-br from-gray-800/90 to-gray-700/90">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">🔔</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Price Alerts</h2>
              <div className="text-xs text-gray-400">{alerts.length} Active Alerts • Smart Notifications</div>
            </div>
          </div>
          <button 
            onClick={() => setShowAlertsModal(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">+</span>
              Add Alert
            </span>
          </button>
        </div>
        
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-4xl animate-pulse">🔔</div>
              </div>
              <div className="text-gray-300 text-lg font-medium mb-2">No price alerts set</div>
              <div className="text-gray-500 text-sm mb-6">Stay informed about price movements</div>
              <button 
                onClick={() => setShowAlertsModal(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Create Your First Alert
              </button>
            </div>
          ) : (
            alerts.map((alert) => {
              const crypto = marketData.find(c => c.id === alert.cryptoId);
              if (!crypto) return null;
              
              return (
                <div key={alert.id} className={`group relative bg-gradient-to-r from-gray-700/80 to-gray-600/80 rounded-xl p-5 border border-gray-600/50 hover:border-gray-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20 ${
                  alert.triggered ? 'opacity-60 border-green-500/50' : ''
                }`}>
                  {/* Background Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Triggered Alert Indicator */}
                  {alert.triggered && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                            crypto.symbol === 'BTC' ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                            crypto.symbol === 'ETH' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                            'bg-gradient-to-r from-purple-500 to-pink-500'
                          }`}>
                            {crypto.icon}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            alert.enabled ? 'bg-green-500' : 'bg-gray-500'
                          }`}>
                            {alert.enabled ? '✓' : '✕'}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">{crypto.name}</div>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              alert.condition === 'above' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {alert.condition === 'above' ? '↗ Above' : '↘ Below'}
                            </span>
                            <span className="font-bold text-white">${parseFloat(alert.targetPrice).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleAlert(alert.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                            alert.enabled 
                              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25' 
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          {alert.enabled ? '🟢 ON' : '⚫ OFF'}
                        </button>
                        <button 
                           onClick={() => removeAlert(alert.id)}
                           className="px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 text-sm rounded-lg transition-all duration-200 border border-red-500/30 hover:border-red-500/50"
                         >
                           <span className="flex items-center gap-1">
                             <span>🗑️</span>
                             Remove
                           </span>
                         </button>
                       </div>
                     </div>
                     
                     {/* Alert Status */}
                     {alert.triggered && (
                       <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                         <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                           <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                           Alert triggered! Price condition met.
                         </div>
                       </div>
                     )}
                   </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Transaction History</h2>
          <button 
            onClick={() => setShowTransactionsModal(true)}
            className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition-colors"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-gray-400 text-3xl mb-2">📊</div>
              <div className="text-gray-400 text-sm mb-3">No transactions yet</div>
              <div className="text-gray-500 text-xs">Your trading activity will appear here</div>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-gray-800 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">Total</div>
                  <div className="text-sm font-medium">{getTransactionStats().total}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">Buy</div>
                  <div className="text-sm font-medium text-green-400">{getTransactionStats().buy}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">Sell</div>
                  <div className="text-sm font-medium text-red-400">{getTransactionStats().sell}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">Value</div>
                  <div className="text-sm font-medium">${getTransactionStats().totalValue.toLocaleString()}</div>
                </div>
              </div>
              
              {/* Recent Transactions */}
              {transactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        tx.type === 'buy' ? 'bg-green-500' :
                        tx.type === 'sell' ? 'bg-red-500' :
                        tx.type === 'deposit' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }`}>
                        {tx.type === 'buy' ? '📈' :
                         tx.type === 'sell' ? '📉' :
                         tx.type === 'deposit' ? '💰' :
                         '💸'}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{tx.description}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${tx.totalValue?.toFixed(2) || '0.00'}</div>
                      <div className={`text-xs ${tx.type === 'buy' ? 'text-green-400' : tx.type === 'sell' ? 'text-red-400' : 'text-gray-400'}`}>
                        {tx.type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {transactions.length > 3 && (
                <button 
                  onClick={() => setShowTransactionsModal(true)}
                  className="w-full text-center text-sm text-blue-400 hover:text-blue-300 py-2"
                >
                  View {transactions.length - 3} more transactions
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Account & Security Section */}
      <div className="px-4 py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-gray-400">✓</span>
              <span className="text-sm">Account & Security</span>
            </div>
          </div>
          
          <div 
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => setShowKycModal(true)}
          >
            <div className="flex items-center gap-3">
              {kycStatus.loading ? (
                <span className="text-gray-400">⏳</span>
              ) : kycStatus.status === 'approved' ? (
                <span className="text-green-400">✓</span>
              ) : kycStatus.status === 'rejected' ? (
                <span className="text-red-400">✗</span>
              ) : kycStatus.status === 'pending' ? (
                <span className="text-yellow-400">⏳</span>
              ) : (
                <span className="text-orange-400">⚠</span>
              )}
              <span className="text-sm">KYC Verification</span>
              {kycStatus.loading ? (
                <span className="text-xs text-gray-400">Loading...</span>
              ) : (
                <span className={`text-xs ${
                  kycStatus.status === 'approved' ? 'text-green-400' :
                  kycStatus.status === 'rejected' ? 'text-red-400' :
                  kycStatus.status === 'pending' ? 'text-yellow-400' :
                  'text-orange-400'
                }`}>
                  {kycStatus.status === 'approved' ? 'Approved' :
                   kycStatus.status === 'rejected' ? 'Rejected' :
                   kycStatus.status === 'pending' ? 'Pending' :
                   'Required'}
                </span>
              )}
            </div>
            <span className="text-gray-400">›</span>
          </div>
          

        </div>
      </div>

      {/* Log Out Button */}
      <div className="px-4 py-4 pb-20">
        <button 
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Log out
        </button>
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2 z-40">
        <div className="flex justify-around">
          {navTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => router.push(tab.route)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg text-xs transition-colors ${
                router.pathname === tab.route
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Add padding at the bottom to prevent content from being hidden behind the navbar */}
      <div className="pb-16"></div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add to Portfolio</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Cryptocurrency</label>
                <select 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                >
                  <option value="">Choose crypto...</option>
                  {cryptoList.map(crypto => (
                    <option key={crypto.id} value={crypto.id}>
                      {crypto.name} ({crypto.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input 
                  type="number" 
                  step="0.0001"
                  placeholder="0.0000"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  onChange={(e) => setSelectedAmount(parseFloat(e.target.value))}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (selectedCrypto && selectedAmount) {
                      const crypto = marketData.find(c => c.id === selectedCrypto);
                      if (crypto) {
                        addToPortfolio(selectedCrypto, selectedAmount, parseFloat(crypto.price));
                        setShowAddModal(false);
                        setSelectedCrypto(null);
                        setSelectedAmount(0);
                      }
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Deposit Funds</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              {(depositAddresses.usdt || depositAddresses.btc || depositAddresses.eth) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-1">Deposit Addresses</div>
                  {depositAddresses.usdt && (
                    <div className="text-xs text-gray-300 break-all">
                      <span className="text-gray-400 mr-2">USDT:</span>{depositAddresses.usdt}
                    </div>
                  )}
                  {depositAddresses.btc && (
                    <div className="text-xs text-gray-300 break-all">
                      <span className="text-gray-400 mr-2">BTC:</span>{depositAddresses.btc}
                    </div>
                  )}
                  {depositAddresses.eth && (
                    <div className="text-xs text-gray-300 break-all">
                      <span className="text-gray-400 mr-2">ETH:</span>{depositAddresses.eth}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositAmount('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (depositAmount && parseFloat(depositAmount) > 0) {
                      // Record deposit transaction
                      addTransaction({
                        type: 'deposit',
                        amount: parseFloat(depositAmount),
                        description: `Deposited $${depositAmount} USD`,
                        totalValue: parseFloat(depositAmount)
                      });
                      alert(`Deposit of $${depositAmount} USD initiated successfully!`);
                      setShowDepositModal(false);
                      setDepositAmount('');
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Withdraw Funds</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select 
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input 
                  type="number" 
                  step="0.00000001"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Available: {realTimeBalances[selectedCurrency] || 0} {selectedCurrency}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Withdrawal Address</label>
                <input 
                  type="text" 
                  placeholder="Enter wallet address"
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Network</label>
                <select 
                  value={withdrawalNetwork}
                  onChange={(e) => setWithdrawalNetwork(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="ethereum">Ethereum (ERC-20)</option>
                  <option value="tron">Tron (TRC-20)</option>
                  <option value="bitcoin">Bitcoin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Note (Optional)</label>
                <textarea 
                  placeholder="Add a note for your withdrawal"
                  value={withdrawalNote}
                  onChange={(e) => setWithdrawalNote(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 h-20 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setWithdrawalAddress('');
                    setWithdrawalNote('');
                    setSelectedCurrency('USDT');
                    setWithdrawalNetwork('ethereum');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleWithdrawalSubmit}
                  disabled={withdrawalLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  {withdrawalLoading ? 'Processing...' : 'Submit Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Verification Modal */}
      {showKycModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">KYC Verification</h3>
              <button 
                onClick={() => setShowKycModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {kycStatus.loading ? (
              <div className="bg-gray-900 bg-opacity-20 border border-gray-500 rounded-lg p-6 mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-gray-400 text-2xl">⏳</span>
                  <span className="text-gray-400 font-medium text-lg">Loading KYC Status...</span>
                </div>
              </div>
            ) : kycStatus.status === 'approved' ? (
              <div className="bg-green-900 bg-opacity-20 border border-green-500 rounded-lg p-6 mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-green-400 text-2xl">✅</span>
                  <span className="text-green-400 font-medium text-lg">KYC Verification Approved</span>
                </div>
                <p className="text-gray-300 text-base leading-relaxed">
                  Your identity has been successfully verified.
                </p>
                {kycStatus.verifiedAt && (
                  <p className="text-sm text-gray-400 mt-2">
                    Verified on {new Date(kycStatus.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : kycStatus.status === 'rejected' ? (
              <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-6 mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-red-400 text-2xl">❌</span>
                  <span className="text-red-400 font-medium text-lg">KYC Verification Rejected</span>
                </div>
                <p className="text-gray-300 text-base leading-relaxed">
                  Your KYC verification was rejected. Please contact customer service for assistance.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Our team can help you resolve any issues with your verification.
                </p>
              </div>
            ) : kycStatus.status === 'pending' ? (
              <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-6 mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-yellow-400 text-2xl">⏳</span>
                  <span className="text-yellow-400 font-medium text-lg">KYC Verification Pending</span>
                </div>
                <p className="text-gray-300 text-base leading-relaxed">
                  Your KYC verification is currently under review.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  We'll notify you once the review is complete.
                </p>
              </div>
            ) : (
              <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-6 mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-blue-400 text-2xl">🎧</span>
                  <span className="text-blue-400 font-medium text-lg">KYC Verification Required</span>
                </div>
                <p className="text-gray-300 text-base leading-relaxed">
                  Please contact our customer service for KYC verification.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Our team will guide you through the verification process.
                </p>
              </div>
            )}
              
            <button 
              onClick={() => setShowKycModal(false)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Change Password</h3>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input 
                  type="password" 
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input 
                  type="password" 
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input 
                  type="password" 
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (currentPassword && newPassword && confirmPassword) {
                      if (newPassword === confirmPassword) {
                        if (newPassword.length >= 8) {
                          alert('Password changed successfully!');
                          setShowPasswordModal(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        } else {
                          alert('New password must be at least 8 characters long.');
                        }
                      } else {
                        alert('New passwords do not match.');
                      }
                    } else {
                      alert('Please fill in all fields.');
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">System Notifications</h3>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-400">Receive updates via email</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium">SMS Notifications</div>
                  <div className="text-sm text-gray-400">Receive updates via SMS</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium">Price Alerts</div>
                  <div className="text-sm text-gray-400">Get notified of price changes</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <button 
                onClick={() => {
                  alert('Notification settings saved successfully!');
                  setShowNotificationModal(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">User Profile</h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input 
                  type="text" 
                  value={userProfile.username}
                  readOnly
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Official ID</label>
                <input 
                  type="text" 
                  value={userProfile.officialId}
                  readOnly
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-400 cursor-not-allowed font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  value={userProfile.email}
                  readOnly
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={userProfile.phone}
                  readOnly
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">VIP Level (Read Only)</label>
                <input 
                  type="text"
                  value={userProfile.vipLevel}
                  readOnly
                  className="w-full bg-gray-600 border border-gray-600 rounded px-3 py-2 text-gray-300 cursor-not-allowed"
                />
              </div>
              
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
                >
                  Close
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await signOut();
                      setShowProfileModal(false);
                      // Force page reload to clear all cached data
                      window.location.reload();
                    } catch (error) {
                      console.error('Logout error:', error);
                      alert('Error logging out. Please try again.');
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create Price Alert</h3>
              <button 
                onClick={() => {
                  setShowAlertsModal(false);
                  setNewAlert({ cryptoId: '', targetPrice: '', condition: 'above', enabled: true });
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cryptocurrency</label>
                <select 
                  value={newAlert.cryptoId}
                  onChange={(e) => setNewAlert({...newAlert, cryptoId: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="">Select cryptocurrency...</option>
                  {cryptoList.map(crypto => (
                    <option key={crypto.id} value={crypto.id}>
                      {crypto.name} ({crypto.symbol})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Price (USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={newAlert.targetPrice}
                  onChange={(e) => setNewAlert({...newAlert, targetPrice: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <select 
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert({...newAlert, condition: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="alertEnabled"
                  checked={newAlert.enabled}
                  onChange={(e) => setNewAlert({...newAlert, enabled: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="alertEnabled" className="text-sm text-gray-300">
                  Enable alert immediately
                </label>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowAlertsModal(false);
                    setNewAlert({ cryptoId: '', targetPrice: '', condition: 'above', enabled: true });
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (newAlert.cryptoId && newAlert.targetPrice) {
                      addAlert(newAlert);
                      setShowAlertsModal(false);
                      setNewAlert({ cryptoId: '', targetPrice: '', condition: 'above', enabled: true });
                      alert('Price alert created successfully!');
                    } else {
                      alert('Please fill in all required fields.');
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Transaction History</h3>
              <button 
                onClick={() => setShowTransactionsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: getTransactionStats().total },
                { key: 'buy', label: 'Buy', count: getTransactionStats().buy },
                { key: 'sell', label: 'Sell', count: getTransactionStats().sell },
                { key: 'deposit', label: 'Deposit', count: getTransactionStats().deposit },
                { key: 'withdraw', label: 'Withdraw', count: getTransactionStats().withdraw }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTransactionFilter(filter.key)}
                  className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${
                    transactionFilter === filter.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
            
            {/* Transaction List */}
            <div className="space-y-3">
              {getFilteredTransactions().length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <div className="text-gray-400 text-sm">No transactions found</div>
                </div>
              ) : (
                getFilteredTransactions().map((tx) => (
                  <div key={tx.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          tx.type === 'buy' ? 'bg-green-500' :
                          tx.type === 'sell' ? 'bg-red-500' :
                          tx.type === 'deposit' ? 'bg-blue-500' :
                          'bg-purple-500'
                        }`}>
                          {tx.type === 'buy' ? '📈' :
                           tx.type === 'sell' ? '📉' :
                           tx.type === 'deposit' ? '💰' :
                           '💸'}
                        </div>
                        <div>
                          <div className="font-medium">{tx.description}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                          {tx.cryptoName && (
                            <div className="text-xs text-gray-500">
                              {tx.cryptoName} • {tx.amount} {tx.cryptoId}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${tx.totalValue?.toFixed(2) || '0.00'}</div>
                        <div className={`text-sm ${tx.type === 'buy' ? 'text-green-400' : tx.type === 'sell' ? 'text-red-400' : 'text-gray-400'}`}>
                          {tx.type.toUpperCase()}
                        </div>
                        {tx.price && (
                          <div className="text-xs text-gray-500">
                            @ ${tx.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Summary Stats */}
            {getFilteredTransactions().length > 0 && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h4 className="font-medium mb-3">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Total Transactions</div>
                    <div className="text-lg font-bold">{getFilteredTransactions().length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Total Value</div>
                    <div className="text-lg font-bold">${getFilteredTransactions().reduce((sum, tx) => sum + (tx.totalValue || 0), 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Average Value</div>
                    <div className="text-lg font-bold">${(getFilteredTransactions().reduce((sum, tx) => sum + (tx.totalValue || 0), 0) / getFilteredTransactions().length).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Last Transaction</div>
                    <div className="text-lg font-bold">
                      {getFilteredTransactions().length > 0 ? new Date(getFilteredTransactions()[0].timestamp).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



                  




      {/* Customer Service Modal */}
      {showCustomerServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl">🎧</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Customer Service</h2>
            </div>

            {/* Contact Options */}
            <div className="space-y-3 mb-6">
              <div 
                onClick={handleTelegramClick}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  contactConfig.telegram 
                    ? 'bg-blue-50 hover:bg-blue-100' 
                    : 'bg-gray-50 cursor-not-allowed'
                }`}
              >
                <span className="text-blue-500 text-xl">📨</span>
                <span className="text-gray-800 font-medium">Telegram</span>
                {contactConfig.telegram && (
                  <span className="text-xs text-blue-600 ml-auto">Click to open</span>
                )}
              </div>
              <div 
                onClick={handleWhatsAppClick}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  contactConfig.whatsapp 
                    ? 'bg-green-50 hover:bg-green-100' 
                    : 'bg-gray-50 cursor-not-allowed'
                }`}
              >
                <span className="text-green-500 text-xl">📞</span>
                <span className="text-gray-800 font-medium">WhatsApp</span>
                {contactConfig.whatsapp && (
                  <span className="text-xs text-green-600 ml-auto">Click to open</span>
                )}
              </div>
            </div>

            {/* Submit Request Form */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Submit a request</h3>
              
              <form onSubmit={handleCustomerServiceSubmit} className="space-y-4">
                {/* Department Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={customerServiceForm.department}
                    onChange={(e) => setCustomerServiceForm({...customerServiceForm, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="support">Customer Support</option>
                    <option value="finance">Finance Department</option>
                  </select>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registered Email in Quantex
                  </label>
                  <input
                    type="email"
                    value={customerServiceForm.email}
                    onChange={(e) => setCustomerServiceForm({...customerServiceForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={customerServiceForm.subject}
                    onChange={(e) => setCustomerServiceForm({...customerServiceForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={customerServiceForm.description}
                    onChange={(e) => setCustomerServiceForm({...customerServiceForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 bg-white"
                    placeholder="Please provide detailed information about your request..."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Please enter the details of your request. A member of our support staff will respond as soon as possible.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  Submit
                </button>
              </form>
            </div>

            {/* Close Button */}
            <div className="text-center">
              <button
                onClick={() => setShowCustomerServiceModal(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}