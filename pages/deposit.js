import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { safeWindow, getSafeDocument } from '../utils/safeStorage';
import { useConfig } from '../hooks/useConfig';
import DepositMonitor from '../components/DepositMonitor';
import { getCryptoImageUrl } from '../utils/cryptoIcons';
import configSync from '../utils/configSync';

export default function Deposit() {
  const router = useRouter();
  const { config } = useConfig();
  const [mounted, setMounted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [activeDeposits, setActiveDeposits] = useState([]);
  const [showDepositHistory, setShowDepositHistory] = useState(false);
  const [cryptoOptions, setCryptoOptions] = useState([
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      network: 'Bitcoin Network',
      icon: '₿',
      color: 'bg-orange-500',
      address: 'Loading...',  // Will be loaded from database
      qrCode: ''
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      network: 'Ethereum (ERC20)',
      icon: 'Ξ',
      color: 'bg-blue-500',
      address: 'Loading...',  // Will be loaded from database
      qrCode: ''
    },
    {
      id: 'usdt',
      name: 'USDT',
      symbol: 'USDT',
      network: 'TRON (TRC 20)',
      icon: 'T',
      color: 'bg-green-500',
      address: 'Loading...',  // Will be loaded from database
      qrCode: ''
    }
  ]);

  // Load configuration from database (not localStorage)
  const loadConfig = async () => {
    try {
      console.log('🔄 Loading wallet addresses from database API...');
      // Load from admin config API (database)
      const response = await fetch('/api/admin/config');
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📡 API response:', result);
      
      if (result.success && result.data?.walletAddresses) {
        const walletAddresses = result.data.walletAddresses;
        console.log('✅ Wallet addresses from database:', walletAddresses);
        
        const updatedOptions = cryptoOptions.map(crypto => {
          let address = crypto.address;
          
          // Map wallet addresses to crypto IDs
          if (crypto.id === 'bitcoin') {
            address = walletAddresses.btcAddress || crypto.address;
          } else if (crypto.id === 'ethereum') {
            address = walletAddresses.ethAddress || crypto.address;
          } else if (crypto.id === 'usdt') {
            address = walletAddresses.usdtAddress || crypto.address;
          }
          
          console.log(`${crypto.symbol} address set to:`, address);
          
          return {
            ...crypto,
            address: address,
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
          };
        });
        
        setCryptoOptions(updatedOptions);
        console.log('✨ Updated crypto options:', updatedOptions);
      } else {
        console.warn('⚠️ No wallet addresses in API response, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading wallet addresses from database:', error);
      // Keep default addresses on error
    }
  };

  // Real-time update handler
  const handleConfigUpdate = (event) => {
    console.log('Config update received:', event.detail);
    if (event.detail && event.detail.config) {
      const config = event.detail.config;
      const updatedOptions = cryptoOptions.map(crypto => {
        let address = crypto.address;
        
        // Map admin panel field names to crypto IDs
        if (crypto.id === 'bitcoin' && config.btcAddress) {
          address = config.btcAddress;
        } else if (crypto.id === 'ethereum' && config.ethAddress) {
          address = config.ethAddress;
        } else if (crypto.id === 'usdt' && config.usdtAddress) {
          address = config.usdtAddress;
        }
        
        return {
          ...crypto,
          address: address,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
        };
      });
      setCryptoOptions(updatedOptions);
    }
  };

  // Copy address to clipboard
  const copyAddress = async (address) => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // Fallback for older browsers
        if (typeof window !== 'undefined') {
          const textArea = document.createElement('textarea');
          textArea.value = address;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy address');
    }
  };

  // Handle crypto selection
  const handleCryptoSelect = (crypto) => {
    setSelectedCrypto({
      ...crypto,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${crypto.address}`
    });
    setShowQRModal(true);
  };

  // Load deposit history
  const loadDepositHistory = async () => {
    try {
      const response = await fetch('/api/deposits/history?limit=10', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        // Filter for active deposits (not completed, failed, or expired)
        const activeStatuses = ['pending', 'monitoring', 'detected', 'confirming', 'partial'];
        const active = result.data?.deposits?.filter(d => activeStatuses.includes(d.status)) || [];
        setActiveDeposits(active);
      }
    } catch (error) {
      console.error('Error loading deposit history:', error);
    }
  };

  // Handle deposit status update
  const handleDepositStatusUpdate = (updatedDeposit) => {
    if (updatedDeposit.status === 'completed') {
      // Refresh the page or update balance
      toast.success('Deposit completed! Your balance has been updated.');
      loadDepositHistory();
    }
  };

  useEffect(() => {
    setMounted(true);
    // Load initial config
    loadConfig();
    // Load active deposits
    loadDepositHistory();

    // Start config sync polling for real-time updates
    configSync.startPolling(5000); // Poll every 5 seconds

    // Add listener for config updates
    const handleConfigSync = (newConfig) => {
      const updatedOptions = cryptoOptions.map(crypto => {
        let address = crypto.address;
        
        // Map admin panel field names to crypto IDs
        if (crypto.id === 'bitcoin' && newConfig.btcAddress) {
          address = newConfig.btcAddress;
        } else if (crypto.id === 'ethereum' && newConfig.ethAddress) {
          address = newConfig.ethAddress;
        } else if (crypto.id === 'usdt' && newConfig.usdtAddress) {
          address = newConfig.usdtAddress;
        }
        
        return {
          ...crypto,
          address: address,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
        };
      });
      setCryptoOptions(updatedOptions);
    };

    configSync.addListener(handleConfigSync);

    // Listen for config updates from other tabs/windows (backward compatibility)
    const handleConfigUpdate = (event) => {
      if (event.detail?.config) {
        const config = event.detail.config;
        const updatedOptions = cryptoOptions.map(crypto => {
          let address = crypto.address;
          
          // Map admin panel field names to crypto IDs
          if (crypto.id === 'bitcoin' && config.btcAddress) {
            address = config.btcAddress;
          } else if (crypto.id === 'ethereum' && config.ethAddress) {
            address = config.ethAddress;
          } else if (crypto.id === 'usdt' && config.usdtAddress) {
            address = config.usdtAddress;
          }
          
          return {
            ...crypto,
            address: address,
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
          };
        });
        setCryptoOptions(updatedOptions);
      }
    };
    
    // Handle force address updates from admin panel
    const handleForceUpdate = (event) => {
      console.log('Deposit: Force address update received:', event.detail);
      if (event.detail?.addresses) {
        const updatedOptions = cryptoOptions.map(crypto => {
          let address = crypto.address;
          
          // Map admin panel field names to crypto IDs
          if (crypto.id === 'bitcoin' && event.detail.addresses.btcAddress) {
            address = event.detail.addresses.btcAddress;
          } else if (crypto.id === 'ethereum' && event.detail.addresses.ethAddress) {
            address = event.detail.addresses.ethAddress;
          } else if (crypto.id === 'usdt' && event.detail.addresses.usdtAddress) {
            address = event.detail.addresses.usdtAddress;
          }
          
          return {
            ...crypto,
            address: address,
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
          };
        });
        setCryptoOptions(updatedOptions);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === 'webConfig' && event.newValue) {
        try {
          const newConfig = JSON.parse(event.newValue);
          const updatedOptions = cryptoOptions.map(crypto => {
            let address = crypto.address;
            
            // Map admin panel field names to crypto IDs
            if (crypto.id === 'bitcoin' && newConfig.btcAddress) {
              address = newConfig.btcAddress;
            } else if (crypto.id === 'ethereum' && newConfig.ethAddress) {
              address = newConfig.ethAddress;
            } else if (crypto.id === 'usdt' && newConfig.usdtAddress) {
              address = newConfig.usdtAddress;
            }
            
            return {
              ...crypto,
              address: address,
              qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
            };
          });
          setCryptoOptions(updatedOptions);
        } catch (error) {
          console.error('Error parsing config from storage:', error);
        }
      }
    };

    // Refresh addresses when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadConfig();
        configSync.forceRefresh(); // Force check for updates
      }
    };

    const document = getSafeDocument();
    if (document) {
      document.addEventListener('webConfigUpdated', handleConfigUpdate);
      document.addEventListener('storage', handleStorageChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('forceAddressUpdate', handleForceUpdate);
    }

    return () => {
      // Stop polling and remove listeners
      configSync.stopPolling();
      configSync.removeListener(handleConfigSync);
      
      const document = getSafeDocument();
      if (document) {
        document.removeEventListener('webConfigUpdated', handleConfigUpdate);
        document.removeEventListener('storage', handleStorageChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('forceAddressUpdate', handleForceUpdate);
      }
    };
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
        <h1 className="text-xl font-bold">{config?.title || config?.officialWebsiteName || 'Quantex'}</h1>
        <button 
          onClick={() => router.push('/portfolio')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          →
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Deposit</h2>
          {activeDeposits.length > 0 && (
            <button
              onClick={() => setShowDepositHistory(!showDepositHistory)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {showDepositHistory ? 'Hide' : 'Show'} Active Deposits ({activeDeposits.length})
            </button>
          )}
        </div>

        {/* Active Deposits */}
        {showDepositHistory && activeDeposits.length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">Active Deposits</h3>
            {activeDeposits.map((deposit) => (
              <DepositMonitor
                key={deposit.id}
                depositId={deposit.id}
                onStatusUpdate={handleDepositStatusUpdate}
                autoRefresh={true}
              />
            ))}
          </div>
        )}

        {/* Cryptocurrency Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoOptions.map((crypto) => (
            <div
              key={crypto.id}
              onClick={() => handleCryptoSelect(crypto)}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 transition-all duration-200 hover:border-gray-600 cursor-pointer hover:shadow-lg hover:bg-gray-750"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={getCryptoImageUrl(crypto.symbol)} 
                    alt={crypto.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className={`w-12 h-12 ${crypto.color} rounded-full hidden items-center justify-center text-white text-xl font-bold`}>
                    {crypto.symbol?.charAt(0) || crypto.name?.charAt(0) || '?'}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{crypto.name}</h3>
                  <p className="text-sm text-gray-400">{crypto.network}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* QR Code Modal */}
      {showQRModal && selectedCrypto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ←
              </button>
              <h3 className="text-lg font-bold">Deposit {selectedCrypto.symbol}</h3>
              <div className="w-6"></div>
            </div>

            {/* QR Code */}
            <div className="text-center mb-6">
              <div className="bg-white rounded-lg p-4 inline-block">
                <img 
                  src={selectedCrypto.qrCode} 
                  alt={`QR Code for ${selectedCrypto.name}`}
                  className="w-48 h-48"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="hidden w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  QR Code Unavailable
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Network</span>
                <span className="text-sm font-medium">{selectedCrypto.network}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Deposit Address &gt;</span>
                <button 
                  onClick={() => copyAddress(selectedCrypto.address)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="Copy address"
                >
                  📋
                </button>
              </div>
              
              <div className="mt-2 p-2 bg-gray-600 rounded text-xs break-all">
                {selectedCrypto.address}
              </div>
            </div>

            {/* Copy Success Message */}
            {copySuccess && (
              <div className="mb-4 p-2 bg-green-600 text-white text-center rounded">
                Address copied to clipboard!
              </div>
            )}

            {/* Save and Share Button */}
            <button
              onClick={() => {
                copyAddress(selectedCrypto.address);
                setTimeout(() => setShowQRModal(false), 1000);
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Save and Share Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}