const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(
  'https://ishprhrmvubfzohvqqxz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHByaHJtdnViZnpvaHZxcXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjQyNzQsImV4cCI6MjA2OTcwMDI3NH0.2K80tAGXm2ElODR8_3OawJigieVY6cw77o2NVgUgh9U'
);

async function testSupabaseAuth() {
  console.log('🧪 Testing Supabase authentication and notifications...');
  
  try {
    // Test login with testuser@example.com
    console.log('\n1. Attempting Supabase login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'TestUser123!'
    });
    
    if (authError) {
      console.log('❌ Supabase login failed:', authError.message);
      return;
    }
    
    console.log('✅ Supabase login successful');
    console.log('👤 User ID:', authData.user.id);
    console.log('🔑 Access Token:', authData.session.access_token.substring(0, 50) + '...');
    
    // Test frontend API with Supabase token
    console.log('\n2. Testing frontend API with Supabase token...');
    const response = await fetch('http://localhost:3000/api/notifications?limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    const responseData = await response.json();
    console.log('Response:', JSON.stringify(responseData, null, 2));
    
    if (responseData.success) {
      console.log('\n✅ Frontend API working correctly!');
      console.log('📊 Found', responseData.data.notifications.length, 'notifications');
      console.log('🔔 Unread count:', responseData.data.unreadCount);
      
      if (responseData.data.notifications.length > 0) {
        console.log('\n📋 Notifications:');
        responseData.data.notifications.forEach((notif, index) => {
          console.log(`  ${index + 1}. ${notif.title} - ${notif.message} (${notif.is_read ? 'Read' : 'Unread'})`);
        });
      }
    } else {
      console.log('❌ Frontend API failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSupabaseAuth();