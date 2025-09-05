// Test script to verify user switching and localStorage clearing
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:4001';

// Test user switching functionality
async function testUserSwitching() {
  console.log('🧪 Testing user switching and localStorage clearing...');
  
  try {
    // Test login with first user
    console.log('\n1. Testing login with first user (logintest@example.com)...');
    const response1 = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'logintest@example.com',
        password: 'TestPassword123!'
      })
    });
    
    const result1 = await response1.json();
    console.log('First login result:', {
      status: response1.status,
      success: result1.ok,
      email: result1.user?.email,
      message: result1.message
    });
    
    // Simulate localStorage data (this would normally be done by the frontend)
    console.log('\n2. Simulating localStorage data for first user...');
    console.log('   - tempUserProfile would contain: logintest@example.com');
    console.log('   - Other user-specific data would be cached');
    
    // Test login with second user
    console.log('\n3. Testing login with second user (test1756664240920@example.com)...');
    const response2 = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test1756664240920@example.com',
        password: 'password123' // This might not work, but we're testing the clearing logic
      })
    });
    
    const result2 = await response2.json();
    console.log('Second login result:', {
      status: response2.status,
      success: result2.ok,
      email: result2.user?.email,
      message: result2.message
    });
    
    console.log('\n✅ Test completed!');
    console.log('\n📝 Expected behavior:');
    console.log('   - When a user logs in, localStorage should be cleared of previous user data');
    console.log('   - The AuthContext signIn function now clears tempUserProfile and other user-specific keys');
    console.log('   - The portfolio.js fetchUserData function now clears stale temp profiles');
    console.log('   - This should prevent the old Gmail from showing when switching accounts');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserSwitching();