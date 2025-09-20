// Test script to check if trade-history API is working correctly
const { supabase } = require('./lib/supabaseAdmin');

async function testTradeHistory() {
  try {
    console.log('Testing trade-history API query...');
    
    // Test the updated query to see what trades it returns
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .or('status.in.(CLOSED,completed,SETTLED,COMPLETED),and(trade_result.in.(win,loss),auto_expired.eq.true)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return;
    }

    console.log(`Found ${trades?.length || 0} completed/expired trades`);
    
    if (trades && trades.length > 0) {
      console.log('\nTrade details:');
      trades.forEach((trade, index) => {
        console.log(`${index + 1}. ID: ${trade.id}`);
        console.log(`   Status: ${trade.status}`);
        console.log(`   Trade Result: ${trade.trade_result}`);
        console.log(`   Auto Expired: ${trade.auto_expired}`);
        console.log(`   Final P&L: ${trade.final_pnl}`);
        console.log(`   Created: ${trade.created_at}`);
        console.log(`   Expiry: ${trade.expiry_ts}`);
        console.log('   ---');
      });
    } else {
      console.log('No completed or expired trades found.');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testTradeHistory();