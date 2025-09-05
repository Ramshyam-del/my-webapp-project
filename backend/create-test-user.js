const axios = require('axios');

// Create a test user with known credentials
async function createTestUser() {
  const API_BASE_URL = 'http://localhost:4001';
  
  const testUser = {
    email: 'logintest@example.com',
    password: 'TestPassword123!',
    firstName: 'Login',
    lastName: 'Test',
    username: 'logintest',
    phone: '1234567890'
  };
  
  console.log('Creating test user:', testUser.email);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Registration response status:', response.status);
    console.log('Registration response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 201 && response.data.ok) {
      console.log('✅ Test user created successfully!');
      console.log('Email:', testUser.email);
      console.log('Password:', testUser.password);
      
      // Now test login with the new user
      await testLogin(testUser.email, testUser.password);
    } else {
      console.log('❌ Failed to create test user:', response.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Registration failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

// Test login with the created user
async function testLogin(email, password) {
  const API_BASE_URL = 'http://localhost:4001';
  
  console.log('\n--- Testing Login ---');
  console.log('Email:', email);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    
    console.log('Login response status:', response.status);
    console.log('Login response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.ok) {
      console.log('✅ Login successful!');
      console.log('User data:', response.data.user);
      console.log('Session data:', response.data.session ? 'Present' : 'Missing');
    } else {
      console.log('❌ Login failed:', response.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Login failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

// Run the test
createTestUser();