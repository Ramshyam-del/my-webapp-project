const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function testWithdrawalFlow() {
  try {
    console.log('Testing withdrawal flow...');
    
    // Test 1: Try to call API without authentication
    console.log('\n1. Testing without authentication:');
    const response1 = await fetch('http://localhost:3000/api/withdrawals/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currency: 'BTC',
        amount: 0.001,
        wallet_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        network: 'Bitcoin'
      })
    });
    
    const result1 = await response1.json();
    console.log('Response:', result1);
    console.log('Expected: Should return unauthorized error');
    
    // Test 2: Check if API endpoint exists and responds
    console.log('\n2. Testing API endpoint availability:');
    const response2 = await fetch('http://localhost:3000/api/withdrawals/create', {
      method: 'GET'
    });
    
    console.log('GET Response Status:', response2.status);
    console.log('Expected: Should return 405 Method Not Allowed or similar');
    
    console.log('\n✅ Withdrawal API tests completed!');
    console.log('\nNext steps:');
    console.log('1. Try logging into the frontend at http://localhost:3000/login');
    console.log('2. Navigate to http://localhost:3000/withdraw');
    console.log('3. Fill out the withdrawal form and submit');
    console.log('4. Check if the error is resolved');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithdrawalFlow();