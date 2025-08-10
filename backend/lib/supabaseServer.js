require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase server env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

module.exports = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


