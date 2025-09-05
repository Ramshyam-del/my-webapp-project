// Script to reset user password for testing
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetUserPassword() {
  try {
    const email = 'rejindhungana@gmail.com';
    const newPassword = 'TestPassword123!';
    
    console.log(`🔧 Resetting password for ${email}...`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in users table
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('email', email)
      .select();
    
    if (error) {
      console.error('Error updating password:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Password updated successfully in users table');
      console.log('User ID:', data[0].id);
      console.log('Email:', data[0].email);
      console.log('Username:', data[0].username);
    } else {
      console.log('❌ User not found');
      return;
    }
    
    // Also update in Supabase Auth if the user exists there
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
        data[0].id,
        { password: newPassword }
      );
      
      if (authError) {
        console.log('Note: Could not update Supabase Auth password:', authError.message);
        console.log('This is normal if the user was created directly in the database');
      } else {
        console.log('✅ Password also updated in Supabase Auth');
      }
    } catch (authUpdateError) {
      console.log('Note: Supabase Auth update failed:', authUpdateError.message);
    }
    
    console.log(`\n🎯 Password reset complete!`);
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);
    console.log(`\nYou can now test login with these credentials.`);
    
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
  }
}

// Run the password reset
resetUserPassword();