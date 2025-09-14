require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testApproval() {
  try {
    console.log('Testing withdrawal approval directly...');
    
    // First, get a withdrawal to test with
    const { data: withdrawals, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('status', 'pending')
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching withdrawals:', fetchError);
      return;
    }
    
    if (!withdrawals || withdrawals.length === 0) {
      console.log('No pending withdrawals found');
      return;
    }
    
    const withdrawal = withdrawals[0];
    console.log('Found withdrawal:', withdrawal.id);
    
    // Try to update the withdrawal status
    const { data: updated, error: updateError } = await supabase
      .from('withdrawals')
      .update({ 
        status: 'approved',
        admin_notes: 'Test approval',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawal.id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
      console.error('Error details:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('✅ Withdrawal updated successfully:', updated);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testApproval();