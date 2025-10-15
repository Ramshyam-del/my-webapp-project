// Script to get the current frontend user
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Supabase environment variables not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getFrontendUser() {
  try {
    console.log('🔍 Getting frontend user...');
    
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
    
    console.log('✅ Current frontend user ID:', user.id);
    console.log('✅ Current frontend user email:', user.email);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

getFrontendUser();