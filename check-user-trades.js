// Script to check trades for a specific user
const { serverSupabase } = require('./backend/lib/supabaseServer');

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.log('❌ Please provide a user ID as argument');
  console.log('Usage: node check-user-trades.js <user-id>');
  process.exit(1);
}

async function checkUserTrades() {
  console.log(`🔍 Checking trades for user: ${userId}`);
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // Get trades for this user
    const { data: trades, error: fetchError } = await serverSupabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (fetchError) {
      console.log('❌ Failed to fetch trades:', fetchError);
      return;
    }
    
    if (!trades || trades.length === 0) {
      console.log('❌ No trades found for this user');
      return;
    }
    
    console.log(`✅ Found ${trades.length} trades for user ${userId}:`);
    trades.forEach((trade, index) => {
      console.log(`\n--- Trade ${index + 1} ---`);
      console.log(`ID: ${trade.id}`);
      console.log(`Status: ${trade.status}`);
      console.log(`Trade Result: ${trade.trade_result}`);
      console.log(`Admin Action: ${trade.admin_action}`);
      console.log(`Amount: $${trade.amount}`);
      console.log(`Created: ${trade.created_at}`);
      console.log(`Expires: ${trade.expiry_ts}`);
      console.log(`Result Determined: ${trade.result_determined_at || 'Not yet'}`);
    });
  } catch (error) {
    console.log('❌ Failed to check user trades:', error);
  }
}

checkUserTrades();