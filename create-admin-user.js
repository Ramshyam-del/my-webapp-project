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

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Admin credentials (change these!)
    const adminEmail = 'admin@quantex.com';
    const adminPassword = 'Admin123!@#';
    
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('');
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === adminEmail);
    
    if (existingUser) {
      console.log('⚠️  Admin user already exists, updating password...');
      
      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: adminPassword }
      );
      
      if (updateError) {
        console.error('❌ Failed to update admin password:', updateError.message);
        return;
      }
      
      console.log('✅ Admin password updated successfully');
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      });
      
      if (createError) {
        console.error('❌ Failed to create admin user:', createError.message);
        return;
      }
      
      console.log('✅ Admin user created successfully');
    }
    
    // Ensure user exists in public.users table with admin role
    const { data: { user } } = await supabase.auth.admin.listUsers();
    const adminUser = user.find(u => u.email === adminEmail);
    
    if (adminUser) {
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: adminUser.id,
          email: adminEmail,
          role: 'admin',
          status: 'active',
          balance: 10000.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (upsertError) {
        console.error('❌ Failed to update user profile:', upsertError.message);
        return;
      }
      
      console.log('✅ Admin user profile updated successfully');
    }
    
    console.log('');
    console.log('🎉 Admin user setup complete!');
    console.log('');
    console.log('📋 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('🌐 Access your admin panel at: http://localhost:3000/admin');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

// Run the script
createAdminUser();
