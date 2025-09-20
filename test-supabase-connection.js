const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Missing');
console.log('Service Role Key:', serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'Missing');

async function testConnection() {
  try {
    // Test with anon key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n1. Testing anonymous connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Anonymous connection failed:', error.message);
    } else {
      console.log('✅ Anonymous connection successful');
    }
    
    // Test with service role key
    console.log('\n2. Testing service role connection...');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminData, error: adminError } = await supabaseAdmin.from('users').select('count').limit(1);
    
    if (adminError) {
      console.error('❌ Service role connection failed:', adminError.message);
    } else {
      console.log('✅ Service role connection successful');
    }
    
    // Test auth
    console.log('\n3. Testing auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth service failed:', authError.message);
    } else {
      console.log('✅ Auth service accessible');
    }
    
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
  }
}

testConnection();