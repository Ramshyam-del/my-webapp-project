import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { safeLocalStorage, safeWindow, getSafeDocument } from '../../utils/safeStorage';
import configSync from '../../utils/configSync';

export default function AdminOperate() {
  const [activeTab, setActiveTab] = useState('home');
  const [showFrontendPreview, setShowFrontendPreview] = useState(false);
  const [config, setConfig] = useState({
    // Basic settings
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
    // Content configuration
    slogan: '',
    subbanner: '',
    whitePaperLink: '',
    // Banner configuration
    exchangeBanner: '/uploads/default-banner.jpg',
    // Wallet addresses
    usdtAddress: '',
    btcAddress: '',
    ethAddress: ''
  });



  useEffect(() => {
    // Load configuration from localStorage or API
    const savedConfig = safeLocalStorage.getItem('webConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Auto-close frontend preview after 10 seconds
  useEffect(() => {
    if (showFrontendPreview) {
      const timer = setTimeout(() => {
        setShowFrontendPreview(false);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [showFrontendPreview]);

  // Helper function to update config with immediate UI feedback and database persistence
  const updateConfigField = async (field, value, isNestedField = false) => {
    try {
      let updatedConfig;
      if (isNestedField) {
        updatedConfig = {
          ...config,
          [field.parent]: {
            ...config[field.parent],
            [field.key]: value
          }
        };
      } else {
        updatedConfig = { ...config, [field]: value };
      }
      
      // Update local state
      setConfig(updatedConfig);
      
      // Immediately save to localStorage and trigger UI update
      safeLocalStorage.setItem('webConfig', JSON.stringify(updatedConfig));
      const document = getSafeDocument();
      if (document) {
        document.dispatchEvent(new StorageEvent('storage', {
          key: 'webConfig',
          newValue: JSON.stringify(updatedConfig)
        }));
        document.dispatchEvent(new CustomEvent('webConfigUpdated', {
          detail: { config: updatedConfig }
        }));
      }
      
      // Save to database using the correct admin config API
      // Create a partial update object with only the changed field
      const fieldMapping = {
        telegram: 'telegram',
        whatsapp: 'whatsapp',
        emailAddress: 'email_address',
        email: 'email',
        address: 'address',
        mobile: 'mobile',
        title: 'title',
        logo: 'logo',
        favicon: 'favicon',
        slogan: 'slogan',
        subbanner: 'subbanner',
        whitePaperLink: 'white_paper_link',
        exchangeBanner: 'exchange_banner',
        usdtAddress: 'usdt_address',
        btcAddress: 'btc_address',
        ethAddress: 'eth_address'
      };
      
      const dbField = fieldMapping[field] || field;
      const partialUpdate = {
        [dbField]: value
      };
      
      const adminConfigResponse = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_settings: partialUpdate
        })
      });
      
      if (!adminConfigResponse.ok) {
        const errorText = await adminConfigResponse.text();
        console.error('Admin config API error:', adminConfigResponse.status, errorText);
        throw new Error(`Failed to save configuration: ${adminConfigResponse.status} - ${errorText}`);
      }
      
      const responseData = await adminConfigResponse.json();
      console.log('Admin config saved successfully:', responseData);
      
      // Also save to main config API for deposit addresses
      if (['usdtAddress', 'btcAddress', 'ethAddress'].includes(field)) {
        await saveConfigToDatabase(updatedConfig);
      }
      
    } catch (error) {
      console.error('Error updating config field:', error);
      console.error('Error details:', {
        field,
        value,
        partialUpdate,
        message: error.message,
        stack: error.stack
      });
      alert(`Error saving configuration: ${error.message}. Please check the console for details.`);
    }
  };

  const saveConfigToDatabase = async (configToSave = config) => {
    try {
      // Save to database
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${safeLocalStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          deposit_addresses: {
            usdt: configToSave.usdtAddress,
            btc: configToSave.btcAddress,
            eth: configToSave.ethAddress
          },
          system_settings: {
            title: configToSave.title,
            official_website_name: configToSave.officialWebsiteName,
            official_website_link: configToSave.officialWebsiteLink,
            email: configToSave.email,
            address: configToSave.address,
            mobile: configToSave.mobile,
            working_hours: configToSave.workingHours,
            menu_management: configToSave.menuManagement,
            logo: configToSave.logo,
            favicon: configToSave.favicon,
            telegram: configToSave.telegram,
            whatsapp: configToSave.whatsapp,
            whatsapp_address: configToSave.whatsappAddress,
            email_address: configToSave.emailAddress,
            slogan: configToSave.slogan,
            subbanner: configToSave.subbanner,
            white_paper_link: configToSave.whitePaperLink,
            exchange_banner: configToSave.exchangeBanner
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save to database');
      }
      
      return true;
    } catch (error) {
      console.error('Database save error:', error);
      return false;
    }
  };

  const saveConfig = async () => {
    try {
      const success = await saveConfigToDatabase();
      
      // Also save to admin config API for customer service
      const adminConfigResponse = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_settings: {
            telegram: config.telegram,
            whatsapp: config.whatsapp,
            email: config.email,
            address: config.address,
            mobile: config.mobile,
            title: config.title,
            logo: config.logo,
            favicon: config.favicon
          }
        })
      });
      
      if (adminConfigResponse.ok) {
        // Also save to localStorage as backup
        safeLocalStorage.setItem('webConfig', JSON.stringify(config));
        
        // Force refresh config sync to notify all devices
        await configSync.forceRefresh();
        
        // Trigger events for frontend updates (backward compatibility)
        const document = getSafeDocument();
        if (document) {
          document.dispatchEvent(new StorageEvent('storage', {
            key: 'webConfig',
            newValue: JSON.stringify(config)
          }));
          document.dispatchEvent(new CustomEvent('webConfigUpdated', {
            detail: { config }
          }));
        }
        alert('Configuration saved successfully! Settings have been updated across all devices.');
      } else {
        alert('Failed to save configuration to database. Please try again.');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration. Please try again.');
    }
  };

  const resetConfig = () => {
    setConfig({
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
      // Content configuration
      slogan: '',
      subbanner: '',
      whitePaperLink: '',
      // Banner configuration
      exchangeBanner: '/uploads/default-banner.jpg',
      // Wallet addresses
      usdtAddress: '',
      btcAddress: '',
      ethAddress: ''
    });
  };

  const handleWorkingHoursChange = (key) => {
    updateConfigField({ parent: 'workingHours', key }, !config.workingHours[key], true);
  };

  const handleMenuManagementChange = (key) => {
    updateConfigField({ parent: 'menuManagement', key }, !config.menuManagement[key], true);
  };



  const renderHomeTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => updateConfigField('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter website title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Official website name</label>
            <input
              type="text"
              value={config.officialWebsiteName}
              onChange={(e) => updateConfigField('officialWebsiteName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter official website name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Official website link</label>
            <input
              type="url"
              value={config.officialWebsiteLink}
              onChange={(e) => updateConfigField('officialWebsiteLink', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={config.email}
              onChange={(e) => updateConfigField('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={config.address}
              onChange={(e) => updateConfigField('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Enter company address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
            <div className="flex gap-2">
              <input
                type="time"
                value={config.mobile}
                onChange={(e) => updateConfigField('mobile', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                value={config.mobile}
                onChange={(e) => updateConfigField('mobile', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working hours</label>
            <div className="space-y-2">
              {Object.entries(config.workingHours || {}).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleWorkingHoursChange(key)}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Menu management</label>
            <div className="space-y-2">
              {Object.entries(config.menuManagement || {}).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleMenuManagementChange(key)}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <div className="space-y-2">
              <input
                type="text"
                value={config.logo}
                onChange={(e) => updateConfigField('logo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Logo file path"
              />
              <div className="flex items-center space-x-2 mt-2">
                {config.logo && (
                  <img 
                    src={config.logo} 
                    alt="Current Logo" 
                    className="w-16 h-16 object-contain bg-gray-100 rounded border"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                )}
                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center" style={{display: config.logo ? 'none' : 'flex'}}>
                  <span className="text-white font-bold text-xs">LOGO</span>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // In a real implementation, you would upload this file to your server
                        // For this example, we'll simulate by creating a fake URL
                        const fakeUrl = `/uploads/logo-${Date.now()}.${file.name.split('.').pop()}`;
                        const updatedConfig = { ...config, logo: fakeUrl };
                        setConfig(updatedConfig);
                        // Immediately save and trigger update
                        safeLocalStorage.setItem('webConfig', JSON.stringify(updatedConfig));
                        const document = getSafeDocument();
                        if (document) {
                          document.dispatchEvent(new CustomEvent('webConfigUpdated', {
                            detail: { config: updatedConfig }
                          }));
                        }
                        alert('Logo updated! In a real implementation, this would upload the file to your server.');
                      }
                    };
                    fileInput.click();
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  Upload Logo
                </button>
                <button
                  onClick={() => {
                    const updatedConfig = { ...config, logo: '' };
                    setConfig(updatedConfig);
                    // Immediately save and trigger update
                    safeLocalStorage.setItem('webConfig', JSON.stringify(updatedConfig));
                    const document = getSafeDocument();
                    if (document) {
                      document.dispatchEvent(new CustomEvent('webConfigUpdated', {
                        detail: { config: updatedConfig }
                      }));
                    }
                  }}
                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                >
                  Remove Logo
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
            <div className="space-y-2">
              <input
                type="text"
                value={config.favicon}
                onChange={(e) => updateConfigField('favicon', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Favicon file path"
              />
              <div className="w-32 h-32 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PX SYSTEMS</span>
              </div>
              <div className="w-full bg-red-500 h-2 rounded">
                <div className="bg-red-600 h-full w-0 rounded"></div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
            <input
              type="text"
              value={config.telegram}
              onChange={(e) => updateConfigField('telegram', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Telegram username or link"
            />
          </div>

                     <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
             <input
               type="text"
               value={config.whatsapp}
               onChange={(e) => updateConfigField('whatsapp', e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="WhatsApp number or link"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
             <input
               type="email"
               value={config.emailAddress}
               onChange={(e) => updateConfigField('emailAddress', e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Email address"
             />
           </div>
         </div>
       </div>
    </div>
  );

  const renderBasicTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={config.slogan || ''}
              onChange={(e) => updateConfigField('slogan', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter slogan"
            />
          </div>
          
          {/* Exchange Banner Management */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Exchange Page Banner</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image URL</label>
                <input
                  type="text"
                  value={config.exchangeBanner || ''}
                  onChange={(e) => updateConfigField('exchangeBanner', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter banner image URL"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Banner Preview</h4>
                <div className="relative h-28 overflow-hidden rounded-lg">
                  {config.exchangeBanner ? (
                    <div 
                      className="h-full w-full bg-cover bg-center" 
                      style={{ backgroundImage: `url(${config.exchangeBanner})` }}
                    ></div>
                  ) : (
                    <div className="h-full w-full bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 flex items-center justify-center">
                      <span className="text-white text-sm">No banner image set</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // In a real implementation, you would upload this file to your server
                          // For this example, we'll simulate by creating a fake URL
                          const fakeUrl = `/uploads/banner-${Date.now()}.jpg`;
                          updateConfigField('exchangeBanner', fakeUrl);
                          alert('Banner updated! In a real implementation, this would upload the file to your server.');
                        }
                      };
                      fileInput.click();
                    }}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Upload New Banner
                  </button>
                  <button
                    onClick={() => {
                      updateConfigField('exchangeBanner', '');
                    }}
                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                  >
                    Reset Banner
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
            <textarea
              value={config.slogan || ''}
              onChange={(e) => updateConfigField('slogan', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter slogan content"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value="subbanner"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              disabled
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
            <textarea
              value={config.subbanner || ''}
              onChange={(e) => updateConfigField('subbanner', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter subbanner content"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value="White paper link"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              disabled
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
            <input
              type="url"
              value={config.whitePaperLink || ''}
              onChange={(e) => updateConfigField('whitePaperLink', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter white paper link"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderWalletTab = () => (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Deposit Method Wallet Addresses</h3>
        <p className="text-sm text-gray-600">Configure wallet addresses for different deposit methods available in the portfolio.</p>
      </div>
      
      <div className="space-y-6">
        {/* USDT Wallet Address */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">💚</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">USDT (Tether)</h4>
              <p className="text-sm text-gray-600">TRC-20 Token</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                         <input
               type="text"
               value={config.usdtAddress}
               onChange={(e) => updateConfigField('usdtAddress', e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Enter USDT wallet address"
             />
                         <div className="mt-2 flex gap-2">
               <button
                 onClick={() => {
                   const newAddress = '0x' + Math.random().toString(16).substr(2, 40);
                   updateConfigField('usdtAddress', newAddress);
                   alert('USDT address updated and saved successfully!');
                 }}
                 className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
               >
                 Generate New Address
               </button>
               <button
                 onClick={() => {
                   navigator.clipboard.writeText(config.usdtAddress);
                   alert('USDT address copied to clipboard!');
                 }}
                 className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
               >
                 Copy Address
               </button>
             </div>
          </div>
        </div>

        {/* BTC Wallet Address */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">₿</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">BTC (Bitcoin)</h4>
              <p className="text-sm text-gray-600">Bitcoin Network</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                         <input
               type="text"
               value={config.btcAddress}
               onChange={(e) => updateConfigField('btcAddress', e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Enter BTC wallet address"
             />
                         <div className="mt-2 flex gap-2">
               <button
                 onClick={() => {
                   const newAddress = 'bc1' + Math.random().toString(16).substr(2, 30);
                   updateConfigField('btcAddress', newAddress);
                   alert('BTC address updated and saved successfully!');
                 }}
                 className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
               >
                 Generate New Address
               </button>
               <button
                 onClick={() => {
                   navigator.clipboard.writeText(config.btcAddress);
                   alert('BTC address copied to clipboard!');
                 }}
                 className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
               >
                 Copy Address
               </button>
             </div>
          </div>
        </div>

        {/* ETH Wallet Address */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">Ξ</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">ETH (Ethereum)</h4>
              <p className="text-sm text-gray-600">Ethereum Network</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                         <input
               type="text"
               value={config.ethAddress}
               onChange={(e) => updateConfigField('ethAddress', e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Enter ETH wallet address"
             />
                         <div className="mt-2 flex gap-2">
               <button
                 onClick={() => {
                   const newAddress = '0x' + Math.random().toString(16).substr(2, 40);
                   updateConfigField('ethAddress', newAddress);
                   alert('ETH address updated and saved successfully!');
                 }}
                 className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
               >
                 Generate New Address
               </button>
               <button
                 onClick={() => {
                   navigator.clipboard.writeText(config.ethAddress);
                   alert('ETH address copied to clipboard!');
                 }}
                 className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
               >
                 Copy Address
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Frontend Preview Section */}
      {showFrontendPreview && (
        <div className="bg-green-50 p-4 rounded-lg relative">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-green-900">Frontend Preview</h4>
            <button
              onClick={() => setShowFrontendPreview(false)}
              className="text-green-600 hover:text-green-800 text-lg font-bold"
              title="Close preview"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-green-700 mb-3">This is how your wallet addresses will appear in the portfolio deposit modal:</p>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-1">USDT Address</div>
              <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                {config.usdtAddress || 'Not configured'}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-1">BTC Address</div>
              <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                {config.btcAddress || 'Not configured'}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-1">ETH Address</div>
              <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                {config.ethAddress || 'Not configured'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Frontend Preview Button */}
      {!showFrontendPreview && (
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-green-900 mb-1">Frontend Preview</h4>
              <p className="text-sm text-green-700">Preview how wallet addresses will appear in the portfolio deposit modal</p>
            </div>
            <button
              onClick={() => setShowFrontendPreview(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Show Preview
            </button>
          </div>
        </div>
      )}

      {/* Test Configuration Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">Test Configuration</h4>
        <p className="text-sm text-blue-700 mb-3">Test that your wallet addresses are working correctly in the frontend.</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Trigger a storage event to test real-time updates
              const testConfig = {
                ...config,
                usdtAddress: '0xTEST' + Math.random().toString(16).substr(2, 10),
                btcAddress: 'bc1TEST' + Math.random().toString(16).substr(2, 10),
                ethAddress: '0xTEST' + Math.random().toString(16).substr(2, 10)
              };
              // Update each field individually to ensure database persistence
              updateConfigField('usdtAddress', testConfig.usdtAddress);
              updateConfigField('btcAddress', testConfig.btcAddress);
              updateConfigField('ethAddress', testConfig.ethAddress);
              alert('Test addresses applied! Check the portfolio deposit modal.');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Apply Test Addresses
          </button>
          <button
            onClick={() => {
              const defaultConfig = {
                ...config,
                usdtAddress: '0x1234abcd5678efgh9012ijkl3456mnop7890qrst',
                btcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                ethAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
              };
              // Update each field individually to ensure database persistence
              updateConfigField('usdtAddress', defaultConfig.usdtAddress);
              updateConfigField('btcAddress', defaultConfig.btcAddress);
              updateConfigField('ethAddress', defaultConfig.ethAddress);
              alert('Default addresses restored!');
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Restore Default Addresses
          </button>
        </div>
      </div>
    </div>
  );

  const renderDownloadTab = () => (
    <div className="text-center py-8">
      <div className="text-gray-400 text-6xl mb-4">📥</div>
      <p className="text-gray-600">Download settings coming soon!</p>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Web Configuration</h1>
        <p className="text-gray-600 mt-1">Manage website settings and configuration</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
                         {[
               { id: 'basic', name: 'Basic' },
               { id: 'home', name: 'Home' },
               { id: 'wallet', name: 'Wallet Address' },
               { id: 'download', name: 'Download' }
             ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

                 {/* Tab Content */}
         <div className="p-6">
           {activeTab === 'basic' && renderBasicTab()}
           {activeTab === 'home' && renderHomeTab()}
           {activeTab === 'wallet' && renderWalletTab()}
           {activeTab === 'download' && renderDownloadTab()}
         </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={resetConfig}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={saveConfig}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
}