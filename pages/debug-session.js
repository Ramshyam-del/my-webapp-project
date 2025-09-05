import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugSession() {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [apiTest, setApiTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    debugSession();
  }, []);

  const debugSession = async () => {
    try {
      // Check Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      const info = {
        supabaseSession: session ? {
          user: {
            id: session.user.id,
            email: session.user.email
          },
          tokenLength: session.access_token?.length,
          expiresAt: session.expires_at
        } : null,
        supabaseError: error?.message,
        localStorage: {},
        cookies: document.cookie
      };
      
      // Check localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          info.localStorage[key] = localStorage.getItem(key)?.substring(0, 100) + '...';
        }
      });
      
      setSessionInfo(info);
      
      // Test API call
      try {
        const response = await fetch('/api/admin/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const apiResult = {
          status: response.status,
          ok: response.ok
        };
        
        if (response.ok) {
          apiResult.data = await response.json();
        } else {
          apiResult.error = await response.text();
        }
        
        setApiTest(apiResult);
      } catch (fetchError) {
        setApiTest({ error: fetchError.message });
      }
      
    } catch (error) {
      setSessionInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Session Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Supabase Session</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>
        
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">API Test (/api/admin/me)</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        </div>
        
        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          <button 
            onClick={debugSession}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Refresh Debug Info
          </button>
          <button 
            onClick={() => window.location.href = '/admin/login'}
            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
          >
            Go to Admin Login
          </button>
          <button 
            onClick={() => window.location.href = '/admin/kyc'}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Go to KYC Page
          </button>
        </div>
      </div>
    </div>
  );
}