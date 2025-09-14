const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test the frontend notification API
async function testFrontendNotifications() {
  console.log('🧪 Testing frontend notification API...');
  
  try {
    // First, let's test without authentication to see the error
    console.log('\n1. Testing without authentication...');
    const noAuthResponse = await fetch('http://localhost:3000/api/notifications?limit=10');
    const noAuthData = await noAuthResponse.json();
    console.log(`Status: ${noAuthResponse.status}`);
    console.log('Response:', JSON.stringify(noAuthData, null, 2));
    
    // Test with invalid token
    console.log('\n2. Testing with invalid token...');
    const invalidTokenResponse = await fetch('http://localhost:3000/api/notifications?limit=10', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    const invalidTokenData = await invalidTokenResponse.json();
    console.log(`Status: ${invalidTokenResponse.status}`);
    console.log('Response:', JSON.stringify(invalidTokenData, null, 2));
    
    // Now let's try to get a real user session token
    console.log('\n3. Attempting to login and get real token...');
    
    // First check if backend is accessible
    try {
      const backendHealthResponse = await fetch('http://localhost:4001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' })
      });
      console.log('Backend accessible:', backendHealthResponse.status !== undefined);
    } catch (error) {
      console.log('❌ Backend not accessible:', error.message);
      return;
    }
    
    // Login as admin user (more likely to exist)
    const loginResponse = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'TestUser123!'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      if (loginData.ok && loginData.session?.access_token) {
        const userToken = loginData.session.access_token;
        const userId = loginData.user.id;
        console.log('✅ Login successful');
        console.log('👤 User ID:', userId);
        
        // Test frontend API with real token
        console.log('\n4. Testing frontend API with real token...');
        const frontendResponse = await fetch('http://localhost:3000/api/notifications?limit=10&is_read=false', {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const frontendData = await frontendResponse.json();
        console.log(`Status: ${frontendResponse.status}`);
        console.log('Response:', JSON.stringify(frontendData, null, 2));
        
        if (frontendResponse.ok && frontendData.success) {
          console.log('\n✅ Frontend API working correctly!');
          console.log(`📊 Found ${frontendData.data.notifications?.length || 0} notifications`);
          console.log(`🔔 Unread count: ${frontendData.data.unreadCount || 0}`);
          
          if (frontendData.data.notifications && frontendData.data.notifications.length > 0) {
            console.log('\n📋 Notifications:');
            frontendData.data.notifications.forEach((notif, index) => {
              console.log(`   ${index + 1}. ${notif.title} - ${notif.message} (${notif.is_read ? 'read' : 'unread'})`);
            });
          }
        } else {
          console.log('❌ Frontend API failed:', frontendData.error);
        }
        
      } else {
        console.log('❌ Login failed:', loginData.message);
      }
    } else {
      console.log('❌ Login request failed:', loginResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendNotifications();