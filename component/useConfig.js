import { useState, useEffect } from 'react';

export function useConfig() {
  const [config, setConfig] = useState({
    deposit_addresses: {
      usdt: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      eth: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    },
    system_settings: {
      maintenance_mode: false,
      trading_enabled: true,
      deposit_enabled: true,
      withdrawal_enabled: true
    }
  });

  const [loading, setLoading] = useState(true);

  // Load configuration from database
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time update handler
  const handleConfigUpdate = (event) => {
    console.log('Config update received:', event.detail);
    if (event.detail && event.detail.config) {
      const newConfig = event.detail.config;
      setConfig(prev => ({
        ...prev,
        deposit_addresses: {
          usdt: newConfig.usdtAddress || prev.deposit_addresses.usdt,
          btc: newConfig.btcAddress || prev.deposit_addresses.btc,
          eth: newConfig.ethAddress || prev.deposit_addresses.eth
        }
      }));
    }
  };

  useEffect(() => {
    loadConfig();
    
    // Add real-time event listeners
    window.addEventListener('webConfigUpdated', handleConfigUpdate);
    window.addEventListener('storage', (event) => {
      if (event.key === 'webConfig') {
        try {
          const config = JSON.parse(event.newValue);
          handleConfigUpdate({ detail: { config } });
        } catch (error) {
          console.error('Error parsing config update:', error);
        }
      }
    });

    // Cleanup event listeners
    return () => {
      window.removeEventListener('webConfigUpdated', handleConfigUpdate);
    };
  }, []);

  return { config, loading, reloadConfig: loadConfig };
} 