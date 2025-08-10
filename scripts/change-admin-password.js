#!/usr/bin/env node

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const NEW_PASSWORD = process.argv[2];
if (!NEW_PASSWORD) {
  console.error('Usage: node scripts/change-admin-password.js <new_password>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

(async () => {
  try {
    console.log('🔐 Changing admin password...');

    // Find admin user in auth
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let adminUser = list?.users?.find(u => u.email === ADMIN_EMAIL);

    if (!adminUser) {
      console.log('⚠️ Admin auth user not found, creating...');
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: NEW_PASSWORD,
        email_confirm: true
      });
      if (createErr) {
        console.error('Create admin user failed:', createErr.message);
        process.exit(1);
      }
      adminUser = created.user;
      console.log('✅ Admin auth user created:', adminUser.id);
    } else {
      const { error: updErr } = await supabase.auth.admin.updateUserById(adminUser.id, {
        password: NEW_PASSWORD
      });
      if (updErr) {
        console.error('Update password failed:', updErr.message);
        process.exit(1);
      }
      console.log('✅ Admin password updated');
    }

    // Ensure row in public.users with admin role
    const { error: upsertErr } = await supabase
      .from('users')
      .upsert({ id: adminUser.id, email: ADMIN_EMAIL, role: 'admin', balance: 10000, status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (upsertErr) {
      console.error('Upsert admin row failed:', upsertErr.message);
      process.exit(1);
    }
    console.log('✅ Admin row ensured in users table');

    console.log('🎉 Done. You can log in with:', ADMIN_EMAIL);
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();
