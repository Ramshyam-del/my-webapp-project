const { serverSupabase } = require('./backend/lib/supabaseServer');

async function testTradeUpdate() {
  console.log('Testing trade update...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // First, find a pending trade
    console.log('🔍 Looking for a pending trade...');
    const { data: trade, error: tradeError } = await serverSupabase
      .from('trades')
      .select('*')
      .eq('trade_result', 'pending')
      .limit(1)
      .single();
    
    if (tradeError || !trade) {
      console.log('❌ No pending trades found:', tradeError?.message || 'No trade found');
      return;
    }
    
    console.log('✅ Found pending trade:', trade.id);
    
    // Try to update the trade
    console.log('🔍 Updating trade...');
    const updatePayload = {
      // Don't change status immediately - keep it as 'OPEN' so it still shows in active trades
      trade_result: 'win',
      final_pnl: 100,
      admin_action: 'win', // Changed to lowercase to match constraint
      admin_action_at: new Date().toISOString(),
      result_determined_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 Update payload:', JSON.stringify(updatePayload, null, 2));
    
    const { data: updatedTrade, error: updateError } = await serverSupabase
      .from('trades')
      .update(updatePayload)
      .eq('id', trade.id)
      .select('*')
      .single();
    
    if (updateError) {
      console.log('❌ Trade update failed:', updateError);
      console.log('❌ Full error details:', JSON.stringify(updateError, null, 2));
      return;
    }
    
    console.log('✅ Trade updated successfully:', updatedTrade.id);
  } catch (error) {
    console.log('❌ Trade update test failed:', error);
    console.log('❌ Error stack:', error.stack);
  }
}

testTradeUpdate();