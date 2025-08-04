import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function TestSupabase() {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('Testing connection...');
    
    try {
      // Test basic connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        setTestResult(`Error: ${error.message}`);
      } else {
        setTestResult('Connection successful! Database is accessible.');
      }
    } catch (error) {
      setTestResult(`Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setTestResult('Testing auth...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      if (error) {
        setTestResult(`Auth Error: ${error.message}`);
      } else {
        setTestResult('Auth test successful! Check your email for verification.');
      }
    } catch (error) {
      setTestResult(`Auth Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Environment Variables:</h2>
          <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
          <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Tests:</h2>
          <div className="space-x-4">
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Test Database Connection
            </button>
            <button
              onClick={testAuth}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Test Auth
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Result:</h2>
          <div className="bg-gray-800 p-4 rounded">
            <pre className="whitespace-pre-wrap">{testResult}</pre>
          </div>
        </div>
      </div>
    </div>
  );
} 