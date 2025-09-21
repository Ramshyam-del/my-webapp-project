import { useState, useEffect } from 'react';
import { getSafeWindow, getSafeDocument } from '../utils/safeStorage';
import configSync from '../utils/configSync';

export function useConfig() {
  const [config, setConfig] = useState({
    title: 'Quantex',
    officialWebsiteName: 'Quantex',
    logo: '',
    favicon: '',
    officialWebsiteLink: '',
    email: '',
    address: '',
    mobile: '',
    workingHours: '',
    telegram: '',
    whatsapp: '',
    // Add wallet addresses with production defaults
    usdtAddress: 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
    btcAddress: '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
    ethAddress: '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
  });
  const [loading, setLoading] = useState(true);

  const loadConfig = () => {
    try {
      const window = getSafeWindow();
      if (window && window.localStorage) {
        const savedConfig = window.localStorage.getItem('webConfig');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          // Ensure wallet addresses have production defaults if empty
          const configWithDefaults = {
            ...parsedConfig,
            usdtAddress: parsedConfig.usdtAddress || 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
            btcAddress: parsedConfig.btcAddress || '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
            ethAddress: parsedConfig.ethAddress || '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
          };
          setConfig(prevConfig => ({ ...prevConfig, ...configWithDefaults }));
          
          // Save updated config back to localStorage if defaults were added
          if (!parsedConfig.usdtAddress || !parsedConfig.btcAddress || !parsedConfig.ethAddress) {
            window.localStorage.setItem('webConfig', JSON.stringify(configWithDefaults));
          }
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    
    // Start cross-device polling for configuration updates
    configSync.startPolling(5000); // Poll every 5 seconds
    
    // Add listener for cross-device config updates
    const handleCrossDeviceConfigUpdate = (newConfig) => {
      console.log('Received cross-device config update:', newConfig);
      setConfig(prevConfig => ({ ...prevConfig, ...newConfig }));
      
      // Update localStorage
      const window = getSafeWindow();
      if (window && window.localStorage) {
        window.localStorage.setItem('webConfig', JSON.stringify(newConfig));
      }
    };
    
    configSync.addListener(handleCrossDeviceConfigUpdate);

    // Listen for webConfigUpdated events
    const handleConfigUpdate = () => {
      loadConfig();
    };

    // Listen for storage events (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'webConfig') {
        loadConfig();
      }
    };

    const document = getSafeDocument();
    const window = getSafeWindow();

    if (document) {
      document.addEventListener('webConfigUpdated', handleConfigUpdate);
    }
    if (window) {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      // Cleanup event listeners
      if (document) {
        document.removeEventListener('webConfigUpdated', handleConfigUpdate);
      }
      if (window) {
        window.removeEventListener('storage', handleStorageChange);
      }
      
      // Cleanup configSync listeners
      configSync.removeListener(handleCrossDeviceConfigUpdate);
      // Note: We don't stop polling here as other components might be using it
    };
  }, []);

  return { config, loading };
}