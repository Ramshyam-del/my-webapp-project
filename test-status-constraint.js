const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStatusConstraint() {
  try {
    console.log('🧪 Testing withdrawal status constraint...');
    
    // First, let's see what status values exist in the table
    console.log('\n1. Checking existing status values...');
    const { data: existingStatuses, error: statusError } = await supabase
      .from('withdrawals')
      .select('status')
      .limit(10);
    
    if (statusError) {
      console.log('❌ Error getting statuses:', statusError.message);
      return;
    }
    
    const uniqueStatuses = [...new Set(existingStatuses.map(w => w.status))];
    console.log('✅ Existing status values:', uniqueStatuses);
    
    // Test creating a withdrawal with 'approved' status
    console.log('\n2. Testing direct insert with approved status...');
    const testWithdrawal = {
      user_id: '4f1e3fc9-8b2a-4c1d-9e3f-1a2b3c4d5e6f', // Use a valid UUID format
      currency: 'USDT',
      amount: 5,
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      network: 'TRC20',
      status: 'approved' // This should be valid according to schema
    };
    
    const { data: withdrawal, error: createError } = await supabase
      .from('withdrawals')
      .insert(testWithdrawal)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating withdrawal with approved status:', createError.message);
      console.log('❌ Full error:', createError);
      
      // Try with pending status instead
      console.log('\n3. Testing with pending status...');
      const pendingWithdrawal = { ...testWithdrawal, status: 'pending' };
      
      const { data: pendingResult, error: pendingError } = await supabase
        .from('withdrawals')
        .insert(pendingWithdrawal)
        .select()
        .single();
      
      if (pendingError) {
        console.log('❌ Error with pending status too:', pendingError.message);
        return;
      }
      
      console.log('✅ Pending withdrawal created:', pendingResult.id.slice(0, 8));
      
      // Now try to update it to approved
      console.log('\n4. Testing status update to approved...');
      const { data: updatedWithdrawal, error: updateError } = await supabase
        .from('withdrawals')
        .update({ status: 'approved' })
        .eq('id', pendingResult.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Error updating to approved:', updateError.message);
        console.log('❌ Full update error:', updateError);
      } else {
        console.log('✅ Successfully updated to approved status');
      }
      
      // Clean up
      await supabase.from('withdrawals').delete().eq('id', pendingResult.id);
      
    } else {
      console.log('✅ Successfully created withdrawal with approved status:', withdrawal.id.slice(0, 8));
      
      // Clean up
      await supabase.from('withdrawals').delete().eq('id', withdrawal.id);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testStatusConstraint();