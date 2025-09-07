import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function Logout() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Clear Supabase session
        await supabase.auth.signOut();
        
        // Clear any local storage
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear cookies
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
        }
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 1000);
        
      } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if there's an error
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      }
    };

    performLogout();
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>Logging out...</h2>
      <p>Clearing session and redirecting to login...</p>
      <div style={{ 
        marginTop: '20px',
        padding: '10px',
        background: '#f0f0f0',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        Current user: {user?.email || 'None'}
      </div>
    </div>
  );
}