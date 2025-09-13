const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login process...');
    
    // Test login with admin credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ramshyamgopalhari@gmail.com',
      password: 'Million2026' // User provided password
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('📋 User info:', {
      id: authData.user.id,
      email: authData.user.email,
      tokenLength: authData.session.access_token.length
    });
    
    // Test admin role verification
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id,email,role,status')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile fetch failed:', profileError.message);
      return;
    }
    
    console.log('✅ Profile fetched:', {
      role: profile.role,
      status: profile.status
    });
    
    if (profile.role !== 'admin') {
      console.log('❌ User is not an admin');
      return;
    }
    
    console.log('✅ Admin role confirmed!');
    
    // Test API call with token
    const token = authData.session.access_token;
    console.log('\n🧪 Testing API call with token...');
    
    const response = await fetch('http://localhost:3000/api/admin/withdrawals/25f80c63-f419-4af4-be79-46370b10437c/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ admin_note: 'Test approval' })
    });
    
    const result = await response.json();
    console.log('📨 API Response:', {
      status: response.status,
      ok: response.ok,
      result: result
    });
    
    if (response.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminLogin();