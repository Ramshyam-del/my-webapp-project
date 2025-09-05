const { serverSupabase } = require('../lib/supabaseServer');

async function testActivitiesAPI() {
  try {
    console.log('Testing user activities API...');
    
    // Test 1: Check if table exists by trying to select from it
    console.log('\n1. Testing table existence...');
    const { data: tableTest, error: tableError } = await serverSupabase
      .from('user_activities')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table does not exist or has issues:', tableError.message);
      
      // Try to create table directly
      console.log('\n2. Attempting to create table manually...');
      const { error: createError } = await serverSupabase
        .from('user_activities')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          user_email: 'test@example.com',
          activity_type: 'test_creation',
          activity_description: 'Testing table creation',
          ip_address: '127.0.0.1',
          user_agent: 'Test Agent'
        });
      
      if (createError) {
        console.log('❌ Cannot create table:', createError.message);
        return false;
      }
    } else {
      console.log('✅ Table exists and is accessible');
    }
    
    // Test 2: Insert a test activity
    console.log('\n3. Testing activity insertion...');
    const testActivity = {
      user_id: '00000000-0000-0000-0000-000000000000',
      user_email: 'test@example.com',
      activity_type: 'api_test',
      activity_description: 'API test activity',
      ip_address: '127.0.0.1',
      user_agent: 'Test Agent',
      metadata: { test: true, timestamp: new Date().toISOString() }
    };
    
    const { data: insertData, error: insertError } = await serverSupabase
      .from('user_activities')
      .insert(testActivity)
      .select();
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      return false;
    } else {
      console.log('✅ Insert successful:', insertData[0]?.id);
    }
    
    // Test 3: Query activities
    console.log('\n4. Testing activity querying...');
    const { data: queryData, error: queryError } = await serverSupabase
      .from('user_activities')
      .select('*')
      .eq('activity_type', 'api_test')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (queryError) {
      console.log('❌ Query failed:', queryError.message);
      return false;
    } else {
      console.log('✅ Query successful, found', queryData.length, 'activities');
    }
    
    // Test 4: Clean up test data
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await serverSupabase
      .from('user_activities')
      .delete()
      .in('activity_type', ['api_test', 'test_creation', 'test']);
    
    if (deleteError) {
      console.log('⚠️ Cleanup warning:', deleteError.message);
    } else {
      console.log('✅ Cleanup successful');
    }
    
    console.log('\n🎉 All API tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Test the activity logger utility
async function testActivityLogger() {
  try {
    console.log('\n\n=== Testing Activity Logger Utility ===');
    
    const { logUserActivity } = require('../utils/activityLogger');
    
    const testUser = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'logger-test@example.com'
    };
    
    const mockReq = {
      ip: '192.168.1.1',
      headers: {
        'user-agent': 'Mozilla/5.0 Test Browser'
      }
    };
    
    console.log('Testing logUserActivity function...');
    const success = await logUserActivity({
      user_id: testUser.id,
      user_email: testUser.email,
      activity_type: 'utility_test',
      activity_description: 'Testing activity logger utility',
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0 Test Browser',
      metadata: { source: 'utility_test' }
    });
    
    if (success) {
      console.log('✅ Activity logger utility works!');
      
      // Verify the log was created
      const { data: verifyData } = await serverSupabase
        .from('user_activities')
        .select('*')
        .eq('activity_type', 'utility_test')
        .limit(1);
      
      if (verifyData && verifyData.length > 0) {
        console.log('✅ Activity log verified in database');
        
        // Clean up
        await serverSupabase
          .from('user_activities')
          .delete()
          .eq('activity_type', 'utility_test');
        
        console.log('✅ Utility test cleanup completed');
      }
    } else {
      console.log('❌ Activity logger utility failed');
    }
    
  } catch (error) {
    console.error('❌ Activity logger test error:', error);
  }
}

if (require.main === module) {
  testActivitiesAPI()
    .then((success) => {
      if (success) {
        return testActivityLogger();
      } else {
        console.log('\n❌ Basic API tests failed, skipping utility tests');
      }
    })
    .then(() => {
      console.log('\n✅ All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testActivitiesAPI, testActivityLogger };