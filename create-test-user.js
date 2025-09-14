require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...');
    
    // Register a new test user via backend API
    const registerResponse = await fetch('http://localhost:4001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser2@example.com',
        password: 'TestUser123!',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser2',
        phone: '1234567890'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register response:', {
      status: registerResponse.status,
      ok: registerData.ok,
      message: registerData.message || 'Success'
    });
    
    if (registerData.ok) {
      console.log('✅ Test user registered successfully');
      
      // Test login with new user
      console.log('\n🧪 Testing login with new user...');
      const loginResponse = await fetch('http://localhost:4001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testuser2@example.com',
          password: 'TestUser123!'
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('Login test:', {
        status: loginResponse.status,
        ok: loginData.ok,
        message: loginData.message || 'Success'
      });
      
      if (loginData.ok) {
        console.log('✅ Test user login successful!');
        console.log('🎯 Use these credentials for testing:');
        console.log('   Email: testuser2@example.com');
        console.log('   Password: TestUser123!');
      }
    } else {
      console.log('❌ Registration failed:', registerData.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();