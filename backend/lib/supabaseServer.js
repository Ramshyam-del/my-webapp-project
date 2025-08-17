require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log warnings but don't crash if env vars are missing
if (!supabaseUrl) {
  console.warn('⚠️  Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.warn('⚠️  Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Create client only if we have the required env vars
let serverSupabase = null;
let supabaseAdmin = null;

if (supabaseUrl && supabaseServiceKey) {
  serverSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { 
      autoRefreshToken: false, 
      persistSession: false 
    },
  });
  
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { 
      autoRefreshToken: false, 
      persistSession: false 
    },
  });
}

module.exports = { serverSupabase, supabaseAdmin };


