// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import node-fetch dynamically as it's ESM-only in v3
(async () => {
  try {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
    runTests();
  } catch (error) {
    console.error('Failed to import node-fetch:', error);
  }
})();

// Function to run all tests after fetch is properly set up
function runTests() {
  // Try to get environment variables from different possible locations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 Checking Supabase environment variables...');
  console.log(`URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
  console.log(`Anon Key: ${supabaseAnonKey ? '✅ Found' : '❌ Missing'}`);
  console.log(`Service Role Key: ${supabaseServiceKey ? '✅ Found' : '❌ Missing'}`);

  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is required');
    process.exit(1);
  }

  // Test client connection (anon key)
  if (supabaseAnonKey) {
    console.log('\n🔄 Testing client connection with anon key...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Client connection failed:', error.message);
        } else {
          console.log('✅ Client connection successful!');
        }
      })
      .catch(err => {
        console.error('❌ Client connection error:', err.message);
      });
  }

  // Test admin connection (service role key)
  if (supabaseServiceKey) {
    console.log('\n🔄 Testing admin connection with service role key...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    supabaseAdmin.from('users').select('count').limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Admin connection failed:', error.message);
        } else {
          console.log('✅ Admin connection successful!');
          console.log('📊 Sample data:', data);
        }
      })
      .catch(err => {
        console.error('❌ Admin connection error:', err.message);
      });
  }
}