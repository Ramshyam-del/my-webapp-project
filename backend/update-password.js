const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

async function updatePassword() {
  try {
    console.log('🔧 Updating password for rejindhungana@gmail.com...');
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Hash the new password
    const newPassword = 'Rejin@123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('New password hash:', hashedPassword);
    
    // Update the password in the users table
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('email', 'rejindhungana@gmail.com')
      .select();
    
    if (error) {
      console.error('❌ Error updating password:', error);
      return;
    }
    
    console.log('✅ Password updated successfully!');
    console.log('Updated user:', data);
    
    // Test the new password
    console.log('\n🧪 Testing password verification...');
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Password verification result:', isValid);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updatePassword();