import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { safeLocalStorage, safeWindow, getSafeDocument } from '../utils/safeStorage';
import { supabase } from '../lib/supabase';
import useRealTimeBalance from '../hooks/useRealTimeBalance';
import { useAuth } from '../contexts/AuthContext';
import { getCryptoImageUrl } from '../utils/cryptoIcons';

// Cryptocurrency list with more trading pairs
const cryptoList = [
  { id: 'bitcoin', name: 'Bitcoin/BTC', symbol: 'BTC', icon: getCryptoImageUrl('BTC') },
  { id: 'ethereum', name: 'Ethereum/ETH', symbol: 'ETH', icon: getCryptoImageUrl('ETH') },
  { id: 'tether', name: 'Tether/USDT', symbol: 'USDT', icon: getCryptoImageUrl('USDT') },
  { id: 'binancecoin', name: 'BNB/BNB', symbol: 'BNB', icon: getCryptoImageUrl('BNB') },
  { id: 'solana', name: 'Solana/SOL', symbol: 'SOL', icon: getCryptoImageUrl('SOL') },
  { id: 'cardano', name: 'Cardano/ADA', symbol: 'ADA', icon: getCryptoImageUrl('ADA') },
  { id: 'polkadot', name: 'Polkadot/DOT', symbol: 'DOT', icon: getCryptoImageUrl('DOT') },
  { id: 'dogecoin', name: 'Dogecoin/DOGE', symbol: 'DOGE', icon: getCryptoImageUrl('DOGE') },
  { id: 'avalanche-2', name: 'Avalanche/AVAX', symbol: 'AVAX', icon: getCryptoImageUrl('AVAX') },
  { id: 'chainlink', name: 'Chainlink/LINK', symbol: 'LINK', icon: getCryptoImageUrl('LINK') },
  { id: 'polygon', name: 'Polygon/MATIC', symbol: 'MATIC', icon: getCryptoImageUrl('MATIC') },
  { id: 'litecoin', name: 'Litecoin/LTC', symbol: 'LTC', icon: getCryptoImageUrl('LTC') },
  { id: 'uniswap', name: 'Uniswap/UNI', symbol: 'UNI', icon: getCryptoImageUrl('UNI') },
  { id: 'bitcoin-cash', name: 'Bitcoin Cash/BCH', symbol: 'BCH', icon: getCryptoImageUrl('BCH') },
  { id: 'stellar', name: 'Stellar/XLM', symbol: 'XLM', icon: getCryptoImageUrl('XLM') },
  { id: 'vechain', name: 'VeChain/VET', symbol: 'VET', icon: getCryptoImageUrl('VET') },
  { id: 'filecoin', name: 'Filecoin/FIL', symbol: 'FIL', icon: getCryptoImageUrl('FIL') },
  { id: 'cosmos', name: 'Cosmos/ATOM', symbol: 'ATOM', icon: getCryptoImageUrl('ATOM') },
  { id: 'monero', name: 'Monero/XMR', symbol: 'XMR', icon: getCryptoImageUrl('XMR') },
  { id: 'algorand', name: 'Algorand/ALGO', symbol: 'ALGO', icon: getCryptoImageUrl('ALGO') },
  { id: 'tezos', name: 'Tezos/XTZ', symbol: 'XTZ', icon: getCryptoImageUrl('XTZ') },
  { id: 'aave', name: 'Aave/AAVE', symbol: 'AAVE', icon: getCryptoImageUrl('AAVE') },
  { id: 'compound', name: 'Compound/COMP', symbol: 'COMP', icon: getCryptoImageUrl('COMP') },
  { id: 'synthetix-network-token', name: 'Synthetix/SNX', symbol: 'SNX', icon: getCryptoImageUrl('SNX') },
  { id: 'yearn-finance', name: 'Yearn Finance/YFI', symbol: 'YFI', icon: getCryptoImageUrl('YFI') },
  { id: 'decentraland', name: 'Decentraland/MANA', symbol: 'MANA', icon: getCryptoImageUrl('MANA') },
  { id: 'the-sandbox', name: 'The Sandbox/SAND', symbol: 'SAND', icon: getCryptoImageUrl('SAND') },
  { id: 'enjin-coin', name: 'Enjin Coin/ENJ', symbol: 'ENJ', icon: getCryptoImageUrl('ENJ') },
  { id: 'axie-infinity', name: 'Axie Infinity/AXS', symbol: 'AXS', icon: getCryptoImageUrl('AXS') },
  { id: 'gala', name: 'Gala/GALA', symbol: 'GALA', icon: getCryptoImageUrl('GALA') },
  { id: 'flow', name: 'Flow/FLOW', symbol: 'FLOW', icon: getCryptoImageUrl('FLOW') },
  { id: 'near', name: 'NEAR Protocol/NEAR', symbol: 'NEAR', icon: getCryptoImageUrl('NEAR') },
  { id: 'fantom', name: 'Fantom/FTM', symbol: 'FTM', icon: getCryptoImageUrl('FTM') },
  { id: 'harmony', name: 'Harmony/ONE', symbol: 'ONE', icon: getCryptoImageUrl('ONE') },
  { id: 'kusama', name: 'Kusama/KSM', symbol: 'KSM', icon: getCryptoImageUrl('KSM') },
  { id: 'zilliqa', name: 'Zilliqa/ZIL', symbol: 'ZIL', icon: getCryptoImageUrl('ZIL') },
  { id: 'icon', name: 'ICON/ICX', symbol: 'ICX', icon: getCryptoImageUrl('ICX') },
  { id: 'ontology', name: 'Ontology/ONT', symbol: 'ONT', icon: getCryptoImageUrl('ONT') },
  { id: 'neo', name: 'NEO/NEO', symbol: 'NEO', icon: getCryptoImageUrl('NEO') },
  { id: 'qtum', name: 'Qtum/QTUM', symbol: 'QTUM', icon: getCryptoImageUrl('QTUM') },
  { id: 'verge', name: 'Verge/XVG', symbol: 'XVG', icon: getCryptoImageUrl('XVG') },
  { id: 'siacoin', name: 'Siacoin/SC', symbol: 'SC', icon: getCryptoImageUrl('SC') },
  { id: 'steem', name: 'Steem/STEEM', symbol: 'STEEM', icon: getCryptoImageUrl('STEEM') },
  { id: 'waves', name: 'Waves/WAVES', symbol: 'WAVES', icon: getCryptoImageUrl('WAVES') },
  { id: 'nxt', name: 'NXT/NXT', symbol: 'NXT', icon: getCryptoImageUrl('NXT') },
  { id: 'bytecoin', name: 'Bytecoin/BCN', symbol: 'BCN', icon: getCryptoImageUrl('BCN') },
  { id: 'digibyte', name: 'DigiByte/DGB', symbol: 'DGB', icon: getCryptoImageUrl('DGB') },
  { id: 'vertcoin', name: 'Vertcoin/VTC', symbol: 'VTC', icon: getCryptoImageUrl('VTC') },
  { id: 'feathercoin', name: 'Feathercoin/FTC', symbol: 'FTC', icon: getCryptoImageUrl('FTC') },
  { id: 'novacoin', name: 'Novacoin/NVC', symbol: 'NVC', icon: getCryptoImageUrl('NVC') },
  { id: 'primecoin', name: 'Primecoin/XPM', symbol: 'XPM', icon: getCryptoImageUrl('XPM') },
  { id: 'peercoin', name: 'Peercoin/PPC', symbol: 'PPC', icon: getCryptoImageUrl('PPC') },
  { id: 'namecoin', name: 'Namecoin/NMC', symbol: 'NMC', icon: getCryptoImageUrl('NMC') }
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
  const [depositAddresses, setDepositAddresses] = useState({ 
    usdt: 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
    btc: '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
    eth: '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [withdrawalNetwork, setWithdrawalNetwork] = useState('');
  const [withdrawalNote, setWithdrawalNote] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [showInitialZeroBalance, setShowInitialZeroBalance] = useState(true);

  // Reset initial zero balance flag when withdraw modal opens
  useEffect(() => {
    if (showWithdrawModal) {
      setShowInitialZeroBalance(true); // Show 0 until user selects currency and network
      setSelectedCurrency(''); // Start with no currency selected
      setWithdrawalNetwork(''); // Start with no network selected
    }
  }, [showWithdrawModal]);
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
  
  // Active trades state
  const [activeTrades, setActiveTrades] = useState([]);
  const [activeTradesLoading, setActiveTradesLoading] = useState(false);

  // Fetch active trades from database
  const fetchActiveTrades = async () => {
    try {
      setActiveTradesLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found for active trades');
        setActiveTrades([]);
        return;
      }

      const response = await fetch('/api/trading/active-trades', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Active trades fetched:', data.trades);
        setActiveTrades(data.trades || []);
      } else {
        console.error('Failed to fetch active trades:', response.status);
        setActiveTrades([]);
      }
    } catch (error) {
      console.error('Error fetching active trades:', error);
      setActiveTrades([]);
    } finally {
      setActiveTradesLoading(false);
    }
  };

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
      let next;
      if (saved) {
        const cfg = JSON.parse(saved);
        next = {
          usdt: cfg.usdtAddress || (cfg.deposit_addresses?.usdt ?? 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W'),
          btc: cfg.btcAddress || (cfg.deposit_addresses?.btc ?? '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4'),
          eth: cfg.ethAddress || (cfg.deposit_addresses?.eth ?? '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'),
        };
      } else {
        // Use default addresses if no config exists
        next = {
          usdt: 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
          btc: '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
          eth: '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
        };
      }
      console.log('Loading deposit addresses:', next);
      setDepositAddresses(next);
    } catch (_e) {
      console.error('Error loading deposit addresses:', _e);
      // Fallback to default addresses on error
      setDepositAddresses({
        usdt: 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
        btc: '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
        eth: '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
      });
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

    // Get balance from effective balance data (real-time or API fallback)
    const effectiveBalanceData = getEffectiveBalanceData();
    const currencyBalance = effectiveBalanceData.currencies.find(c => c.currency === selectedCurrency);
    const availableBalance = currencyBalance ? currencyBalance.balance : 0;
    
    if (amount > availableBalance) {
      alert(`Insufficient balance. Available: ${availableBalance} ${selectedCurrency}`);
      return;
    }

    setWithdrawalLoading(true);

    try {
      if (!isAuthenticated || !user) {
        alert('Please log in to submit a withdrawal request');
        return;
      }

      // Get fresh session for API call
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        alert('Authentication session expired. Please log in again.');
        return;
      }

      // Verify token is valid by testing with a simple API call first
      const testResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!testResponse.ok) {
        alert('Authentication token is invalid. Please log in again.');
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
          amount: withdrawAmount,
          wallet_address: withdrawalAddress,
          network: withdrawalNetwork || 'ethereum'
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
      // Convert real-time balances to portfolio format with proper USD calculation
      const currencies = Object.entries(realTimeBalances).map(([currency, balance]) => {
        const currencyUpper = currency.toUpperCase();
        const balanceAmount = parseFloat(balance) || 0;
        
        // Calculate USD value using market data
        let usdValue = 0;
        if (currencyUpper === 'USDT') {
          // USDT is always $1
          usdValue = balanceAmount * 1.0;
        } else {
          // Find matching market data for this currency
          const marketItem = marketData.find(item => {
            const symbol = item.name.split('/')[0];
            return symbol === currencyUpper || item.id === currency.toLowerCase();
          });
          
          if (marketItem) {
            usdValue = balanceAmount * parseFloat(marketItem.price);
          }
        }
        
        return {
          currency: currencyUpper,
          balance: balanceAmount,
          value: usdValue
        };
      });
      
      // Calculate total balance from individual currency values
      const calculatedTotal = currencies.reduce((sum, curr) => sum + curr.value, 0);
      
      const result = {
        totalBalance: calculatedTotal,
        currencies,
        summary: {
          totalCurrencies: currencies.length,
          totalBalance: calculatedTotal,
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
      totalBalance: portfolioBalance?.totalBalance || 0, // Safe fallback for totalBalance
      currencies: portfolioBalance?.currencies || [], // Safe fallback for currencies array
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



  // Add to portfolio
  const addToPortfolio = async (cryptoId, amount, price) => {
    try {
      // Refresh portfolio data from API
      await fetchPortfolioBalance();
      
    } catch (error) {
      console.error('Error adding to portfolio:', error);
    }
  };

  // Remove from portfolio - now updates via API
  const removeFromPortfolio = async (cryptoId) => {
    try {
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



    
    // Always fetch portfolio balance on mount
    console.log('🔥 About to call fetchPortfolioBalance');
    const loadPortfolioBalance = async () => {
      try {
        await fetchPortfolioBalance(); // Fetch portfolio balance from database
        console.log('✅ fetchPortfolioBalance called successfully');
      } catch (error) {
        console.error('❌ Error calling fetchPortfolioBalance:', error);
      }
    };
    loadPortfolioBalance();
    
    // Fetch active trades on mount
    fetchActiveTrades();
    
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
    const balanceInterval = setInterval(async () => {
      if (!wsConnected) {
        try {
          await fetchPortfolioBalance();
        } catch (error) {
          console.error('Error in balance interval:', error);
        }
      }
    }, 30000);
    
    // Listen for admin config updates from /admin/operate
    const document = getSafeDocument();
    const onCfg = () => {
      loadDepositAddressesFromLocal();
      fetchContactConfig();
    };
    
    // Listen for force address updates
    const onForceUpdate = (event) => {
      console.log('Force address update received:', event.detail);
      if (event.detail?.addresses) {
        setDepositAddresses({
          usdt: event.detail.addresses.usdtAddress || 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
          btc: event.detail.addresses.btcAddress || '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
          eth: event.detail.addresses.ethAddress || '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
        });
      }
    };
    
    if (document) {
      document.addEventListener('webConfigUpdated', onCfg);
      document.addEventListener('forceAddressUpdate', onForceUpdate);
    }
    
    // Listen for page visibility changes to refresh balance when user returns
    const handleVisibilityChange = async () => {
      if (!document.hidden && !wsConnected) {
        try {
          await fetchPortfolioBalance();
        } catch (error) {
          console.error('Error in visibility change handler:', error);
        }
      }
    };
    if (document) document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(marketInterval);
      clearInterval(balanceInterval);
      if (document) {
        document.removeEventListener('webConfigUpdated', onCfg);
        document.removeEventListener('forceAddressUpdate', onForceUpdate);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (kycChannel) {
        kycChannel.close();
      }
    };
  }, [wsConnected]);

  // Setup global toast notification function
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
          icon: getCryptoImageUrl('USDT'),
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
    creditScore: userProfile.credit_score || 100
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
          <div className="space-y-3">
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
            onClick={async () => {
              if (wsConnected) {
                refreshBalance();
              } else {
                try {
                  await fetchPortfolioBalance();
                } catch (error) {
                  console.error('Error in refresh button:', error);
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700/50 hover:bg-blue-600/50 rounded-lg text-xs text-blue-300 hover:text-white transition-all duration-200 border border-blue-600/30 hover:border-blue-500/50"
            disabled={balanceLoading}
          >
            <span className={balanceLoading ? 'animate-spin' : ''}>{balanceLoading ? '⟳' : '🔄'}</span>
            <span>Refresh</span>
          </button>



        </div>
      </div>

      {/* Enhanced Financial Summary */}
      <div className="px-4 py-3 bg-gradient-to-br from-gray-800/80 to-gray-700/80 border-b border-gray-600/50">
        <div className="space-y-3">
          {/* Main Balance Card */}
          <div className="relative p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></span>
                  <span className="text-sm text-blue-300 font-medium">Total Portfolio Value</span>
                </div>
                <span className="text-xs text-blue-400">💎</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">
                {balanceLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-400 animate-pulse">Loading...</span>
                  </div>
                ) : (
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ${(getEffectiveBalanceData().totalBalance || 0).toLocaleString()}
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
          <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <span className="text-sm text-purple-300 font-medium">Credit Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-purple-400">{userData.creditScore}</div>
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



      {/* Enhanced Holdings Section */}
      <div className="px-4 py-3 bg-gradient-to-br from-gray-800/90 to-gray-700/90 border-b border-gray-600/50">
        <div className="flex justify-between items-center mb-3">
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
              <div key={index} className="group relative bg-gradient-to-r from-gray-700/80 to-gray-600/80 rounded-xl p-3 border border-gray-600/50 hover:border-gray-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20">
                {/* Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-700/50 border border-gray-600/30 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg overflow-hidden">
                          {holding.icon && holding.icon.startsWith('http') ? (
                            <img 
                              src={holding.icon} 
                              alt={holding.symbol} 
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span 
                            className="text-white font-bold text-lg" 
                            style={{ display: holding.icon && holding.icon.startsWith('http') ? 'none' : 'block' }}
                          >
                            {typeof holding.icon === 'string' && !holding.icon.startsWith('http') ? holding.icon : holding.symbol?.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">{holding.name}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          {holding.symbol}
                          <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                          <span className="text-xs text-gray-500">{holding.amount} {holding.symbol}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">${holding.currentValue?.toLocaleString() || '0.00'}</div>
                    </div>
                  </div>

                  

                </div>
              </div>
            ))
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
                   kycStatus.status === 'pending' ? 'Required' :
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
                  onChange={(e) => {
                    setSelectedCurrency(e.target.value);
                    setShowInitialZeroBalance(e.target.value === '' || withdrawalNetwork === '');
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="">Select Currency</option>
                  <option value="USDT">USDT (Tether)</option>
                  <option value="BTC">BTC (Bitcoin)</option>
                  <option value="ETH">ETH (Ethereum)</option>
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
                  Available: {(() => {
                    if (showInitialZeroBalance || !selectedCurrency || !withdrawalNetwork) return 0;
                    const effectiveBalanceData = getEffectiveBalanceData();
                    const currencyBalance = effectiveBalanceData.currencies.find(c => c.currency === selectedCurrency);
                    return currencyBalance ? currencyBalance.balance : 0;
                  })()} {selectedCurrency || 'Currency'}
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
                  onChange={(e) => {
                    setWithdrawalNetwork(e.target.value);
                    setShowInitialZeroBalance(e.target.value === '' || selectedCurrency === '');
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="">Select Network</option>
                  <option value="ethereum">Ethereum (TRC-20)</option>
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
                    setSelectedCurrency('');
                    setWithdrawalNetwork('');
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
                  <span className="text-yellow-400 text-2xl">⚠</span>
                  <span className="text-yellow-400 font-medium text-lg">KYC Verification Required</span>
                </div>
                <p className="text-gray-300 text-base leading-relaxed">
                  Please contact our customer service for further details.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Our team will assist you with the verification process.
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
              
              <div className="flex justify-center">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
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