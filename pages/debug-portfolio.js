import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function DebugPortfolio() {
  const { user, isAuthenticated } = useAuth();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [cryptoPrices, setCryptoPrices] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionInfo(session);
      console.log('Session info:', session);
    };
    checkSession();
  }, []);

  const testPortfolioAPI = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No session found');
        return;
      }

      const response = await fetch(`/api/portfolio/balance?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioResult(JSON.stringify(data, null, 2));
        console.log('Portfolio data:', data);
      } else {
        const errorData = await response.text();
        setError(`API Error: ${response.status} - ${errorData}`);
      }
    } catch (err) {
      setError(`Fetch Error: ${err.message}`);
    }
  };

  const testWithSpecificUser = async () => {
    try {
      // Test with the user we created portfolio data for
      const response = await fetch('/api/portfolio/balance?userId=32f8e67d-d9a5-46ac-8a43-23a21f1c471b');
      const data = await response.json();
      console.log('Specific User Portfolio Response:', data);
      setPortfolioData(data);
    } catch (error) {
      console.error('Specific User Portfolio Error:', error);
      setPortfolioResult(`Error: ${error.message}`);
    }
  };

  const testCryptoPrices = async () => {
    try {
      const response = await fetch(`/api/crypto/prices?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setCryptoPrices(data);
        console.log('Crypto prices:', data);
      }
    } catch (err) {
      console.error('Crypto prices error:', err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Portfolio Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Authentication Status</h2>
          <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          <p>User ID: {user?.id || 'None'}</p>
          <p>User Email: {user?.email || 'None'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Session Info</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div className="space-x-4">
          <button 
            onClick={testPortfolioAPI}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Portfolio API
          </button>
          <button 
            onClick={testWithSpecificUser}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Test Specific User
          </button>
          <button 
            onClick={testCryptoPrices}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Test Crypto Prices API
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {portfolioData && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Portfolio Data</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(portfolioData, null, 2)}
            </pre>
          </div>
        )}

        {cryptoPrices && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Crypto Prices</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(cryptoPrices, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}