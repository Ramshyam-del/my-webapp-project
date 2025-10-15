// Test script to verify trade APIs are working
require('dotenv').config({ path: '.env.local' });

const { supabaseAdmin } = require('./lib/supabaseAdmin');

async function testTradeAPIs() {
  console.log('🔍 Testing trade APIs...');
  
  if (!supabaseAdmin) {
    console.log('❌ Supabase not configured');
    console.log('   SUPABASE_URL:', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    return;
  }
  
  try {
    // Test fetching trades with different statuses
    console.log('\n--- Testing trade history query ---');
    const { data: historyTrades, error: historyError } = await supabaseAdmin
      .from('trades')
      .select('*')
      .or('status.in.(CLOSED,completed,SETTLED,COMPLETED),and(trade_result.in.(win,loss),auto_expired.eq.true)')
      .limit(5);
    
    if (historyError) {
      console.log('❌ Trade history query failed:', historyError.message);
    } else {
      console.log('✅ Trade history query succeeded');
      console.log('   Found', historyTrades?.length || 0, 'trades');
      if (historyTrades && historyTrades.length > 0) {
        console.log('   Sample trade:', {
          id: historyTrades[0].id,
          status: historyTrades[0].status,
          trade_result: historyTrades[0].trade_result
        });
      }
    }
    
    console.log('\n--- Testing active trades query ---');
    const { data: activeTrades, error: activeError } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('status', 'OPEN')
      .eq('trade_result', 'pending')
      .limit(5);
    
    if (activeError) {
      console.log('❌ Active trades query failed:', activeError.message);
    } else {
      console.log('✅ Active trades query succeeded');
      console.log('   Found', activeTrades?.length || 0, 'active trades');
      if (activeTrades && activeTrades.length > 0) {
        console.log('   Sample trade:', {
          id: activeTrades[0].id,
          status: activeTrades[0].status,
          trade_result: activeTrades[0].trade_result
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testTradeAPIs();