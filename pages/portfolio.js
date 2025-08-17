import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { safeLocalStorage, safeWindow, getSafeDocument } from '../utils/safeStorage';

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
  { label: 'MARKET', icon: '📊', route: '/market' },
  { label: 'FEATURES', icon: '✨', route: '/features' },
  { label: 'PORTFOLIO', icon: '📈', route: '/portfolio' },
  { label: 'TRADE', icon: '💱', route: '/trade' },
];

export default function PortfolioPage() {
  const router = useRouter();
  const [marketData, setMarketData] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showKycModal, setShowKycModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    username: "User123",
    officialId: "ID123456",
    vipLevel: "Gold",
    email: "user@example.com",
    phone: "+1 234 567 8900"
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
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('1M'); // '1W', '1M', '3M', '6M', '1Y'
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [showCustomerServiceModal, setShowCustomerServiceModal] = useState(false);
  const [customerServiceForm, setCustomerServiceForm] = useState({
    email: '',
    subject: '',
    description: '',
    department: 'support' // 'support' or 'finance'
  });

  // Fetch real-time price data - LIVE DATA ONLY
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use Binance API - more reliable than CoinGecko
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter and format data for our crypto list
      const formattedData = cryptoList.map(crypto => {
        const symbol = crypto.symbol + 'USDT';
        const binanceData = data.find(item => item.symbol === symbol);
        
        if (!binanceData) {
          // Fallback to other symbols if exact match not found
          const fallbackSymbols = [crypto.symbol + 'USDT', crypto.symbol + 'USD', crypto.symbol + 'BTC'];
          const fallbackData = data.find(item => fallbackSymbols.includes(item.symbol));
          
          if (!fallbackData) {
            throw new Error(`No data available for ${crypto.symbol}`);
          }
          
          return {
            id: crypto.id,
            name: `${crypto.symbol}/USDT`,
            icon: crypto.icon,
            price: parseFloat(fallbackData.lastPrice).toFixed(2),
            change: parseFloat(fallbackData.priceChangePercent).toFixed(2),
            volume: parseFloat(fallbackData.volume) || 0,
            marketCap: 0, // Binance doesn't provide market cap in this endpoint
          };
        }
        
        return {
          id: crypto.id,
          name: `${crypto.symbol}/USDT`,
          icon: crypto.icon,
          price: parseFloat(binanceData.lastPrice).toFixed(2),
          change: parseFloat(binanceData.priceChangePercent).toFixed(2),
          volume: parseFloat(binanceData.volume) || 0,
          marketCap: 0, // Binance doesn't provide market cap in this endpoint
        };
      });
      
      setMarketData(formattedData);
      setLoading(false);
      
    } catch (err) {
      console.error('Error fetching market data:', err);
      
      // Fallback to CoinGecko if Binance fails
      try {
        const cryptoIds = cryptoList.map(crypto => crypto.id).join(',');
        const fallbackResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(8000),
          }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          const formattedData = cryptoList.map(crypto => {
            const cryptoData = fallbackData[crypto.id];
            if (!cryptoData || !cryptoData.usd) {
              throw new Error(`No data available for ${crypto.symbol}`);
            }
            
            return {
              id: crypto.id,
              name: `${crypto.symbol}/USDT`,
              icon: crypto.icon,
              price: cryptoData.usd.toFixed(2),
              change: cryptoData.usd_24h_change?.toFixed(2) || '0.00',
              volume: 0,
              marketCap: 0,
            };
          });
          
          setMarketData(formattedData);
          setLoading(false);
          return;
        }
      } catch (fallbackErr) {
        console.error('Fallback API also failed:', fallbackErr);
      }
      
      // Show minimal error and retry
      setError('Connecting to market data...');
      setMarketData([]);
      setLoading(false);
      
      // Retry after 5 seconds
      setTimeout(() => {
        fetchMarketData();
      }, 5000);
    }
  };

  // Load portfolio from localStorage
  const loadPortfolio = () => {
    const saved = safeLocalStorage.getItem('portfolio');
    if (saved) {
      setPortfolio(JSON.parse(saved));
    }
  };

  // Save portfolio to localStorage
  const savePortfolio = (newPortfolio) => {
    safeLocalStorage.setItem('portfolio', JSON.stringify(newPortfolio));
  };

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
    const saved = safeLocalStorage.getItem('transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
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

  // Calculate portfolio analytics
  const getPortfolioAnalytics = () => {
    const holdings = getRealHoldings();
    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    const totalSpent = holdings.reduce((sum, holding) => sum + (holding.amount * holding.avgPrice), 0);
    const totalProfit = totalValue - totalSpent;
    const profitPercentage = totalSpent > 0 ? (totalProfit / totalSpent) * 100 : 0;

    // Calculate asset allocation
    const assetAllocation = holdings.map(holding => ({
      name: holding.name,
      symbol: holding.symbol,
      value: holding.currentValue,
      percentage: totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0,
      profit: holding.profit || 0,
      profitPercentage: holding.profitPercent || 0
    }));

    // Calculate performance metrics
    const bestPerformer = holdings.length > 0 ? 
      holdings.reduce((best, current) => 
        (current.profitPercent || 0) > (best.profitPercent || 0) ? current : best
      ) : null;

    const worstPerformer = holdings.length > 0 ? 
      holdings.reduce((worst, current) => 
        (current.profitPercent || 0) < (worst.profitPercent || 0) ? current : worst
      ) : null;

    return {
      totalValue,
      totalSpent,
      totalProfit,
      profitPercentage,
      assetAllocation,
      bestPerformer,
      worstPerformer,
      holdingsCount: holdings.length
    };
  };

  // Generate mock portfolio history for charts
  const generatePortfolioHistory = () => {
    const analytics = getPortfolioAnalytics();
    const days = 30; // Last 30 days
    const history = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate daily portfolio value with some volatility
      const baseValue = analytics.totalValue;
      const volatility = 0.05; // 5% daily volatility
      const randomChange = (Math.random() - 0.5) * volatility;
      const dailyValue = baseValue * (1 + randomChange);
      
      history.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(dailyValue, 0), // Ensure non-negative
        change: randomChange * 100
      });
    }
    
    return history;
  };

  // Load portfolio history
  const loadPortfolioHistory = () => {
    const saved = safeLocalStorage.getItem('portfolioHistory');
    if (saved) {
      setPortfolioHistory(JSON.parse(saved));
    } else {
      // Generate mock data if no history exists
      const mockHistory = generatePortfolioHistory();
      setPortfolioHistory(mockHistory);
      safeLocalStorage.setItem('portfolioHistory', JSON.stringify(mockHistory));
    }
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
  const addToPortfolio = (cryptoId, amount, price) => {
    const existing = portfolio.find(item => item.cryptoId === cryptoId);
    
    if (existing) {
      // Update existing position
      const totalAmount = existing.amount + amount;
      const totalSpent = existing.totalSpent + (amount * price);
      const avgPrice = totalSpent / totalAmount;
      
      const updated = portfolio.map(item => 
        item.cryptoId === cryptoId 
          ? { ...item, amount: totalAmount, totalSpent, avgPrice }
          : item
      );
      setPortfolio(updated);
      savePortfolio(updated);
    } else {
      // Add new position
      const newItem = {
        cryptoId,
        amount,
        avgPrice: price,
        totalSpent: amount * price,
        date: new Date().toISOString(),
      };
      const updated = [...portfolio, newItem];
      setPortfolio(updated);
      savePortfolio(updated);
    }

    // Record transaction
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
  };

  // Remove from portfolio
  const removeFromPortfolio = (cryptoId) => {
    const item = portfolio.find(item => item.cryptoId === cryptoId);
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
    
    const updated = portfolio.filter(item => item.cryptoId !== cryptoId);
    setPortfolio(updated);
    savePortfolio(updated);
  };

  // Calculate portfolio value
  const calculatePortfolioValue = () => {
    if (!marketData.length) return { totalValue: 0, totalSpent: 0, profit: 0 };

    const totalValue = portfolio.reduce((sum, item) => {
      const crypto = marketData.find(c => c.id === item.cryptoId);
      if (!crypto) return sum;
      return sum + (item.amount * parseFloat(crypto.price));
    }, 0);

    const totalSpent = portfolio.reduce((sum, item) => sum + item.totalSpent, 0);
    const profit = totalValue - totalSpent;

    return { totalValue, totalSpent, profit };
  };

  useEffect(() => {
    setMounted(true);
    loadPortfolio();
    loadAlerts();
    loadTransactions(); // Load transactions on mount
    loadPortfolioHistory(); // Load portfolio history
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check alerts when market data updates
  useEffect(() => {
    if (marketData.length > 0) {
      checkAlerts();
    }
  }, [marketData]);

  // Get real holdings from portfolio data
  const getRealHoldings = () => {
    if (!marketData.length || !portfolio.length) return [];
    
    return portfolio.map(item => {
      const crypto = marketData.find(c => c.id === item.cryptoId);
      if (!crypto) return null;
      
      const currentValue = item.amount * parseFloat(crypto.price);
      const profit = currentValue - item.totalSpent;
      const profitPercent = (profit / item.totalSpent) * 100;
      
      return {
        cryptoId: item.cryptoId,
        symbol: crypto.name.split('/')[0],
        name: crypto.name,
        amount: item.amount,
        currentValue: currentValue,
        profit: profit,
        profitPercent: profitPercent,
        icon: crypto.icon,
        avgPrice: item.avgPrice
      };
    }).filter(Boolean); // Remove null items
  };

  // Calculate total portfolio value
  const calculateTotalPortfolioValue = () => {
    const holdings = getRealHoldings();
    return holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  };

  // Get holdings data - use real data if available, otherwise fallback to mock
  const getHoldingsData = () => {
    const realHoldings = getRealHoldings();
    
    if (realHoldings.length > 0) {
      return realHoldings;
    }
    
    // Fallback to mock data if no real holdings
    return [
      { symbol: 'BTC', name: 'Bitcoin', amount: 0.35, currentValue: 11025.50, icon: '₿', profit: 0, profitPercent: 0 },
      { symbol: 'ETH', name: 'Ethereum', amount: 2.2, currentValue: 930.40, icon: 'Ξ', profit: 0, profitPercent: 0 },
      { symbol: 'USDT', name: 'Tether USDT', amount: 980, currentValue: 980.00, icon: 'T', profit: 0, profitPercent: 0 }
    ];
  };

  // Calculate portfolio totals
  const calculatePortfolioTotals = () => {
    const holdings = getRealHoldings();
    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    const totalSpent = holdings.reduce((sum, holding) => sum + (holding.amount * holding.avgPrice), 0);
    const totalProfit = totalValue - totalSpent;
    
    return {
      totalValue,
      totalSpent,
      totalProfit
    };
  };

  const portfolioTotals = calculatePortfolioTotals();
  const holdingsData = getHoldingsData();
  const totalPortfolioValue = calculateTotalPortfolioValue();

  // Mock user data (in real app, this would come from authentication)
  const userData = {
    username: "User123",
    officialId: "ID123456",
    vipLevel: "Gold",
    totalBalance: portfolioTotals.totalValue || 12480.35,
    totalWithdrawn: 4275.00,
    creditScore: 100
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-semibold">👤</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Portfolio</h1>
            {loading && (
              <div className="flex items-center gap-2 text-xs text-blue-400 mt-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="font-medium">Live</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-sm font-medium">Customer care</span>
            <button 
              onClick={() => setShowCustomerServiceModal(true)}
              className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
            >
              <span className="text-xs">🎧</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div 
        className="px-4 py-4 bg-gray-800 border-b border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setShowProfileModal(true)}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-sm text-gray-400 font-medium mb-1">Username :</div>
                <div className="text-sm font-semibold text-white">{userProfile.username}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium mb-1">Official Id :</div>
                <div className="text-sm font-semibold text-white">{userProfile.officialId}</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 font-medium mb-1">Vip Level :</div>
            <div className="text-sm font-bold text-yellow-400">{userProfile.vipLevel}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-4 bg-gray-800 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => router.push('/deposit')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">💰</span>
              <span>Deposit</span>
            </div>
          </button>
          <button 
            onClick={() => router.push('/withdraw')}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">💸</span>
              <span>Withdraw</span>
            </div>
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="px-4 py-4 bg-gray-800 border-b border-gray-700">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 font-medium">Total Available Balance</span>
            <span className="text-sm font-bold text-white">${portfolioTotals.totalValue.toLocaleString()} USD</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 font-medium">Total Invested</span>
            <span className="text-sm font-bold text-white">${portfolioTotals.totalSpent.toLocaleString()} USD</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 font-medium">Total Profit/Loss</span>
            <span className={`text-sm font-bold ${portfolioTotals.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolioTotals.totalProfit >= 0 ? '+' : ''}${portfolioTotals.totalProfit.toFixed(2)} USD
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 font-medium">Credit Score</span>
            <span className="text-sm font-bold text-blue-400">{userData.creditScore}</span>
          </div>
        </div>
      </div>

      {/* Portfolio Analytics Section */}
      <div className="px-4 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Portfolio Analytics</h2>
          <button 
            onClick={() => setShowAnalyticsModal(true)}
            className="text-sm bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            View Details
          </button>
        </div>
        
        {(() => {
          const analytics = getPortfolioAnalytics();
          return (
            <div className="space-y-4">
              {/* Performance Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="text-xs text-gray-400 font-medium mb-1">Total Return</div>
                  <div className={`text-lg font-bold ${analytics.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analytics.profitPercentage >= 0 ? '+' : ''}{analytics.profitPercentage.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="text-xs text-gray-400 font-medium mb-1">Holdings</div>
                  <div className="text-lg font-bold text-white">{analytics.holdingsCount}</div>
                </div>
              </div>
              
              {/* Best/Worst Performers */}
              {analytics.bestPerformer && analytics.worstPerformer && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="text-xs text-gray-400 font-medium mb-1">Best Performer</div>
                    <div className="text-sm font-semibold text-white">{analytics.bestPerformer.symbol}</div>
                    <div className="text-xs text-green-400 font-bold">
                      +{analytics.bestPerformer.profitPercent?.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="text-xs text-gray-400 font-medium mb-1">Worst Performer</div>
                    <div className="text-sm font-semibold text-white">{analytics.worstPerformer.symbol}</div>
                    <div className="text-xs text-red-400 font-bold">
                      {analytics.worstPerformer.profitPercent?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
              
              {/* Asset Allocation Preview */}
              {analytics.assetAllocation.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="text-xs text-gray-400 font-medium mb-3">Asset Allocation</div>
                  <div className="space-y-3">
                    {analytics.assetAllocation.slice(0, 3).map((asset, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-yellow-500' :
                            index === 3 ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="text-sm font-medium text-white">{asset.symbol}</span>
                        </div>
                        <div className="text-sm font-bold text-white">{asset.percentage.toFixed(1)}%</div>
                      </div>
                    ))}
                    {analytics.assetAllocation.length > 3 && (
                      <div className="text-xs text-gray-400 text-center pt-2">
                        +{analytics.assetAllocation.length - 3} more assets
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Holdings Section */}
      <div className="px-4 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Holdings</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Add Asset
          </button>
        </div>
        
        <div className="space-y-3">
          {holdingsData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-3">📊</div>
              <div className="text-gray-400 text-sm mb-2">No holdings yet</div>
              <div className="text-gray-500 text-xs">Add your first cryptocurrency to start tracking</div>
            </div>
          ) : (
            holdingsData.map((holding, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {holding.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{holding.name}</div>
                      <div className="text-xs text-gray-400">{holding.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white text-sm">${holding.currentValue?.toLocaleString() || '0.00'}</div>
                    <div className={`text-xs font-medium ${holding.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.profitPercent >= 0 ? '+' : ''}{holding.profitPercent?.toFixed(2) || '0.00'}%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400">
                    {holding.amount} {holding.symbol}
                  </div>
                  <button 
                    onClick={() => removeFromPortfolio(holding.cryptoId || holding.symbol)}
                    className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Price Alerts Section */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Price Alerts</h2>
          <button 
            onClick={() => setShowAlertsModal(true)}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
          >
            + Add Alert
          </button>
        </div>
        
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-gray-400 text-3xl mb-2">🔔</div>
              <div className="text-gray-400 text-sm mb-3">No price alerts set</div>
              <button 
                onClick={() => setShowAlertsModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Create Your First Alert
              </button>
            </div>
          ) : (
            alerts.map((alert) => {
              const crypto = marketData.find(c => c.id === alert.cryptoId);
              if (!crypto) return null;
              
              return (
                <div key={alert.id} className={`p-3 bg-gray-800 rounded-lg ${alert.triggered ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        crypto.symbol === 'BTC' ? 'bg-orange-500' :
                        crypto.symbol === 'ETH' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }`}>
                        {crypto.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{crypto.name}</div>
                        <div className="text-xs text-gray-400">
                          {alert.condition === 'above' ? 'Above' : 'Below'} ${parseFloat(alert.targetPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleAlert(alert.id)}
                        className={`text-xs px-2 py-1 rounded ${alert.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                      >
                        {alert.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button 
                        onClick={() => removeAlert(alert.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {alert.triggered && (
                    <div className="mt-2 text-xs text-green-400">
                      ✓ Alert triggered
                    </div>
                  )}
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
              <span className="text-green-400">✓</span>
              <span className="text-sm">KYC Verification</span>
              <span className="text-xs text-green-400">Verified</span>
            </div>
            <span className="text-gray-400">›</span>
          </div>
          
          <div 
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => setShowPasswordModal(true)}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-400">🔑</span>
              <span className="text-sm">Change Password</span>
            </div>
            <span className="text-gray-400">›</span>
          </div>
          
          <div 
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => setShowNotificationModal(true)}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-400">✉️</span>
              <span className="text-sm">System Notification</span>
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
                <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Withdrawal Method</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                  <option value="bank">Bank Account</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="crypto">Cryptocurrency Wallet</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (withdrawAmount && parseFloat(withdrawAmount) > 0) {
                      // Record withdraw transaction
                      addTransaction({
                        type: 'withdraw',
                        amount: parseFloat(withdrawAmount),
                        description: `Withdrew $${withdrawAmount} USD`,
                        totalValue: parseFloat(withdrawAmount)
                      });
                      alert(`Withdrawal of $${withdrawAmount} USD initiated successfully!`);
                      setShowWithdrawModal(false);
                      setWithdrawAmount('');
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Withdraw
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
            
            <div className="bg-green-900 bg-opacity-20 border border-green-500 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-400 font-medium">Verification Complete</span>
              </div>
              <p className="text-sm text-gray-300">Your identity has been successfully verified. You have full access to all platform features.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input 
                  type="text" 
                  value="John Doe"
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                <input 
                  type="text" 
                  value="01/01/1990"
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ID Number</label>
                <input 
                  type="text" 
                  value="ID123456789"
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Verification Date</label>
                <input 
                  type="text" 
                  value="15/01/2024"
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400"
                />
              </div>
              
              <button 
                onClick={() => setShowKycModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
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
                  onChange={(e) => setUserProfile({...userProfile, username: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Official ID</label>
                <input 
                  type="text" 
                  value={userProfile.officialId}
                  onChange={(e) => setUserProfile({...userProfile, officialId: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">VIP Level</label>
                <select 
                  value={userProfile.vipLevel}
                  onChange={(e) => setUserProfile({...userProfile, vipLevel: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Diamond">Diamond</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    alert('Profile updated successfully!');
                    setShowProfileModal(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Save Profile
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

      {/* Portfolio Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Portfolio Analytics</h3>
              <button 
                onClick={() => setShowAnalyticsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {(() => {
              const analytics = getPortfolioAnalytics();
              return (
                <div className="space-y-6">
                  {/* Timeframe Selector */}
                  <div className="flex gap-2 overflow-x-auto">
                    {['1W', '1M', '3M', '6M', '1Y'].map((timeframe) => (
                      <button
                        key={timeframe}
                        onClick={() => setAnalyticsTimeframe(timeframe)}
                        className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${
                          analyticsTimeframe === timeframe
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {timeframe}
                      </button>
                    ))}
                  </div>
                  
                  {/* Performance Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-xs text-gray-400">Total Value</div>
                      <div className="text-lg font-bold">${analytics.totalValue.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-xs text-gray-400">Total Invested</div>
                      <div className="text-lg font-bold">${analytics.totalSpent.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-xs text-gray-400">Total Profit/Loss</div>
                      <div className={`text-lg font-bold ${analytics.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {analytics.totalProfit >= 0 ? '+' : ''}${analytics.totalProfit.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-xs text-gray-400">Return %</div>
                      <div className={`text-lg font-bold ${analytics.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {analytics.profitPercentage >= 0 ? '+' : ''}{analytics.profitPercentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Portfolio Chart */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-4">Portfolio Performance ({analyticsTimeframe})</h4>
                    <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📈</div>
                        <div className="text-gray-400 text-sm">Portfolio Chart</div>
                        <div className="text-gray-500 text-xs">Interactive chart coming soon</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Asset Allocation */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-4">Asset Allocation</h4>
                    <div className="space-y-3">
                      {analytics.assetAllocation.map((asset, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${
                              index === 0 ? 'bg-blue-500' :
                              index === 1 ? 'bg-green-500' :
                              index === 2 ? 'bg-yellow-500' :
                              index === 3 ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div>
                              <div className="font-medium text-sm">{asset.name}</div>
                              <div className="text-xs text-gray-400">{asset.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">${asset.value.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">{asset.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium mb-4">Best Performer</h4>
                      {analytics.bestPerformer ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                              {analytics.bestPerformer.icon}
                            </div>
                            <div>
                              <div className="font-medium">{analytics.bestPerformer.name}</div>
                              <div className="text-sm text-gray-400">{analytics.bestPerformer.symbol}</div>
                            </div>
                          </div>
                          <div className="text-green-400 font-bold">
                            +{analytics.bestPerformer.profitPercent?.toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-400">
                            ${analytics.bestPerformer.currentValue?.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">No holdings yet</div>
                      )}
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium mb-4">Worst Performer</h4>
                      {analytics.worstPerformer ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                              {analytics.worstPerformer.icon}
                            </div>
                            <div>
                              <div className="font-medium">{analytics.worstPerformer.name}</div>
                              <div className="text-sm text-gray-400">{analytics.worstPerformer.symbol}</div>
                            </div>
                          </div>
                          <div className="text-red-400 font-bold">
                            {analytics.worstPerformer.profitPercent?.toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-400">
                            ${analytics.worstPerformer.currentValue?.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">No holdings yet</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Risk Metrics */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-4">Risk Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-400">Diversification</div>
                        <div className="text-lg font-bold">
                          {analytics.holdingsCount > 1 ? 'Good' : 'Poor'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Holdings</div>
                        <div className="text-lg font-bold">{analytics.holdingsCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Avg Return</div>
                        <div className={`text-lg font-bold ${analytics.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {analytics.profitPercentage.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Status</div>
                        <div className={`text-lg font-bold ${analytics.profitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {analytics.profitPercentage >= 0 ? 'Profitable' : 'Loss'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
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
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                <span className="text-blue-500 text-xl">📨</span>
                <span className="text-gray-800 font-medium">Telegram</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                <span className="text-green-500 text-xl">📞</span>
                <span className="text-gray-800 font-medium">WhatsApp</span>
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

                {/* Attachments Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments <span className="text-blue-500">(optional)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-400 transition-colors cursor-pointer">
                    <span className="text-gray-500 text-sm">Click to upload files or drag and drop</span>
                  </div>
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