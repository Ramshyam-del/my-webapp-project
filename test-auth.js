// Test script to check authentication
const supabase = require('./lib/supabase').supabase;

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...');
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('❌ No active session');
      return;
    }
    
    console.log('✅ Session found');
    console.log('✅ Access token:', session.access_token ? 'Present' : 'Missing');
    
    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ User error:', userError.message);
      return;
    }
    
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    console.log('✅ User ID:', user.id);
    console.log('✅ User email:', user.email);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAuth();