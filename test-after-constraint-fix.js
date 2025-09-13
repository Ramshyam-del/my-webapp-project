const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAfterConstraintFix() {
  try {
    console.log('🧪 Testing withdrawal approval after constraint fix...');
    
    // Test updating a withdrawal to approved status
    console.log('\n1. Testing approved status update...');
    
    // Create a test withdrawal first
    const testWithdrawal = {
      user_id: '4f1e3fc9-5e18-46b6-bb53-a8dbf0da906d', // Use existing user
      currency: 'USDT',
      amount: 1,
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      status: 'pending'
    };
    
    const { data: withdrawal, error: createError } = await supabase
      .from('withdrawals')
      .insert(testWithdrawal)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating test withdrawal:', createError.message);
      return;
    }
    
    console.log('✅ Test withdrawal created:', withdrawal.id.slice(0, 8));
    
    // Try to update to approved status
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        admin_notes: 'Test approval after constraint fix',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawal.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Error updating to approved status:', updateError.message);
      console.log('❌ This means the constraint fix hasn\'t been applied yet');
    } else {
      console.log('✅ Successfully updated to approved status!');
      console.log('✅ Constraint fix is working correctly');
    }
    
    // Clean up
    await supabase.from('withdrawals').delete().eq('id', withdrawal.id);
    console.log('✅ Test withdrawal cleaned up');
    
    // Test all valid status values
    console.log('\n2. Testing all valid status values...');
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'failed'];
    
    for (const status of validStatuses) {
      const testData = {
        user_id: '4f1e3fc9-5e18-46b6-bb53-a8dbf0da906d',
        currency: 'USDT',
        amount: 1,
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        status: status
      };
      
      const { data, error } = await supabase
        .from('withdrawals')
        .insert(testData)
        .select('id, status')
        .single();
      
      if (error) {
        console.log(`❌ Status '${status}' failed:`, error.message);
      } else {
        console.log(`✅ Status '${status}' works correctly`);
        // Clean up
        await supabase.from('withdrawals').delete().eq('id', data.id);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAfterConstraintFix();