// Test script to check if trade-history API is working correctly
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function testTradeHistoryAPI() {
  console.log('Testing trade-history API query...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // Test the exact query used in the trade-history API
    console.log('🔍 Testing trade history query...');
    const { data: trades, error } = await serverSupabase
      .from('trades')
      .select('*')
      .or('status.in.(CLOSED,completed,SETTLED,COMPLETED),and(trade_result.in.(win,loss),auto_expired.eq.true)')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('❌ Query failed:', error);
      return;
    }
    
    console.log('✅ Query successful');
    console.log('✅ Number of trades found:', trades.length);
    console.log('✅ Sample trades:', JSON.stringify(trades.slice(0, 2), null, 2));
  } catch (error) {
    console.log('❌ Trade history API test failed:', error);
  }
}

testTradeHistoryAPI();