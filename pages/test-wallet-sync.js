import React, { useState, useEffect } from 'react';
import { useConfig } from '../hooks/useConfig';

export default function TestWalletSync() {
  const { config, loading } = useConfig();
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [updates, setUpdates] = useState([]);

  // Track configuration updates
  useEffect(() => {
    if (!loading && config) {
      const timestamp = new Date().toLocaleTimeString();
      setLastUpdate(timestamp);
      
      const updateEntry = {
        timestamp,
        addresses: {
          usdt: config.usdtAddress,
          btc: config.btcAddress,
          eth: config.ethAddress
        }
      };
      
      setUpdates(prev => [updateEntry, ...prev.slice(0, 9)]); // Keep last 10 updates
    }
  }, [config, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🔄 Cross-Device Wallet Address Sync Test</h1>
          <p className="text-gray-400">This page shows real-time wallet address updates across devices</p>
        </div>

        {/* Status Indicator */}
        <div className="bg-green-800 border border-green-600 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium">Cross-Device Sync Active</span>
            <span className="text-sm text-gray-300">Last update: {lastUpdate}</span>
          </div>
        </div>

        {/* Current Wallet Addresses */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">💚</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">USDT (TRC-20)</h3>
                <p className="text-sm text-gray-400">Tether</p>
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded text-xs font-mono break-all">
              {config.usdtAddress || 'Not configured'}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">₿</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">BTC</h3>
                <p className="text-sm text-gray-400">Bitcoin</p>
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded text-xs font-mono break-all">
              {config.btcAddress || 'Not configured'}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">Ξ</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">ETH</h3>
                <p className="text-sm text-gray-400">Ethereum</p>
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded text-xs font-mono break-all">
              {config.ethAddress || 'Not configured'}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900 border border-blue-600 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold mb-3">🧪 How to Test Cross-Device Sync</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open this page on multiple devices/browsers</li>
            <li>Go to <strong>/admin/operate</strong> on any device</li>
            <li>Click the "🌐 Deploy to All Devices" button or update individual addresses</li>
            <li>Watch this page update automatically on ALL devices within 10 seconds</li>
            <li>No page refresh needed - updates happen in real-time!</li>
          </ol>
        </div>

        {/* Update History */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">📝 Update History</h3>
          {updates.length === 0 ? (
            <p className="text-gray-400 text-sm">No updates recorded yet</p>
          ) : (
            <div className="space-y-3">
              {updates.map((update, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-blue-400 mb-2">{update.timestamp}</div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div><span className="text-gray-400">USDT:</span> {update.addresses.usdt}</div>
                    <div><span className="text-gray-400">BTC:</span> {update.addresses.btc}</div>
                    <div><span className="text-gray-400">ETH:</span> {update.addresses.eth}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a 
            href="/admin/operate" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Admin Panel
          </a>
          <a 
            href="/portfolio" 
            className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors ml-4"
          >
            Test Portfolio Page
          </a>
        </div>
      </div>
    </div>
  );
}