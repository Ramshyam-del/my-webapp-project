import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthStatus() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const testWithdrawal = async () => {
    if (!session) {
      setTestResult({ error: 'No session found' });
      return;
    }

    try {
      const response = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          currency: 'USDT',
          amount: 5,
          wallet_address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'
        })
      });

      const result = await response.json();
      setTestResult({
        status: response.status,
        ok: response.ok,
        result: result,
        resultOk: result.ok
      });
    } catch (error) {
      setTestResult({ error: error.message });
    }
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'testpassword123'
    });
    if (error) {
      alert('Sign in failed: ' + error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Authentication Status Debug</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Session Status</h2>
        {session ? (
          <div>
            <p>✅ <strong>Logged in</strong></p>
            <p>👤 User ID: {session.user.id}</p>
            <p>📧 Email: {session.user.email}</p>
            <p>🎫 Token (first 30 chars): {session.access_token.substring(0, 30)}...</p>
            <button onClick={signOut} style={{ padding: '5px 10px', margin: '5px' }}>Sign Out</button>
          </div>
        ) : (
          <div>
            <p>❌ <strong>Not logged in</strong></p>
            <button onClick={signIn} style={{ padding: '5px 10px', margin: '5px' }}>Sign In as Test User</button>
          </div>
        )}
      </div>

      {session && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h2>Withdrawal Test</h2>
          <button onClick={testWithdrawal} style={{ padding: '5px 10px', margin: '5px' }}>Test Withdrawal API</button>
          
          {testResult && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
              <h3>Test Result:</h3>
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
              
              {testResult.resultOk ? (
                <p style={{ color: 'green' }}>✅ result.ok is TRUE - Should show success</p>
              ) : (
                <p style={{ color: 'red' }}>❌ result.ok is FALSE - Will show error</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}