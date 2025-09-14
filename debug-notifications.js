// Use built-in fetch for Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');

// Test the notification system step by step
async function debugNotifications() {
  try {
    console.log('🔍 Debugging Notification System...');
    
    // Step 1: Check if frontend is running
    console.log('\n1️⃣ Checking if frontend is running...');
    try {
      const frontendResponse = await fetch('http://localhost:3000/');
      console.log('✅ Frontend is running:', frontendResponse.status);
    } catch (error) {
      console.log('❌ Frontend not accessible:', error.message);
      return;
    }
    
    // Step 2: Check if backend is running
    console.log('\n2️⃣ Checking if backend is running...');
    try {
      const backendResponse = await fetch('http://localhost:4001/api/health');
      if (backendResponse.ok) {
        console.log('✅ Backend is running:', backendResponse.status);
      } else {
        console.log('⚠️ Backend responded with:', backendResponse.status);
      }
    } catch (error) {
      console.log('❌ Backend not accessible:', error.message);
    }
    
    // Step 3: Test the notifications API without auth (should fail gracefully)
    console.log('\n3️⃣ Testing notifications API without auth...');
    try {
      const noAuthResponse = await fetch('http://localhost:3000/api/notifications');
      console.log('📡 No-auth response status:', noAuthResponse.status);
      const noAuthText = await noAuthResponse.text();
      console.log('📄 No-auth response:', noAuthText.substring(0, 200));
    } catch (error) {
      console.log('❌ API call failed:', error.message);
    }
    
    // Step 4: Test with a fake token (should fail gracefully)
    console.log('\n4️⃣ Testing notifications API with fake token...');
    try {
      const fakeTokenResponse = await fetch('http://localhost:3000/api/notifications', {
        headers: {
          'Authorization': 'Bearer fake-token-12345',
          'Content-Type': 'application/json'
        }
      });
      console.log('📡 Fake token response status:', fakeTokenResponse.status);
      const fakeTokenText = await fakeTokenResponse.text();
      console.log('📄 Fake token response:', fakeTokenText.substring(0, 200));
    } catch (error) {
      console.log('❌ Fake token API call failed:', error.message);
    }
    
    // Step 5: Check if there are any JavaScript errors in the console
    console.log('\n5️⃣ Recommendations:');
    console.log('   • Open browser dev tools and check Console tab for errors');
    console.log('   • Check Network tab to see if /api/notifications requests are being made');
    console.log('   • Verify user is logged in by checking Application > Local Storage');
    console.log('   • Look for Supabase session data in localStorage');
    console.log('   • Check if notification polling is actually running every 30 seconds');
    
    console.log('\n6️⃣ Next steps to manually test:');
    console.log('   1. Open http://localhost:3000 in browser');
    console.log('   2. Login with any valid credentials');
    console.log('   3. Navigate to Exchange page');
    console.log('   4. Open browser dev tools > Network tab');
    console.log('   5. Wait 30 seconds and look for /api/notifications requests');
    console.log('   6. Check if requests are successful (200) or failing');
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

// Run the debug
debugNotifications();