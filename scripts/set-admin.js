#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { serverSupabase } = require('../backend/lib/supabaseServer');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in env');
  process.exit(1);
}

if (!serverSupabase) {
  console.error('Supabase client not initialized - check environment variables');
  process.exit(1);
}

(async () => {
  try {
    const { data: list, error: listErr } = await serverSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;
    let admin = list?.users?.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

    if (!admin) {
      const { data: created, error: createErr } = await serverSupabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true
      });
      if (createErr) throw createErr;
      admin = created.user;
      console.log('Admin auth user created');
    } else {
      const { error: updErr } = await serverSupabase.auth.admin.updateUserById(admin.id, { password: ADMIN_PASSWORD });
      if (updErr) throw updErr;
      console.log('Admin password updated');
    }

    const { error: upsertErr } = await serverSupabase
      .from('users')
      .upsert({ id: admin.id, email: ADMIN_EMAIL.toLowerCase(), role: 'admin', status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;

    console.log('OK: Admin ensured in users table');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();


