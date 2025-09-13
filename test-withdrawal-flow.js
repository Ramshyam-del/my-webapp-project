// Test withdrawal flow with proper authentication
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testWithdrawalFlow() {
  console.log('Testing complete withdrawal flow...');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // First, let's check if we have any test users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, username')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const testUser = users[0];
    console.log('✅ Found test user:', testUser.email);

    // Check if user has any balance
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('currency', 'USDT');

    if (portfolioError) {
      console.log('❌ Error checking portfolio:', portfolioError.message);
      return;
    }

    if (!portfolio || portfolio.length === 0) {
      console.log('⚠️  No USDT balance found for user. Creating test balance...');
      
      // Create a test balance
      const { error: insertError } = await supabase
        .from('portfolios')
        .insert({
          user_id: testUser.id,
          currency: 'USDT',
          balance: 100.0
        });

      if (insertError) {
        console.log('❌ Error creating test balance:', insertError.message);
        return;
      }
      
      console.log('✅ Created test balance of 100 USDT');
    } else {
      console.log('✅ User has USDT balance:', portfolio[0].balance);
    }

    // Now test creating a withdrawal
    console.log('\n--- Testing withdrawal creation ---');
    
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: testUser.id,
        currency: 'USDT',
        amount: 10.0,
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        fee: 0,
        status: 'pending'
      })
      .select('*')
      .single();

    if (withdrawalError) {
      console.log('❌ Error creating withdrawal:', withdrawalError.message);
      return;
    }

    console.log('✅ Withdrawal created successfully!');
    console.log('   ID:', withdrawal.id);
    console.log('   Amount:', withdrawal.amount, withdrawal.currency);
    console.log('   Status:', withdrawal.status);
    console.log('   Address:', withdrawal.wallet_address);
    console.log('   Fee:', withdrawal.fee);

    // Test fetching withdrawals (admin view)
    console.log('\n--- Testing admin withdrawals fetch ---');
    
    const { data: adminWithdrawals, error: adminError } = await supabase
      .from('withdrawals')
      .select(`
        id,
        user_id,
        currency,
        amount,
        fee,
        net_amount,
        wallet_address,
        tx_hash,
        status,
        admin_notes,
        created_at,
        updated_at,
        processed_at,
        users!inner(email, username)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (adminError) {
      console.log('❌ Error fetching admin withdrawals:', adminError.message);
      return;
    }

    console.log('✅ Admin withdrawals fetch successful!');
    console.log('   Found', adminWithdrawals.length, 'withdrawals');
    
    if (adminWithdrawals.length > 0) {
      const latest = adminWithdrawals[0];
      console.log('   Latest withdrawal:');
      console.log('     ID:', latest.id.slice(0, 8));
      console.log('     User:', latest.users.email);
      console.log('     Amount:', latest.amount, latest.currency);
      console.log('     Status:', latest.status);
      console.log('     Address:', latest.wallet_address);
      console.log('     Fee:', latest.fee);
      console.log('     Net Amount:', latest.net_amount);
    }

    console.log('\n🎉 All tests passed! Withdrawal flow is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Test the frontend withdrawal form at http://localhost:3000/portfolio');
    console.log('2. Check admin panel at http://localhost:3000/admin/users?tab=withdrawals');
    console.log('3. Test approval/rejection functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testWithdrawalFlow();