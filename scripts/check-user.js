#!/usr/bin/env node

// Script to check and update user role
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAndUpdateUser() {
  const email = 'ramshyamgopalhari@gmail.com';
  
  try {
    console.log('🔍 Checking user:', email);
    
    // First check if user exists in auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Failed to list auth users:', authError.message);
      return;
    }
    
    const authUser = authUsers.users.find(u => u.email === email);
    
    if (!authUser) {
      console.log('❌ User not found in auth system');
      return;
    }
    
    console.log('✅ User found in auth:', authUser.id);
    
    // Check user profile in database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('email', email)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Failed to query user profile:', profileError.message);
      return;
    }
    
    if (!profile) {
      console.log('⚠️ User profile not found in database, creating...');
      
      // Create user profile with admin role
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: email,
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create user profile:', createError.message);
        return;
      }
      
      console.log('✅ User profile created with admin role');
      console.log('📧 Email:', newProfile.email);
      console.log('🔑 Role:', newProfile.role);
      console.log('✨ Status:', newProfile.status);
    } else {
      console.log('✅ User profile found');
      console.log('📧 Email:', profile.email);
      console.log('🔑 Current Role:', profile.role);
      console.log('✨ Status:', profile.status);
      
      if (profile.role !== 'admin') {
        console.log('⚠️ Updating role to admin...');
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        
        if (updateError) {
          console.error('❌ Failed to update role:', updateError.message);
          return;
        }
        
        console.log('✅ Role updated to admin');
      }
    }
    
    console.log('');
    console.log('🎉 User is ready for admin login!');
    console.log('Login at: http://localhost:3000/admin/login');
    console.log('Email: ramshyamgopalhari@gmail.com');
    console.log('Password: @Million2026');
    
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
  }
}

checkAndUpdateUser();