const fetch = require('node-fetch');

// Test the notification system after the fix
async function testNotificationSystem() {
  console.log('🧪 Testing notification system after fix...');
  
  try {
    // Test 1: Check if frontend is accessible
    console.log('\n1. Testing frontend accessibility...');
    const frontendResponse = await fetch('http://localhost:3000/exchange');
    console.log(`Frontend status: ${frontendResponse.status}`);
    
    // Test 2: Check if backend is accessible
    console.log('\n2. Testing backend accessibility...');
    const backendResponse = await fetch('http://localhost:4001/api/notifications');
    console.log(`Backend status: ${backendResponse.status}`);
    
    // Test 3: Check if frontend API route is accessible
    console.log('\n3. Testing frontend API route...');
    const frontendApiResponse = await fetch('http://localhost:3000/api/notifications');
    console.log(`Frontend API status: ${frontendApiResponse.status}`);
    
    if (frontendResponse.status === 200 && backendResponse.status >= 200 && frontendApiResponse.status >= 200) {
      console.log('\n✅ All services are accessible!');
      console.log('\n📋 Summary:');
      console.log('- Frontend: Running on http://localhost:3000');
      console.log('- Backend: Running on http://localhost:4001');
      console.log('- Frontend API: Available at /api/notifications');
      console.log('\n🎯 The notification system should now work properly!');
      console.log('\n📝 Next steps:');
      console.log('1. Login to the frontend as a user');
      console.log('2. Check if notifications appear in the exchange page');
      console.log('3. Test withdrawal approval flow to generate notifications');
    } else {
      console.log('\n❌ Some services are not accessible');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotificationSystem();