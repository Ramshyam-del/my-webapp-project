require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDirectBackend() {
  try {
    console.log('Testing direct backend authentication...');
    
    // Test backend login endpoint directly
    console.log('\n1️⃣ Testing admin login via backend API...');
    const loginResponse = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', {
      status: loginResponse.status,
      ok: loginData.ok,
      message: loginData.message || 'Success'
    });
    
    if (!loginData.ok) {
      console.log('❌ Login failed, trying different credentials...');
      
      // Try admin@test.com
      const loginResponse2 = await fetch('http://localhost:4001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'admin123'
        })
      });
      
      const loginData2 = await loginResponse2.json();
      console.log('Second login attempt:', {
        status: loginResponse2.status,
        ok: loginData2.ok,
        message: loginData2.message || 'Success'
      });
      
      if (!loginData2.ok) {
        console.log('❌ Both login attempts failed');
        return;
      }
    }
    
    console.log('✅ Authentication test completed');
    
    // Get a pending withdrawal
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('id, status')
      .eq('status', 'pending')
      .limit(1);
    
    if (!withdrawals || withdrawals.length === 0) {
      console.log('No pending withdrawals found');
      return;
    }
    
    const withdrawalId = withdrawals[0].id;
    console.log('Testing with withdrawal ID:', withdrawalId);
    
    // Test backend directly using fetch
    const response = await fetch(`http://localhost:4001/api/admin/withdrawals/${withdrawalId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ admin_note: 'Direct backend test' })
    });
    
    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testDirectBackend();