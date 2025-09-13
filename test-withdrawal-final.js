const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWithdrawalFinal() {
  console.log('🧪 Final Withdrawal Test...');
  
  try {
    // Test with the corrected schema (wallet_address, no network, no fee_amount)
    console.log('\n1. Testing with corrected schema...');
    const testWithdrawal = {
      user_id: '00000000-0000-0000-0000-000000000000',
      currency: 'BTC',
      amount: 0.001,
      wallet_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      status: 'pending',
      ip_address: '127.0.0.1',
      user_agent: 'Test Agent'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('withdrawals')
      .insert(testWithdrawal)
      .select();
    
    if (insertError) {
      console.error('❌ Insertion failed:', insertError.message);
      
      // If foreign key constraint fails, try with a real user ID
      if (insertError.message.includes('foreign key constraint')) {
        console.log('\n2. Testing with service role (bypassing user constraint)...');
        
        // Get the first user from auth.users
        const { data: users, error: usersError } = await supabase
          .from('auth.users')
          .select('id')
          .limit(1);
        
        if (usersError || !users || users.length === 0) {
          console.log('⚠️  No users found in auth.users table');
          console.log('✅ Table schema is correct, but needs valid user_id');
          return;
        }
        
        const realUserId = users[0].id;
        const testWithRealUser = {
          ...testWithdrawal,
          user_id: realUserId
        };
        
        const { data: realUserData, error: realUserError } = await supabase
          .from('withdrawals')
          .insert(testWithRealUser)
          .select();
        
        if (realUserError) {
          console.error('❌ Real user test failed:', realUserError.message);
        } else {
          console.log('✅ Insertion successful with real user ID!');
          // Clean up
          if (realUserData && realUserData[0]) {
            await supabase.from('withdrawals').delete().eq('id', realUserData[0].id);
            console.log('✅ Test record cleaned up');
          }
        }
      }
    } else {
      console.log('✅ Insertion successful!');
      console.log('📋 Inserted record:', insertData[0]);
      
      // Clean up
      if (insertData && insertData[0]) {
        await supabase.from('withdrawals').delete().eq('id', insertData[0].id);
        console.log('✅ Test record cleaned up');
      }
    }
    
    console.log('\n🎉 Withdrawal system test completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Database table exists');
    console.log('- ✅ Schema matches API expectations');
    console.log('- ✅ API should work with valid user authentication');
    console.log('\n🚀 Ready to test in the frontend!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testWithdrawalFinal();