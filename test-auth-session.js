// Test script to check authentication session
const { supabase } = require('./lib/supabase');

async function testAuthSession() {
  console.log('Testing authentication session...');
  
  try {
    // Get current session
    console.log('🔍 Getting current session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Session error:', error);
      return;
    }
    
    console.log('✅ Session data:', {
      hasSession: !!session,
      hasAccessToken: !!(session && session.access_token),
      accessTokenLength: session ? session.access_token?.length : 0,
      user: session ? session.user?.id : null
    });
    
    if (!session || !session.access_token) {
      console.log('❌ No valid session or access token');
      return;
    }
    
    // Test the trade history API with the token
    console.log('🔍 Testing trade history API with token...');
    const response = await fetch('http://localhost:3000/api/trading/trade-history?limit=5', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API response data:', data);
    } else {
      const text = await response.text();
      console.log('❌ API error response:', text);
    }
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

testAuthSession();