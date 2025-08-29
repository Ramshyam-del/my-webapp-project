const { createClient } = require('@supabase/supabase-js');

let supabaseAdmin = null;
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[SupabaseAdmin] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — routes will 500 until set.');
} else {
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

module.exports = { supabaseAdmin };
