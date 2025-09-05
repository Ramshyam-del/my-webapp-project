// Use built-in fetch (Node 18+) or fallback
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (e) {
  console.log('Using axios instead of fetch');
  const axios = require('axios');
  
  // Create a fetch-like wrapper for axios
  fetch = async (url, options = {}) => {
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: options.headers,
        data: options.body,
        withCredentials: options.credentials === 'include'
      });
      
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.data
      };
    } catch (error) {
      if (error.response) {
        return {
          ok: false,
          status: error.response.status,
          json: async () => error.response.data
        };
      }
      throw error;
    }
  };
}

// Test login functionality
async function testLogin() {
  const API_BASE_URL = 'http://localhost:4001';
  
  // Test with a test user email
  const testCredentials = {
    email: 'test1756664240920@example.com',
    password: 'password123' // Common test password
  };
  
  console.log('Testing login with:', testCredentials.email);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.ok) {
      console.log('✅ Login successful!');
      console.log('User data:', data.user);
      console.log('Session data:', data.session ? 'Present' : 'Missing');
    } else {
      console.log('❌ Login failed:', data.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Test with wrong password
async function testWrongPassword() {
  const API_BASE_URL = 'http://localhost:4001';
  
  const testCredentials = {
    email: 'test1756664240920@example.com',
    password: 'wrongpassword'
  };
  
  console.log('\nTesting login with wrong password:', testCredentials.email);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials)
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.log('✅ Correctly rejected wrong password');
    } else {
      console.log('❌ Security issue: Wrong password was accepted!');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('=== Login Authentication Test ===\n');
  
  await testLogin();
  await testWrongPassword();
  
  console.log('\n=== Test Complete ===');
}

runTests();