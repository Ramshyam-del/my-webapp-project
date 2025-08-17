const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:4001';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual admin JWT token

async function testWithdrawalsAPI() {
  console.log('🧪 Testing Withdrawals API endpoints...\n');

  const headers = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: GET /api/admin/withdrawals (basic)
    console.log('1. Testing GET /api/admin/withdrawals...');
    const response1 = await fetch(`${BASE_URL}/api/admin/withdrawals`, { headers });
    const data1 = await response1.json();
    console.log(`   Status: ${response1.status}`);
    console.log(`   Response:`, JSON.stringify(data1, null, 2));
    console.log('');

    // Test 2: GET with filters
    console.log('2. Testing GET /api/admin/withdrawals with filters...');
    const params = new URLSearchParams({
      page: '1',
      page_size: '10',
      status: 'pending'
    });
    const response2 = await fetch(`${BASE_URL}/api/admin/withdrawals?${params}`, { headers });
    const data2 = await response2.json();
    console.log(`   Status: ${response2.status}`);
    console.log(`   Response:`, JSON.stringify(data2, null, 2));
    console.log('');

    // Test 3: POST lock (will fail without valid ID, but tests endpoint)
    console.log('3. Testing POST /api/admin/withdrawals/:id/lock...');
    const response3 = await fetch(`${BASE_URL}/api/admin/withdrawals/test-id/lock`, {
      method: 'POST',
      headers
    });
    const data3 = await response3.json();
    console.log(`   Status: ${response3.status}`);
    console.log(`   Response:`, JSON.stringify(data3, null, 2));
    console.log('');

    // Test 4: POST reject (will fail without valid ID, but tests endpoint)
    console.log('4. Testing POST /api/admin/withdrawals/:id/reject...');
    const response4 = await fetch(`${BASE_URL}/api/admin/withdrawals/test-id/reject`, {
      method: 'POST',
      headers
    });
    const data4 = await response4.json();
    console.log(`   Status: ${response4.status}`);
    console.log(`   Response:`, JSON.stringify(data4, null, 2));
    console.log('');

    console.log('✅ All tests completed!');
    console.log('\n📝 To test with real data:');
    console.log('1. Replace TEST_TOKEN with a valid admin JWT token');
    console.log('2. Ensure the withdrawals table exists in your Supabase database');
    console.log('3. Run this script again');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testWithdrawalsAPI();
