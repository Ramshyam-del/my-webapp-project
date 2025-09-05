const { supabase } = require('./lib/supabaseClient');

async function checkAuthSession() {
  try {
    console.log('🔍 Checking current Supabase session...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('📋 Session details:');
    console.log('- Has session:', !!session);
    console.log('- Has user:', !!session?.user);
    console.log('- User email:', session?.user?.email);
    console.log('- User ID:', session?.user?.id);
    console.log('- Token exists:', !!session?.access_token);
    console.log('- Token length:', session?.access_token?.length);
    console.log('- Session error:', error?.message);
    
    if (session?.access_token) {
      console.log('\n🔑 Testing token with backend...');
      
      const response = await fetch('http://localhost:4001/api/admin/users/kyc', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('- Backend response status:', response.status);
      console.log('- Backend response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('- Backend error:', errorText);
      } else {
        console.log('✅ Backend authentication successful!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking session:', error.message);
  }
}

checkAuthSession();