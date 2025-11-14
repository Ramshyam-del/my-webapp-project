// Test script to check if the trade was settled
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function checkSettledTrade() {
  console.log('Checking if trade was settled...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // Check if our test trade was settled
    console.log('🔍 Checking test trade status...');
    const { data: trade, error } = await serverSupabase
      .from('trades')
      .select('*')
      .eq('id', '4f4d7b61-aa48-4c8b-837b-5d4e2fecd349')
      .single();
    
    if (error) {
      console.log('❌ Failed to fetch trade:', error);
      return;
    }
    
    if (!trade) {
      console.log('❌ Trade not found');
      return;
    }
    
    console.log('✅ Trade found:');
    console.log('   ID:', trade.id);
    console.log('   Status:', trade.status);
    console.log('   Trade Result:', trade.trade_result);
    console.log('   Admin Action:', trade.admin_action);
    console.log('   Settled:', trade.settled);
    console.log('   Final PnL:', trade.final_pnl);
    console.log('   Outcome:', trade.outcome);
    
    // Check if it should appear in trade history
    console.log('🔍 Checking if trade should appear in history...');
    const now = new Date();
    const expiryTime = new Date(trade.expiry_ts);
    const isExpired = expiryTime < now;
    
    console.log('   Expired:', isExpired);
    console.log('   Expiry Time:', trade.expiry_ts);
    console.log('   Current Time:', now.toISOString());
    
    // Test the trade history query
    console.log('🔍 Testing trade history query...');
    const { data: historyTrades, error: historyError } = await serverSupabase
      .from('trades')
      .select('*')
      .eq('user_id', trade.user_id)
      .or('status.in.(CLOSED,completed,SETTLED,COMPLETED),and(trade_result.in.(win,loss),auto_expired.eq.true)')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (historyError) {
      console.log('❌ Trade history query failed:', historyError);
      return;
    }
    
    console.log('✅ Trade history query returned', historyTrades.length, 'trades');
    const foundInHistory = historyTrades.some(t => t.id === trade.id);
    console.log('✅ Trade found in history:', foundInHistory);
    
    if (foundInHistory) {
      const historyTrade = historyTrades.find(t => t.id === trade.id);
      console.log('   History trade status:', historyTrade.status);
      console.log('   History trade result:', historyTrade.trade_result);
    }
  } catch (error) {
    console.log('❌ Check failed:', error);
  }
}

checkSettledTrade();