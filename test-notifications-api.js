const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testNotificationsAPI() {
  try {
    console.log('🔍 Testing Notifications API...');
    
    // Step 1: Login as testuser@example.com
    console.log('\n1️⃣ Logging in as testuser@example.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    if (authError) {
      throw new Error(`Login failed: ${authError.message}`);
    }
    
    console.log('✅ Login successful');
    console.log('🔑 User ID:', authData.user.id);
    console.log('🎫 Access Token:', authData.session.access_token.substring(0, 20) + '...');
    
    // Step 2: Test the frontend notifications API
    console.log('\n2️⃣ Testing frontend notifications API...');
    const response = await fetch('http://localhost:3000/api/notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        console.log(`\n🔔 Total notifications: ${data.data.notifications?.length || 0}`);
        console.log(`📬 Unread count: ${data.data.unreadCount || 0}`);
        
        // Show recent notifications
        if (data.data.notifications && data.data.notifications.length > 0) {
          console.log('\n📝 Recent notifications:');
          data.data.notifications.slice(0, 3).forEach((notif, index) => {
            console.log(`   ${index + 1}. [${notif.category}] ${notif.title}`);
            console.log(`      ${notif.message}`);
            console.log(`      Created: ${notif.created_at}`);
            console.log(`      Read: ${notif.is_read}`);
            console.log('');
          });
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed');
      console.log('📄 Error response:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('📋 Full error:', error);
  }
}

// Run the test
testNotificationsAPI();
