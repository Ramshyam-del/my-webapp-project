// Script to check if there are trades for different users
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function checkDifferentUserTrades() {
  console.log('🔍 Checking for trades from different users...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // Get all unique user IDs from trades
    const { data: userIds, error: userIdsError } = await serverSupabase
      .from('trades')
      .select('user_id')
      .order('created_at', { ascending: false });
    
    if (userIdsError) {
      console.log('❌ Failed to fetch user IDs:', userIdsError);
      return;
    }
    
    if (!userIds || userIds.length === 0) {
      console.log('❌ No trades found in database');
      return;
    }
    
    // Get unique user IDs
    const uniqueUserIds = [...new Set(userIds.map(trade => trade.user_id))];
    
    console.log(`✅ Found ${uniqueUserIds.length} unique users with trades:`);
    uniqueUserIds.forEach((userId, index) => {
      console.log(`  ${index + 1}. ${userId}`);
    });
    
    // Check trades for each user
    for (const userId of uniqueUserIds) {
      const { data: trades, error: tradesError } = await serverSupabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!tradesError && trades && trades.length > 0) {
        console.log(`\n--- User ${userId} ---`);
        console.log(`Total trades: ${trades.length}`);
        console.log('Recent trades:');
        trades.slice(0, 3).forEach((trade, index) => {
          console.log(`  ${index + 1}. ID: ${trade.id} | Status: ${trade.status} | Result: ${trade.trade_result} | Created: ${trade.created_at}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkDifferentUserTrades();