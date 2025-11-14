// Test script to check pending trades that should be settled
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function checkPendingTrades() {
  console.log('Checking pending trades...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    const nowIso = new Date().toISOString();
    console.log('🔍 Current time:', nowIso);
    
    // Check for trades that should be settled
    console.log('🔍 Checking for trades that should be settled...');
    const { data: trades, error } = await serverSupabase
      .from('trades')
      .select('*')
      .eq('status', 'OPEN')
      .eq('trade_result', 'pending')
      .lte('expiry_ts', nowIso)
      .order('expiry_ts', { ascending: true })
      .limit(10);
    
    if (error) {
      console.log('❌ Query failed:', error);
      return;
    }
    
    console.log('✅ Found', trades.length, 'trades that should be settled');
    if (trades.length > 0) {
      console.log('✅ Sample trades:');
      trades.forEach((trade, index) => {
        console.log(`  ${index + 1}. ID: ${trade.id}`);
        console.log(`     User ID: ${trade.user_id}`);
        console.log(`     Expiry: ${trade.expiry_ts}`);
        console.log(`     Now: ${nowIso}`);
        console.log(`     Expired: ${new Date(trade.expiry_ts) < new Date(nowIso)}`);
        console.log(`     Admin action: ${trade.admin_action}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.log('❌ Check failed:', error);
  }
}

checkPendingTrades();