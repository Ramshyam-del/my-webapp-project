import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugUser() {
  const { user, isAuthenticated, loading } = useAuth();
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [supabaseSession, setSupabaseSession] = useState(null);

  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        setSupabaseSession(session);
        setSupabaseUser(session?.user || null);
      } catch (error) {
        console.error('Supabase auth check error:', error);
      }
    };

    checkSupabaseAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>User Debug Information</h1>
      
      <h2>AuthContext User:</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify({ user, isAuthenticated }, null, 2)}
      </pre>

      <h2>Supabase Session:</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(supabaseSession, null, 2)}
      </pre>

      <h2>Supabase User:</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(supabaseUser, null, 2)}
      </pre>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/login'}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Go to Login
        </button>
        <button 
          onClick={() => window.location.href = '/portfolio'}
          style={{ padding: '8px 16px' }}
        >
          Go to Portfolio
        </button>
      </div>
    </div>
  );
}