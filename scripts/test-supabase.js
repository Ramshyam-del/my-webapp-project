#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await sb.from('users').select('id, email, role').limit(1);
  if (error) { console.error('Supabase error:', error.message); process.exit(1); }
  console.log('OK: Supabase reachable. Sample:', data);
  process.exit(0);
})();


