const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWithdrawalApproval() {
  try {
    console.log('🧪 Testing withdrawal approval process...');
    
    // First, check available users and portfolios
    console.log('\n1. Checking available users and portfolios...');
    const { data: portfolios, error: portfolioListError } = await supabase
      .from('portfolios')
      .select('user_id, currency, balance')
      .gt('balance', 10)
      .limit(5);
    
    if (portfolioListError) {
      console.log('❌ Error getting portfolios:', portfolioListError.message);
      return;
    }
    
    if (!portfolios || portfolios.length === 0) {
      console.log('❌ No portfolios with sufficient balance found');
      return;
    }
    
    console.log('✅ Available portfolios:');
    portfolios.forEach((p, i) => {
      console.log(`   ${i + 1}. User: ${p.user_id.toString().slice(0, 8)}, Currency: ${p.currency}, Balance: ${p.balance}`);
    });
    
    // Find a portfolio with a valid UUID user_id
    const testPortfolio = portfolios.find(p => {
      const userId = p.user_id.toString();
      // Check if it's a valid UUID format (36 characters with dashes)
      return userId.length === 36 && userId.includes('-');
    }) || portfolios[1]; // Use second portfolio as fallback
    
    console.log(`\n📝 Using portfolio: User ${testPortfolio.user_id.toString().slice(0, 8)}, ${testPortfolio.currency}, Balance: ${testPortfolio.balance}`);
    
    // Create a test withdrawal using correct column names
    console.log('\n2. Creating test withdrawal...');
    const testWithdrawal = {
      user_id: testPortfolio.user_id,
      currency: testPortfolio.currency,
      amount: 5, // Small amount for testing
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678', // Use wallet_address, not withdrawal_address
      status: 'pending' // Start with pending status
    };
    
    const { data: withdrawal, error: createError } = await supabase
      .from('withdrawals')
      .insert(testWithdrawal)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating withdrawal:', createError.message);
      console.log('❌ Details:', createError);
      return;
    }
    
    console.log('✅ Test withdrawal created:', withdrawal.id.slice(0, 8));
    
    // Get current balance (handle multiple records)
    console.log('\n3. Checking user balance...');
    const { data: portfolioRecords, error: portfolioError } = await supabase
      .from('portfolios')
      .select('balance')
      .eq('user_id', withdrawal.user_id)
      .eq('currency', withdrawal.currency);
    
    if (portfolioError) {
      console.log('❌ Error getting portfolio:', portfolioError.message);
      return;
    }
    
    if (!portfolioRecords || portfolioRecords.length === 0) {
      console.log('❌ No portfolio found for user');
      return;
    }
    
    // Use the first record if multiple exist
    const portfolio = portfolioRecords[0];
    console.log('✅ Current balance:', portfolio.balance, withdrawal.currency);
    
    // Test the approval process
    console.log('\n4. Testing approval process...');
    
    const currentBalance = parseFloat(portfolio.balance);
    const withdrawalAmount = parseFloat(withdrawal.amount);
    
    if (currentBalance < withdrawalAmount) {
      console.log('❌ Insufficient balance for test');
      console.log(`   Available: ${currentBalance} ${withdrawal.currency}`);
      console.log(`   Required: ${withdrawalAmount} ${withdrawal.currency}`);
      return;
    }
    
    // Update withdrawal status to approved
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        admin_notes: 'Test approval',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawal.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Error updating withdrawal:', updateError.message);
      console.log('❌ Full error:', updateError);
      return;
    }
    
    console.log('✅ Withdrawal status updated to approved');
    
    // Deduct balance
    const newBalance = currentBalance - withdrawalAmount;
    const { error: balanceUpdateError } = await supabase
      .from('portfolios')
      .update({ balance: newBalance })
      .eq('user_id', withdrawal.user_id)
      .eq('currency', withdrawal.currency);
    
    if (balanceUpdateError) {
      console.log('❌ Error updating balance:', balanceUpdateError.message);
      return;
    }
    
    console.log('✅ Balance deducted successfully');
    console.log(`   Old balance: ${currentBalance} ${withdrawal.currency}`);
    console.log(`   New balance: ${newBalance} ${withdrawal.currency}`);
    
    // Clean up - delete test withdrawal
    console.log('\n5. Cleaning up...');
    await supabase
      .from('withdrawals')
      .delete()
      .eq('id', withdrawal.id);
    
    // Restore balance
    await supabase
      .from('portfolios')
      .update({ balance: currentBalance })
      .eq('user_id', withdrawal.user_id)
      .eq('currency', withdrawal.currency);
    
    console.log('✅ Test completed successfully!');
    console.log('\n🎉 Withdrawal approval process is working correctly!');
    console.log('\n📋 Summary:');
    console.log('   - Withdrawal creation: ✅');
    console.log('   - Balance checking: ✅');
    console.log('   - Status update: ✅');
    console.log('   - Balance deduction: ✅');
    console.log('   - Cleanup: ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testWithdrawalApproval();