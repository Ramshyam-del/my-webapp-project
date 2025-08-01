import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DepositPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Cryptocurrency options
  const cryptoOptions = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      network: 'Bitcoin Network',
      icon: '₿',
      color: 'bg-orange-500',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      network: 'Ethereum (ERC20)',
      icon: 'Ξ',
      color: 'bg-blue-500',
      address: '0x33a329fbdd48e3877cb71de3d3b2e7be4390ca75',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x33a329fbdd48e3877cb71de3d3b2e7be4390ca75'
    },
    {
      id: 'usdc',
      name: 'USDC',
      symbol: 'USDC',
      network: 'Centre',
      icon: '$',
      color: 'bg-blue-600',
      address: '0x33a329fbdd48e3877cb71de3d3b2e7be4390ca75',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x33a329fbdd48e3877cb71de3d3b2e7be4390ca75'
    },
    {
      id: 'usdt',
      name: 'USDT',
      symbol: 'USDT',
      network: 'Trinity Tech 20',
      icon: 'T',
      color: 'bg-green-500',
      address: '0x33a329fbdd48e3877cb71de3d3b2e7be4390ca75',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x33a329fbdd48e3877cb71de3d3b2e7be4390ca75'
    },
    {
      id: 'pyusd',
      name: 'PYUSD',
      symbol: 'PYUSD',
      network: 'PayPal USD',
      icon: 'P',
      color: 'bg-blue-700',
      address: '0x33a329fbdd48e3877cb71de3d3b2e7be4390ca75',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x33a329fbdd48e3877cb71de3d3b2e7be4390ca75'
    }
  ];

  // Copy address to clipboard
  const copyAddress = async (address) => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
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
    setSelectedCrypto(crypto);
    setShowQRModal(true);
  };

  useEffect(() => {
    setMounted(true);
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
        <h1 className="text-xl font-bold">Quantex</h1>
        <button 
          onClick={() => router.push('/portfolio')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          →
        </button>
      </div>

      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Deposit</h2>

        {/* Cryptocurrency Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoOptions.map((crypto) => (
            <div
              key={crypto.id}
              onClick={() => handleCryptoSelect(crypto)}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all duration-200 hover:shadow-lg hover:bg-gray-750"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${crypto.color} rounded-full flex items-center justify-center text-white text-xl font-bold`}>
                  {crypto.icon}
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