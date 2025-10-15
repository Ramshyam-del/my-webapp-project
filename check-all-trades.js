// Script to check all trades in the database
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function checkAllTrades() {
  console.log('🔍 Checking all trades in the database...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // Get all recent trades
    const { data: trades, error: fetchError } = await serverSupabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (fetchError) {
      console.log('❌ Failed to fetch trades:', fetchError);
      return;
    }
    
    if (!trades || trades.length === 0) {
      console.log('❌ No trades found in database');
      return;
    }
    
    console.log(`✅ Found ${trades.length} recent trades:`);
    trades.forEach((trade, index) => {
      console.log(`\n--- Trade ${index + 1} ---`);
      console.log(`ID: ${trade.id}`);
      console.log(`User ID: ${trade.user_id}`);
      console.log(`Status: ${trade.status}`);
      console.log(`Trade Result: ${trade.trade_result}`);
      console.log(`Admin Action: ${trade.admin_action}`);
      console.log(`Amount: $${trade.amount}`);
      console.log(`Created: ${trade.created_at}`);
      console.log(`Expires: ${trade.expiry_ts}`);
      console.log(`Result Determined: ${trade.result_determined_at || 'Not yet'}`);
    });
  } catch (error) {
    console.log('❌ Failed to check trades:', error);
  }
}

checkAllTrades();