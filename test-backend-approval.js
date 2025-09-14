require('dotenv').config();
const axios = require('axios');

async function testBackendApproval() {
  try {
    console.log('Testing backend withdrawal approval API...');
    
    // Get a JWT token for admin user
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ramshyamgopalharia@gmail.com', // Replace with actual admin email
      password: 'admin123' // Replace with actual admin password
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    const token = authData.session.access_token;
    console.log('Got auth token:', token.substring(0, 20) + '...');
    
    // Get a withdrawal ID to test with
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
    
    // Call the backend API
    const response = await axios.post(
      `http://localhost:4001/api/admin/withdrawals/${withdrawalId}/approve`,
      { admin_note: 'Test approval from script' },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

testBackendApproval();