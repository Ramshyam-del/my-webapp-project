import React, { useEffect, useState } from 'react';

export default function AdminSystem() {
  // Mock settings for demonstration
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // In a real app, fetch settings from backend here
  // useEffect(() => { ... }, []);

  const handleToggle = async () => {
    setLoading(true);
    // In a real app, send update to backend here
    setTimeout(() => {
      setMaintenance((m) => !m);
      setStatus('Setting updated!');
      setLoading(false);
      setTimeout(() => setStatus(''), 2000);
    }, 800);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">System Management</h1>
      <div className="bg-white rounded shadow p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Site Settings</h2>
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium">Maintenance Mode</span>
          <button
            className={`px-4 py-1 rounded-full font-semibold text-white transition ${maintenance ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            onClick={handleToggle}
            disabled={loading}
          >
            {maintenance ? 'ON' : 'OFF'}
          </button>
        </div>
        {status && <div className="text-blue-600 text-sm mb-2">{status}</div>}
        <hr className="my-6" />
        <h2 className="text-lg font-semibold mb-4">Environment Info</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li><b>NODE_ENV:</b> {process.env.NODE_ENV || 'development'}</li>
          <li><b>API URL:</b> {process.env.NEXT_PUBLIC_API_URL || 'N/A'}</li>
        </ul>
        <div className="text-xs text-gray-400 mt-4">(Secrets are hidden for security)</div>
      </div>
    </div>
  );
} 