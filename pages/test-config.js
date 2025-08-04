import { useConfig } from '../component/useConfig';

export default function TestConfig() {
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Configuration Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Current Deposit Addresses</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">USDT Address</label>
                <div className="bg-gray-700 p-3 rounded text-sm font-mono break-all">
                  {config.deposit_addresses?.usdt || 'Not set'}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">BTC Address</label>
                <div className="bg-gray-700 p-3 rounded text-sm font-mono break-all">
                  {config.deposit_addresses?.btc || 'Not set'}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ETH Address</label>
                <div className="bg-gray-700 p-3 rounded text-sm font-mono break-all">
                  {config.deposit_addresses?.eth || 'Not set'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Trading Enabled</span>
                <span className={config.system_settings?.trading_enabled ? 'text-green-400' : 'text-red-400'}>
                  {config.system_settings?.trading_enabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Deposit Enabled</span>
                <span className={config.system_settings?.deposit_enabled ? 'text-green-400' : 'text-red-400'}>
                  {config.system_settings?.deposit_enabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Withdrawal Enabled</span>
                <span className={config.system_settings?.withdrawal_enabled ? 'text-green-400' : 'text-red-400'}>
                  {config.system_settings?.withdrawal_enabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Maintenance Mode</span>
                <span className={config.system_settings?.maintenance_mode ? 'text-red-400' : 'text-green-400'}>
                  {config.system_settings?.maintenance_mode ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Real-time Update Test</h2>
          <p className="text-gray-300 mb-4">
            This page will automatically update when you change configuration in the admin panel.
          </p>
          <div className="flex gap-4">
            <a 
              href="/admin/operate" 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium"
            >
              Go to Admin Panel
            </a>
            <a 
              href="/deposit" 
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-medium"
            >
              Go to Deposit Page
            </a>
            <a 
              href="/wallets" 
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-medium"
            >
              Go to Wallets Page
            </a>
          </div>
        </div>

        <div className="mt-8 bg-yellow-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Open the admin panel in another tab</li>
            <li>Go to the "Wallet Address" tab</li>
            <li>Change any wallet address</li>
            <li>Watch this page update in real-time</li>
            <li>Check other pages (deposit, wallets) to see they also update</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 