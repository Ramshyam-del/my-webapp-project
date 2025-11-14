require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ramshyamgopalhari@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@Million2026';

async function createAdminOnLiveServer() {
  console.log('🚀 Creating Admin User on Live Server...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    console.error('Required:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nFor live server, add these to your hosting platform environment variables.');
    process.exit(1);
  }
  
  console.log('Using Supabase URL:', supabaseUrl);
  console.log('Admin Email:', ADMIN_EMAIL);
  console.log('');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Step 1: Check if user already exists in Auth
    console.log('📋 Step 1: Checking Supabase Auth...');
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === ADMIN_EMAIL);
    
    let authUserId;
    
    if (existingAuthUser) {
      console.log('✅ User already exists in Auth:', existingAuthUser.id);
      authUserId = existingAuthUser.id;
      
      // Update password if needed
      console.log('🔄 Updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUserId,
        { password: ADMIN_PASSWORD }
      );
      
      if (updateError) {
        console.error('⚠️  Failed to update password:', updateError.message);
      } else {
        console.log('✅ Password updated');
      }
    } else {
      console.log('Creating new user in Auth...');
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true
      });
      
      if (createAuthError) {
        console.error('❌ Failed to create auth user:', createAuthError.message);
        throw createAuthError;
      }
      
      console.log('✅ Auth user created:', newAuthUser.user.id);
      authUserId = newAuthUser.user.id;
    }
    
    // Step 2: Check if user exists in users table
    console.log('\n📋 Step 2: Checking users table...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('⚠️  Error checking user:', checkError.message);
    }
    
    if (existingUser) {
      console.log('✅ User exists in database');
      
      // Update to ensure admin role
      if (existingUser.role !== 'admin') {
        console.log('🔄 Updating user role to admin...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin', status: 'active' })
          .eq('id', authUserId);
        
        if (updateError) {
          console.error('❌ Failed to update role:', updateError.message);
        } else {
          console.log('✅ Role updated to admin');
        }
      } else {
        console.log('✅ User already has admin role');
      }
    } else {
      console.log('Creating user in database...');
      
      // Hash password for database (in case it's used)
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: ADMIN_EMAIL,
          password_hash: hashedPassword,
          role: 'admin',
          status: 'active'
        });
      
      if (insertError) {
        console.error('❌ Failed to create user in database:', insertError.message);
        throw insertError;
      }
      
      console.log('✅ User created in database');
    }
    
    // Step 3: Verify everything
    console.log('\n📋 Step 3: Verification...');
    
    const { data: finalUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', authUserId)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Admin user verified:');
      console.log('   ID:', finalUser.id);
      console.log('   Email:', finalUser.email);
      console.log('   Role:', finalUser.role);
      console.log('   Status:', finalUser.status);
    }
    
    // Step 4: Test login
    console.log('\n📋 Step 4: Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (loginError) {
      console.error('❌ Login test failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log('   Access Token:', loginData.session.access_token.substring(0, 30) + '...');
      await supabase.auth.signOut();
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ADMIN SETUP COMPLETE');
    console.log('='.repeat(60));
    console.log('\nYou can now log in with:');
    console.log('  Email:', ADMIN_EMAIL);
    console.log('  Password:', ADMIN_PASSWORD);
    console.log('\n⚠️  IMPORTANT: For live server, ensure these environment variables are set:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    console.log('  - BACKEND_API_KEY');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the script
createAdminOnLiveServer();
