// Test script to directly test the trade history API
const { serverSupabase } = require('./backend/lib/supabaseAdmin');

async function testAPIDirect() {
  console.log('Testing trade history API directly...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    const userId = '1b26c5eb-f775-45ae-9178-62297341ee0f';
    
    // Test the exact query used by the API
    console.log('🔍 Testing trade history query for user:', userId);
    const { data: trades, error: tradesError } = await serverSupabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .or('status.in.(CLOSED,completed,SETTLED,COMPLETED),and(trade_result.in.(win,loss),auto_expired.eq.true)')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (tradesError) {
      console.log('❌ Query failed:', tradesError);
      return;
    }
    
    console.log('✅ Query successful');
    console.log('✅ Number of trades found:', trades.length);
    
    if (trades.length > 0) {
      console.log('✅ Sample trades:');
      trades.forEach((trade, index) => {
        console.log(`  ${index + 1}. ID: ${trade.id}`);
        console.log(`     Status: ${trade.status}`);
        console.log(`     Trade Result: ${trade.trade_result}`);
        console.log(`     Admin Action: ${trade.admin_action}`);
        console.log(`     Settled: ${trade.settled}`);
        console.log(`     Final PnL: ${trade.final_pnl}`);
        console.log('---');
      });
    }
    
    // Test the formatting logic used by the API
    console.log('🔍 Testing trade formatting...');
    const formattedTrades = trades.map(trade => {
      const now = new Date();
      const createdAt = new Date(trade.created_at);
      const expiryTime = new Date(trade.expiry_ts);
      
      // Determine result status
      let resultStatus = 'completed';
      let resultText = 'Completed';
      
      if (trade.trade_result === 'win') {
        resultStatus = 'win';
        resultText = 'Won';
      } else if (trade.trade_result === 'loss') {
        resultStatus = 'loss';
        resultText = 'Lost';
      } else if (trade.auto_expired) {
        resultStatus = 'expired';
        resultText = 'Expired';
      }

      return {
        id: trade.id,
        pair: trade.pair,
        type: trade.trade_type,
        amount: parseFloat(trade.amount),
        entryPrice: parseFloat(trade.entry_price),
        exitPrice: trade.exit_price ? parseFloat(trade.exit_price) : null,
        leverage: `${trade.leverage}x`,
        duration: trade.duration_seconds,
        finalPnl: trade.final_pnl ? parseFloat(trade.final_pnl) : 0,
        tradeResult: trade.trade_result,
        adminAction: trade.admin_action,
        autoExpired: trade.auto_expired,
        status: trade.status,
        resultStatus,
        resultText,
        createdAt: createdAt.toISOString(),
        expiryTime: expiryTime.toISOString(),
        completedAt: trade.result_determined_at || trade.updated_at,
        isProfit: trade.final_pnl > 0
      };
    });
    
    console.log('✅ Formatted trades:', formattedTrades.length);
    if (formattedTrades.length > 0) {
      console.log('✅ Sample formatted trade:', formattedTrades[0]);
    }
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

testAPIDirect();