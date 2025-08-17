import { useState, useEffect } from 'react';
import { safeWindow, safeLocalStorage, getSafeDocument } from '../utils/safeStorage';

export function useConfig() {
  const [config, setConfig] = useState({
    usdtAddress: '',
    btcAddress: '',
    ethAddress: '',
    title: '',
    officialWebsiteName: '',
    officialWebsiteLink: '',
    email: '',
    address: '',
    mobile: '',
    workingHours: {
      home: true,
      about: true,
      tokenSale: true,
      roadi: true
    },
    menuManagement: {
      english: true
    },
    logo: '/uploads/2025059851ad8dd1115bc6055cc45d56.jpg',
    favicon: '/uploads/2025059851ad8dd1115bc6055cc45d56.jpg',
    telegram: '',
    whatsapp: '',
    whatsappAddress: '',
    emailAddress: '',
    slogan: '',
    subbanner: '',
    whitePaperLink: ''
  });
  const [loading, setLoading] = useState(true);

  const loadConfig = async () => {
    try {
      setLoading(true);
      
      // Try to load from localStorage first
      const savedConfig = safeLocalStorage.getItem('webConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        setLoading(false);
        return;
      }

      // Fallback to API
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        const formattedConfig = {
          usdtAddress: data.deposit_addresses?.usdt || '',
          btcAddress: data.deposit_addresses?.btc || '',
          ethAddress: data.deposit_addresses?.eth || '',
          title: data.system_settings?.title || '',
          officialWebsiteName: data.system_settings?.official_website_name || '',
          officialWebsiteLink: data.system_settings?.official_website_link || '',
          email: data.system_settings?.email || '',
          address: data.system_settings?.address || '',
          mobile: data.system_settings?.mobile || '',
          workingHours: data.system_settings?.working_hours || {
            home: true,
            about: true,
            tokenSale: true,
            roadi: true
          },
          menuManagement: data.system_settings?.menu_management || {
            english: true
          },
          logo: data.system_settings?.logo || '/uploads/2025059851ad8dd1115bc6055cc45d56.jpg',
          favicon: data.system_settings?.favicon || '/uploads/2025059851ad8dd1115bc6055cc45d56.jpg',
          telegram: data.system_settings?.telegram || '',
          whatsapp: data.system_settings?.whatsapp || '',
          whatsappAddress: data.system_settings?.whatsapp_address || '',
          emailAddress: data.system_settings?.email_address || '',
          slogan: data.system_settings?.slogan || '',
          subbanner: data.system_settings?.subbanner || '',
          whitePaperLink: data.system_settings?.white_paper_link || ''
        };
        setConfig(formattedConfig);
        
        // Save to localStorage for future use
        safeLocalStorage.setItem('webConfig', JSON.stringify(formattedConfig));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial config
    loadConfig();

    // Listen for config updates from other tabs/windows
    const handleConfigUpdate = (event) => {
      if (event.detail?.config) {
        setConfig(event.detail.config);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === 'webConfig' && event.newValue) {
        try {
          const newConfig = JSON.parse(event.newValue);
          setConfig(newConfig);
        } catch (error) {
          console.error('Error parsing config from storage:', error);
        }
      }
    };

    const document = getSafeDocument();
    if (document) {
      document.addEventListener('webConfigUpdated', handleConfigUpdate);
      document.addEventListener('storage', handleStorageChange);
    }

    return () => {
      const document = getSafeDocument();
      if (document) {
        document.removeEventListener('webConfigUpdated', handleConfigUpdate);
        document.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  return { config, loading, reloadConfig: loadConfig };
} 