// Script to fix session switching issue
// This will help clear persistent cookies and test proper user switching

// Use dynamic import for node-fetch
let fetch;

async function initFetch() {
  if (!fetch) {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
  }
}

const API_BASE_URL = 'http://localhost:4001';

async function testSessionSwitching() {
  console.log('🔧 Testing session switching issue...');
  
  // Initialize fetch
  await initFetch();
  
  try {
    // First, let's check the current session state
    console.log('\n1. Checking current session state...');
    const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (meResponse.ok) {
      const currentUser = await meResponse.json();
      console.log('Current session user:', {
        email: currentUser.user?.email,
        id: currentUser.user?.id,
        username: currentUser.user?.username
      });
    } else {
      console.log('No active session found');
    }
    
    // Test logout to clear session
    console.log('\n2. Testing logout to clear session...');
    const logoutResponse = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const logoutResult = await logoutResponse.json();
    console.log('Logout result:', {
      status: logoutResponse.status,
      success: logoutResult.ok,
      message: logoutResult.message
    });
    
    // Test login with rejindhungana@gmail.com
    console.log('\n3. Testing login with rejindhungana@gmail.com...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'rejindhungana@gmail.com',
        password: 'Rejin@123'
      })
    });
    
    const loginResult = await loginResponse.json();
     
     console.log('Login result:', {
      status: loginResponse.status,
      success: loginResult.ok,
      email: loginResult.user?.email,
      id: loginResult.user?.id,
      username: loginResult.user?.username,
      message: loginResult.message
    });
    
    // Check session after login
    console.log('\n4. Checking session after login...');
    const newMeResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (newMeResponse.ok) {
      const newUser = await newMeResponse.json();
      console.log('New session user:', {
        email: newUser.user?.email,
        id: newUser.user?.id,
        username: newUser.user?.username
      });
    }
    
    // Test portfolio balance API
    console.log('\n5. Testing portfolio balance API...');
    const balanceResponse = await fetch(`${API_BASE_URL}/api/portfolio/balance?userId=${loginResult.user?.id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log('Portfolio balance:', {
        totalBalance: balanceData.totalBalance,
        currencies: balanceData.currencies?.length || 0,
        success: balanceData.success
      });
    } else {
      console.log('Balance API failed:', balanceResponse.status);
    }
    
    console.log('\n✅ Session switching test completed!');
    console.log('\n📝 Expected behavior:');
    console.log('   - Logout should clear all session cookies');
    console.log('   - Login should establish new session for correct user');
    console.log('   - /me endpoint should return the newly logged-in user');
    console.log('   - Portfolio balance should show $20 USDT for rejindhungana@gmail.com');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSessionSwitching();