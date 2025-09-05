#!/usr/bin/env node

// Script to create an admin user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAdminUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.log('Usage: node scripts/create-admin.js <email> <password>');
    console.log('Example: node scripts/create-admin.js admin@example.com password123');
    process.exit(1);
  }

  try {
    console.log('🔧 Creating admin user...');
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (authError) {
      console.error('❌ Failed to create auth user:', authError.message);
      return;
    }
    
    console.log('✅ Auth user created:', authData.user.id);
    
    // Create/update user profile with admin role
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: email,
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Failed to create user profile:', profileError.message);
      return;
    }
    
    console.log('✅ Admin user profile created/updated');
    console.log('📧 Email:', email);
    console.log('🔑 Role:', profileData.role);
    console.log('✨ Status:', profileData.status);
    console.log('');
    console.log('🎉 Admin user created successfully!');
    console.log('You can now login at: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

createAdminUser();