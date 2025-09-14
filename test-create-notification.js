const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreateNotification() {
  console.log('🧪 Testing notification creation...');
  
  try {
    // First, let's check if the table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('notifications')
      .select('count', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('❌ Table check failed:', tableError.message);
      console.log('\n📋 Please run the SQL from the previous output in your Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Notifications table exists');
    
    // Get a test user (first user in auth.users)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError || !users.users.length) {
      console.log('⚠️  No users found. Creating a test notification for a dummy user ID...');
      
      // Create a test notification with a dummy UUID
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          title: 'Test Notification',
          message: 'This is a test notification to verify the system is working.',
          type: 'info',
          category: 'system'
        })
        .select();
      
      if (error) {
        console.error('❌ Failed to create test notification:', error.message);
      } else {
        console.log('✅ Test notification created:', data[0]);
      }
    } else {
      const testUser = users.users[0];
      console.log(`📧 Creating notification for user: ${testUser.email}`);
      
      // Create a test notification
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: testUser.id,
          title: 'Welcome Notification',
          message: 'Welcome to the exchange platform! Your account is ready to use.',
          type: 'success',
          category: 'welcome'
        })
        .select();
      
      if (error) {
        console.error('❌ Failed to create notification:', error.message);
      } else {
        console.log('✅ Notification created successfully:', data[0]);
        
        // Test fetching notifications
        const { data: fetchedNotifications, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', testUser.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (fetchError) {
          console.error('❌ Failed to fetch notifications:', fetchError.message);
        } else {
          console.log('✅ Fetched notifications:', fetchedNotifications.length, 'notifications');
          fetchedNotifications.forEach(notif => {
            console.log(`  - ${notif.title}: ${notif.message}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCreateNotification();