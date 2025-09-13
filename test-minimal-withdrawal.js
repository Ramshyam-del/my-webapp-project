const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMinimalWithdrawal() {
  console.log('🧪 Testing minimal withdrawal insertion...');
  
  try {
    // Test 1: Try with minimal required fields only
    console.log('\n1. Testing with minimal fields...');
    const minimalWithdrawal = {
      user_id: '00000000-0000-0000-0000-000000000000',
      currency: 'BTC',
      amount: 0.001,
      withdrawal_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      network: 'bitcoin'
    };
    
    const { data: minData, error: minError } = await supabase
      .from('withdrawals')
      .insert(minimalWithdrawal)
      .select();
    
    if (minError) {
      console.error('❌ Minimal insertion failed:', minError.message);
      
      // Test 2: Try without network field
      console.log('\n2. Testing without network field...');
      const { user_id, currency, amount, withdrawal_address } = minimalWithdrawal;
      const withoutNetwork = { user_id, currency, amount, withdrawal_address };
      
      const { data: noNetData, error: noNetError } = await supabase
        .from('withdrawals')
        .insert(withoutNetwork)
        .select();
      
      if (noNetError) {
        console.error('❌ Without network failed:', noNetError.message);
        
        // Test 3: Try with old schema (wallet_address instead of withdrawal_address)
        console.log('\n3. Testing with old schema fields...');
        const oldSchema = {
          user_id,
          currency,
          amount,
          wallet_address: withdrawal_address
        };
        
        const { data: oldData, error: oldError } = await supabase
          .from('withdrawals')
          .insert(oldSchema)
          .select();
        
        if (oldError) {
          console.error('❌ Old schema failed:', oldError.message);
          console.log('\n💡 The withdrawals table might not exist or have different schema.');
          console.log('Please check if you have run the SQL script in Supabase.');
        } else {
          console.log('✅ Old schema works! Table uses wallet_address field.');
          // Clean up
          if (oldData && oldData[0]) {
            await supabase.from('withdrawals').delete().eq('id', oldData[0].id);
          }
        }
      } else {
        console.log('✅ Without network works! Network field is optional.');
        // Clean up
        if (noNetData && noNetData[0]) {
          await supabase.from('withdrawals').delete().eq('id', noNetData[0].id);
        }
      }
    } else {
      console.log('✅ Minimal insertion successful! New schema is working.');
      // Clean up
      if (minData && minData[0]) {
        await supabase.from('withdrawals').delete().eq('id', minData[0].id);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testMinimalWithdrawal();