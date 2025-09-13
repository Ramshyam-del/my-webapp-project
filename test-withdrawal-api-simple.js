const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

async function testWithdrawalAPI() {
  try {
    console.log('Testing withdrawal API with correct schema...');
    
    // Test 1: Check if withdrawals table exists and has correct schema
    console.log('\n1. Testing withdrawals table schema:');
    
    const { data: testInsert, error: insertError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        currency: 'USDT',
        amount: 10.0,
        withdrawal_address: '0x1234567890abcdef1234567890abcdef12345678',
        network: 'ethereum',
        fee_amount: 0,
        status: 'pending'
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.log('❌ Schema test failed:', insertError.message);
      
      if (insertError.message.includes('relation "withdrawals" does not exist')) {
        console.log('\n⚠️  SOLUTION: The withdrawals table does not exist in your database.');
        console.log('Please execute this SQL in your Supabase SQL editor:');
        console.log('\n--- COPY AND PASTE THIS SQL INTO SUPABASE ---');
        console.log(`
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT')),
    amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
    withdrawal_address TEXT NOT NULL,
    network TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'approved', 'rejected', 'processing', 'completed', 'failed')),
    locked_by UUID REFERENCES auth.users(id),
    locked_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    transaction_hash TEXT,
    fee_amount NUMERIC(20, 8) DEFAULT 0,
    fee_currency TEXT,
    user_note TEXT,
    admin_note TEXT,
    failure_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own withdrawals
CREATE POLICY "Users can create withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can manage all withdrawals
CREATE POLICY "Service role can manage all withdrawals" ON withdrawals
    FOR ALL USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON withdrawals TO authenticated;
GRANT ALL ON withdrawals TO service_role;
`);
        console.log('\n--- END OF SQL ---\n');
      } else {
        console.log('\n⚠️  Other database error. Please check your Supabase configuration.');
      }
      return;
    }
    
    console.log('✅ Withdrawals table schema is correct!');
    console.log('   Test record created with ID:', testInsert.id);
    
    // Clean up test record
    await supabase
      .from('withdrawals')
      .delete()
      .eq('id', testInsert.id);
    
    console.log('✅ Test record cleaned up');
    
    console.log('\n🎉 Withdrawal functionality should now work!');
    console.log('\nNext steps:');
    console.log('1. Go to http://localhost:3000/withdraw');
    console.log('2. Log in with a valid user account');
    console.log('3. Fill out the withdrawal form and submit');
    console.log('4. The error should be resolved!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithdrawalAPI();