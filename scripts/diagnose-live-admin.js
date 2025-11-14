require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const ADMIN_EMAIL = 'ramshyamgopalhari@gmail.com';

async function diagnoseAdminAccess() {
  console.log('🔍 Diagnosing Admin Access Issue...\n');
  
  // Check environment variables
  console.log('📋 STEP 1: Checking Environment Variables');
  console.log('═'.repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ CRITICAL: Supabase credentials not configured!');
    console.log('\n📝 ACTION REQUIRED:');
    console.log('1. Create .env file in project root with:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('\n2. For live server, set these as environment variables');
    return;
  }
  
  console.log('\n📋 STEP 2: Testing Database Connection');
  console.log('═'.repeat(50));
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
    
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
      console.log('\n📝 POSSIBLE CAUSES:');
      console.log('1. Invalid Supabase URL or keys');
      console.log('2. Network/firewall blocking connection');
      console.log('3. Supabase project paused or deleted');
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check if admin user exists
    console.log('\n📋 STEP 3: Checking Admin User');
    console.log('═'.repeat(50));
    
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('email', ADMIN_EMAIL)
      .single();
    
    if (userError || !adminUser) {
      console.log('❌ Admin user not found in database!');
      console.log('\n📝 ACTION REQUIRED:');
      console.log('Run this command to create admin user:');
      console.log(`node scripts/create-admin-user.js ${ADMIN_EMAIL} "@Million2026"`);
      return;
    }
    
    console.log('✅ Admin user found:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   Status:', adminUser.status);
    
    if (adminUser.role !== 'admin') {
      console.log('\n❌ User exists but is not an admin!');
      console.log('\n📝 ACTION REQUIRED:');
      console.log('Run this SQL in Supabase dashboard:');
      console.log(`UPDATE users SET role = 'admin' WHERE email = '${ADMIN_EMAIL}';`);
      return;
    }
    
    // Check Supabase Auth
    console.log('\n📋 STEP 4: Checking Supabase Auth');
    console.log('═'.repeat(50));
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️  Cannot list auth users (requires service role key)');
    } else {
      const authUser = authUsers.users.find(u => u.email === ADMIN_EMAIL);
      if (authUser) {
        console.log('✅ User exists in Supabase Auth');
        console.log('   Email confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
      } else {
        console.log('❌ User not found in Supabase Auth!');
        console.log('\n📝 ACTION REQUIRED:');
        console.log('The user exists in the database but not in Supabase Auth.');
        console.log('This can happen if the user was created manually.');
        console.log('Run: node scripts/create-admin-user.js to recreate properly.');
      }
    }
    
    // Check backend configuration
    console.log('\n📋 STEP 5: Backend Configuration Check');
    console.log('═'.repeat(50));
    
    console.log('\n📝 FOR LIVE SERVER - Ensure these are set:');
    console.log('1. Environment Variables:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    console.log('   - BACKEND_API_KEY (for /api/admin/* routes)');
    console.log('\n2. Backend must be running and accessible');
    console.log('   - Check: curl https://your-domain.com/api/admin/health');
    console.log('\n3. CORS must allow your frontend domain');
    console.log('   - Update backend/server.js cors config');
    
    console.log('\n📋 STEP 6: Testing Login Flow');
    console.log('═'.repeat(50));
    
    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: '@Million2026'
    });
    
    if (signInError) {
      console.log('❌ Login failed:', signInError.message);
      console.log('\n📝 POSSIBLE CAUSES:');
      console.log('1. Wrong password');
      console.log('2. Email not confirmed');
      console.log('3. User disabled in Supabase');
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('   Access token:', signInData.session.access_token.substring(0, 20) + '...');
    
    // Test /api/admin/me endpoint
    console.log('\n📋 STEP 7: Testing Admin API');
    console.log('═'.repeat(50));
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4001';
    console.log('Testing:', `${backendUrl}/api/admin/me`);
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/me`, {
        headers: {
          'Authorization': `Bearer ${signInData.session.access_token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.ok) {
        console.log('✅ Admin API working correctly!');
        console.log('   User:', result.user.email, '| Role:', result.user.role);
      } else {
        console.log('❌ Admin API returned error:', result);
      }
    } catch (fetchError) {
      console.log('❌ Failed to connect to backend:', fetchError.message);
      console.log('\n📝 ACTION REQUIRED:');
      console.log('1. Ensure backend is running');
      console.log('2. Check BACKEND_URL environment variable');
      console.log('3. Verify network connectivity');
    }
    
    // Sign out
    await supabase.auth.signOut();
    
    console.log('\n' + '═'.repeat(50));
    console.log('✅ DIAGNOSIS COMPLETE');
    console.log('═'.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Run diagnosis
diagnoseAdminAccess().catch(console.error);
