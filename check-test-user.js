// Test script to check if our test user exists
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

const serverSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTestUser() {
  console.log('Checking if test user exists...');
  
  try {
    const testUserId = '1b26c5eb-f775-45ae-9178-62297341ee0f';
    
    const { data: user, error } = await serverSupabase
      .from('users')
      .select('id, email, role')
      .eq('id', testUserId)
      .single();
    
    if (error) {
      console.log('❌ Query failed:', error);
      return;
    }
    
    if (!user) {
      console.log('❌ Test user not found in users table');
      return;
    }
    
    console.log('✅ Test user found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
  } catch (error) {
    console.log('❌ Check failed:', error);
  }
}

checkTestUser();