import { useState, useEffect } from 'react';
import { getSafeWindow, getSafeDocument } from '../utils/safeStorage';

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
    whatsapp: ''
  });
  const [loading, setLoading] = useState(true);

  const loadConfig = () => {
    try {
      const window = getSafeWindow();
      if (window && window.localStorage) {
        const savedConfig = window.localStorage.getItem('webConfig');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig(prevConfig => ({ ...prevConfig, ...parsedConfig }));
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
      if (document) {
        document.removeEventListener('webConfigUpdated', handleConfigUpdate);
      }
      if (window) {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  return { config, loading };
}