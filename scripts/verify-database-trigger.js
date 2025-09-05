const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDatabaseTrigger() {
  console.log('🔍 Verifying database trigger and user table structure...');
  
  try {
    // Check if the trigger function exists
    console.log('\n1. Checking trigger function...');
    const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT routine_name, routine_definition 
        FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public';
      `
    });
    
    if (funcError) {
      console.log('❌ Cannot check functions directly. Let\'s try alternative method.');
    } else {
      console.log('✅ Function check result:', functions);
    }

    // Check if the trigger exists
    console.log('\n2. Checking trigger...');
    const { data: triggers, error: trigError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT trigger_name, event_manipulation, action_statement 
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created';
      `
    });
    
    if (trigError) {
      console.log('❌ Cannot check triggers directly. Let\'s try alternative method.');
    } else {
      console.log('✅ Trigger check result:', triggers);
    }

    // Check users table structure
    console.log('\n3. Checking users table structure...');
    const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (colError) {
      console.log('❌ Cannot check table structure directly.');
      console.log('Let\'s try a simple query to test the users table...');
      
      // Try a simple select to see what columns exist
      const { data: sampleUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
        
      if (selectError) {
        console.log('❌ Error querying users table:', selectError.message);
      } else {
        console.log('✅ Users table sample structure:');
        if (sampleUser && sampleUser.length > 0) {
          console.log('Available columns:', Object.keys(sampleUser[0]));
        } else {
          console.log('No users found, but table exists.');
        }
      }
    } else {
      console.log('✅ Users table columns:', columns);
    }

    // Test if we can create a user with metadata
    console.log('\n4. Testing user creation with metadata...');
    console.log('Note: This is just a simulation - we won\'t actually create a user.');
    console.log('When a user registers with username, first_name, last_name, and phone,');
    console.log('the trigger should automatically save these to the users table.');
    
    console.log('\n✅ Verification complete!');
    console.log('\nNext steps:');
    console.log('1. Try registering a new user with username, first name, and last name');
    console.log('2. Check if the data appears in the users table');
    console.log('3. Verify the portfolio page displays the username correctly');
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

verifyDatabaseTrigger();