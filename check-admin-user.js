const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUser() {
  try {
    console.log('🔍 Checking admin user...');
    
    const adminEmail = 'admin@quantex.com';
    
    // First, check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }
    
    const adminAuthUser = authUsers.users.find(u => u.email === adminEmail);
    if (!adminAuthUser) {
      console.error('❌ Admin user not found in auth.users');
      console.log('Please create the admin user in Supabase dashboard first');
      return;
    }
    
    console.log('✅ Admin user found in auth.users');
    console.log(`   ID: ${adminAuthUser.id}`);
    console.log(`   Email: ${adminAuthUser.email}`);
    console.log(`   Created: ${adminAuthUser.created_at}`);
    
    // Check if user exists in public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', adminAuthUser.id)
      .single();
    
    if (publicError && publicError.code !== 'PGRST116') {
      console.error('❌ Error checking public.users:', publicError.message);
      return;
    }
    
    if (!publicUser) {
      console.log('⚠️  Admin user not found in public.users, creating profile...');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: adminAuthUser.id,
          email: adminEmail,
          role: 'admin',
          status: 'active',
          balance: 10000.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Error creating user profile:', insertError.message);
        return;
      }
      
      console.log('✅ Admin user profile created successfully');
    } else {
      console.log('✅ Admin user found in public.users');
      console.log(`   Role: ${publicUser.role}`);
      console.log(`   Status: ${publicUser.status}`);
      
      // Check if role is admin
      if (publicUser.role !== 'admin') {
        console.log('⚠️  User role is not admin, updating...');
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', adminAuthUser.id);
        
        if (updateError) {
          console.error('❌ Error updating user role:', updateError.message);
          return;
        }
        
        console.log('✅ User role updated to admin');
      }
    }
    
    console.log('');
    console.log('🎉 Admin user setup complete!');
    console.log('');
    console.log('📋 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: Admin123!@#`);
    console.log('');
    console.log('🌐 Access your admin panel at: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error.message);
  }
}

// Run the script
checkAdminUser();
