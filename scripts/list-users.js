// Test script to list users in the database
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

async function listUsers() {
  console.log('Listing users in the database...');
  
  try {
    const { data: users, error } = await serverSupabase
      .from('users')
      .select('id, email, role')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Query failed:', error);
      return;
    }
    
    console.log('✅ Found', users.length, 'users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Role: ${user.role}`);
      console.log('---');
    });
  } catch (error) {
    console.log('❌ List users failed:', error);
  }
}

listUsers();