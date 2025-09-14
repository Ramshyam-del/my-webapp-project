const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testNotificationPersistence() {
  console.log('🔄 Testing notification persistence after page refresh...');
  
  try {
    // 1. Login to get session token
    console.log('1️⃣ Logging in to get session token...');
    const loginResponse = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser2@example.com',
        password: 'TestUser123!'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✅ Login successful');
    
    // 2. Fetch notifications (first time)
    console.log('2️⃣ Fetching notifications (first time)...');
    const firstFetch = await fetch('http://localhost:3000/api/notifications?limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!firstFetch.ok) {
      throw new Error(`First fetch failed: ${firstFetch.status}`);
    }
    
    const firstData = await firstFetch.json();
    console.log(`📬 First fetch: Found ${firstData.data?.notifications?.length || 0} notifications`);
    
    // 3. Wait a moment (simulating page refresh delay)
    console.log('3️⃣ Simulating page refresh delay...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Fetch notifications again (simulating after page refresh)
    console.log('4️⃣ Fetching notifications again (after "refresh")...');
    const secondFetch = await fetch('http://localhost:3000/api/notifications?limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!secondFetch.ok) {
      throw new Error(`Second fetch failed: ${secondFetch.status}`);
    }
    
    const secondData = await secondFetch.json();
    console.log(`📬 Second fetch: Found ${secondData.data?.notifications?.length || 0} notifications`);
    
    // 5. Compare results
    const firstCount = firstData.data?.notifications?.length || 0;
    const secondCount = secondData.data?.notifications?.length || 0;
    
    if (firstCount === secondCount && firstCount > 0) {
      console.log('✅ SUCCESS: Notifications persist after page refresh!');
      console.log(`📊 Consistent notification count: ${firstCount}`);
    } else if (firstCount === 0 && secondCount === 0) {
      console.log('ℹ️  No notifications found (this is normal if no notifications exist)');
    } else {
      console.log(`❌ ISSUE: Notification count changed from ${firstCount} to ${secondCount}`);
    }
    
    // 6. Check for welcome notification (should not exist)
    const hasWelcomeFirst = firstData.data?.notifications?.some(n => n.title?.includes('Welcome'));
    const hasWelcomeSecond = secondData.data?.notifications?.some(n => n.title?.includes('Welcome'));
    
    if (!hasWelcomeFirst && !hasWelcomeSecond) {
      console.log('✅ SUCCESS: No welcome notification found (as expected)');
    } else {
      console.log('❌ ISSUE: Welcome notification still present');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotificationPersistence();