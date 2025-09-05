const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function verifyCurrencyPairFix() {
  try {
    console.log('🔍 Verifying currency_pair column fix...');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Please check your .env file.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n📊 VERIFICATION RESULTS:');
    console.log('=' .repeat(50));
    
    // Test 1: Check if trades table is accessible
    console.log('\n1. Testing trades table access...');
    const { data: tradesData, error: tradesError } = await supabase
      .from('trades')
      .select('id')
      .limit(1);
    
    if (tradesError) {
      console.log('❌ Trades table access failed:', tradesError.message);
      return;
    } else {
      console.log('✅ Trades table is accessible');
    }
    
    // Test 2: Check for currency_pair column
    console.log('\n2. Testing currency_pair column...');
    const { data: currencyPairData, error: currencyPairError } = await supabase
      .from('trades')
      .select('id, currency_pair')
      .limit(1);
    
    if (currencyPairError) {
      console.log('❌ currency_pair column missing:', currencyPairError.message);
      console.log('\n🔧 MANUAL FIX REQUIRED:');
      console.log('Please follow the instructions in MANUAL-ADD-CURRENCY-PAIR.md');
      return;
    } else {
      console.log('✅ currency_pair column exists and is accessible');
    }
    
    // Test 3: Check for pair column (should also exist)
    console.log('\n3. Testing pair column...');
    const { data: pairData, error: pairError } = await supabase
      .from('trades')
      .select('id, pair')
      .limit(1);
    
    if (pairError) {
      console.log('⚠️  pair column missing:', pairError.message);
    } else {
      console.log('✅ pair column exists and is accessible');
    }
    
    // Test 4: Check data consistency
    console.log('\n4. Testing data consistency...');
    const { data: consistencyData, error: consistencyError } = await supabase
      .from('trades')
      .select('id, pair, currency_pair')
      .limit(5);
    
    if (consistencyError) {
      console.log('❌ Data consistency check failed:', consistencyError.message);
    } else if (consistencyData && consistencyData.length > 0) {
      console.log('✅ Sample data retrieved successfully');
      console.log('\n📋 Sample records:');
      consistencyData.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        console.log(`      pair: ${record.pair || 'NULL'}`);
        console.log(`      currency_pair: ${record.currency_pair || 'NULL'}`);
        
        if (record.pair && record.currency_pair && record.pair !== record.currency_pair) {
          console.log('      ⚠️  Values don\'t match!');
        } else if (record.pair && record.currency_pair) {
          console.log('      ✅ Values match');
        }
      });
    } else {
      console.log('ℹ️  No trade records found (empty table)');
    }
    
    // Test 5: Test application query patterns
    console.log('\n5. Testing common application queries...');
    
    // Test query with currency_pair filter
    const { data: filterData, error: filterError } = await supabase
      .from('trades')
      .select('id, currency_pair, amount')
      .eq('currency_pair', 'BTC/USD')
      .limit(1);
    
    if (filterError) {
      console.log('❌ currency_pair filter query failed:', filterError.message);
    } else {
      console.log('✅ currency_pair filter query works');
      if (filterData && filterData.length > 0) {
        console.log(`   Found ${filterData.length} BTC/USD trades`);
      }
    }
    
    // Final summary
    console.log('\n' + '=' .repeat(50));
    console.log('📋 SUMMARY:');
    
    if (!currencyPairError && !tradesError) {
      console.log('🎉 SUCCESS: currency_pair column fix is working!');
      console.log('✅ Your application should now work without the column error.');
      console.log('\n📝 Next steps:');
      console.log('   - Test your application to confirm the fix');
      console.log('   - Consider running the full schema deployment if other issues persist');
    } else {
      console.log('❌ ISSUES DETECTED: Manual intervention required');
      console.log('📖 Please follow the instructions in MANUAL-ADD-CURRENCY-PAIR.md');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\n📖 Please check your environment variables and database connection.');
  }
}

verifyCurrencyPairFix();