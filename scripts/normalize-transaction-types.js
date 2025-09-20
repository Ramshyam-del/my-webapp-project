const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function normalizeTransactionTypes() {
  console.log('🔄 Starting transaction type normalization...');
  
  try {
    // Step 1: Drop the existing constraint
    console.log('🗑️ Dropping existing type constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE fund_transactions DROP CONSTRAINT IF EXISTS fund_transactions_type_check;'
    });
    
    if (dropError) {
      console.error('Error dropping constraint:', dropError);
    } else {
      console.log('✅ Constraint dropped successfully');
    }
    
    // Step 2: Update existing fund_transactions data to use lowercase
    console.log('📝 Updating fund_transactions table...');
    const { data: updateResult, error: updateError } = await supabase
      .from('fund_transactions')
      .update({ type: 'recharge' })
      .eq('type', 'RECHARGE');
    
    if (updateError) {
      console.error('Error updating RECHARGE records:', updateError);
    } else {
      console.log('✅ Updated RECHARGE records to recharge');
    }
    
    const { data: updateResult2, error: updateError2 } = await supabase
      .from('fund_transactions')
      .update({ type: 'withdraw' })
      .eq('type', 'WITHDRAW');
    
    if (updateError2) {
      console.error('Error updating WITHDRAW records:', updateError2);
    } else {
      console.log('✅ Updated WITHDRAW records to withdraw');
    }
    
    // Step 3: Recreate the constraint with lowercase values
    console.log('🔧 Creating new constraint with lowercase values...');
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE fund_transactions ADD CONSTRAINT fund_transactions_type_check 
            CHECK (type IN ('deposit', 'withdraw', 'recharge', 'bonus', 'penalty', 'trade_fee', 'referral'));`
    });
    
    if (constraintError) {
      console.error('Error creating new constraint:', constraintError);
    } else {
      console.log('✅ New constraint created successfully');
    }
    
    // Step 4: Check current transaction types
    console.log('\n📊 Current transaction type distribution:');
    const { data: typeStats, error: statsError } = await supabase
      .from('fund_transactions')
      .select('type')
      .order('type');
    
    if (statsError) {
      console.error('Error fetching type stats:', statsError);
    } else {
      const typeCounts = {};
      typeStats.forEach(record => {
        typeCounts[record.type] = (typeCounts[record.type] || 0) + 1;
      });
      
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} records`);
      });
    }
    
    console.log('\n✅ Transaction type normalization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during normalization:', error);
    process.exit(1);
  }
}

// Run the normalization
normalizeTransactionTypes()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });