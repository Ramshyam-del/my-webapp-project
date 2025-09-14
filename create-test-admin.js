require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { createClient } = require('@supabase/supabase-js');

async function createTestAdmin() {
  try {
    console.log('🔧 Creating test admin user...');
    
    // First, try to register a new admin user via backend API
    const registerResponse = await fetch('http://localhost:4001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testadmin@example.com',
        password: 'TestAdmin123!',
        firstName: 'Test',
        lastName: 'Admin',
        username: 'testadmin',
        phone: '1234567890'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register response:', {
      status: registerResponse.status,
      ok: registerData.ok,
      message: registerData.message || 'Success'
    });
    
    if (registerData.ok) {
      console.log('✅ User registered successfully');
      
      // Now update the user role to admin using direct database access
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', 'testadmin@example.com');
      
      if (updateError) {
        console.error('❌ Failed to update user role:', updateError);
      } else {
        console.log('✅ User role updated to admin');
      }
      
      // Test login with new admin
      console.log('\n🧪 Testing login with new admin...');
      const loginResponse = await fetch('http://localhost:4001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testadmin@example.com',
          password: 'TestAdmin123!'
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('Login test:', {
        status: loginResponse.status,
        ok: loginData.ok,
        message: loginData.message || 'Success'
      });
      
      if (loginData.ok) {
        console.log('✅ Test admin login successful!');
        console.log('🎯 Use these credentials for testing:');
        console.log('   Email: testadmin@example.com');
        console.log('   Password: TestAdmin123!');
      }
    } else {
      console.log('❌ Registration failed:', registerData.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestAdmin();