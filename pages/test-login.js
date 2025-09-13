import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TestLogin() {
  const [email, setEmail] = useState('testuser@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        setStatus(`Already logged in as: ${session.user.email}`);
        setIsError(false);
      }
    };
    checkSession();
  }, []);

  const showStatus = (message, error = false) => {
    setStatus(message);
    setIsError(error);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    showStatus('Logging in...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        showStatus(`Login failed: ${error.message}`, true);
      } else {
        setCurrentUser(data.user);
        showStatus(`✅ Login successful! User: ${data.user.email}`);
        console.log('Login successful:', data);
      }
    } catch (error) {
      showStatus(`Login error: ${error.message}`, true);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setStatus('Logged out successfully');
      setIsError(false);
    } catch (error) {
      showStatus(`Logout error: ${error.message}`, true);
    }
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '500px',
      margin: '50px auto',
      padding: '20px',
      background: '#f5f5f5'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2>Test Login for Withdrawal</h2>
        <p>Use these credentials to test the withdrawal functionality:</p>
        
        {currentUser ? (
          <div>
            <p><strong>Currently logged in as:</strong> {currentUser.email}</p>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Login
            </button>
          </form>
        )}
        
        {status && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '5px',
            background: isError ? '#f8d7da' : '#d4edda',
            color: isError ? '#721c24' : '#155724',
            border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`
          }}>
            <div dangerouslySetInnerHTML={{ __html: status }} />
          </div>
        )}
        
        <div style={{ marginTop: '20px' }}>
          <p><strong>After logging in:</strong></p>
          <ol>
            <li><a href="/portfolio" target="_blank" style={{ color: '#007bff' }}>Go to Portfolio Page</a></li>
            <li>Try the withdrawal functionality</li>
            <li>Check browser console for debugging info</li>
          </ol>
        </div>
      </div>
    </div>
  );
}