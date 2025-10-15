// Test script to simulate admin decision on a trade
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function simulateAdminDecision() {
  console.log('Simulating admin decision...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // Get the test trade we just created
    console.log('🔍 Finding test trade...');
    const { data: trades, error: fetchError } = await serverSupabase
      .from('trades')
      .select('*')
      .eq('status', 'OPEN')
      .eq('trade_result', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.log('❌ Failed to fetch trade:', fetchError);
      return;
    }
    
    if (!trades || trades.length === 0) {
      console.log('❌ No test trade found');
      return;
    }
    
    const trade = trades[0];
    console.log('✅ Found trade:', trade.id);
    
    // Simulate admin decision (win)
    console.log('🔍 Simulating admin win decision...');
    const pnl = trade.amount * trade.leverage * 0.5; // 50% profit for win
    
    const { data: updatedTrade, error: updateError } = await serverSupabase
      .from('trades')
      .update({
        // Don't change trade_result immediately - keep it as 'pending' so it still shows in active trades
        // The settlement worker will apply the admin decision and change trade_result when the trade expires
        final_pnl: pnl,
        admin_action: 'win', // Record admin decision
        admin_action_at: new Date().toISOString(), // Record when admin made the decision
        result_determined_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', trade.id)
      .select('*');
    
    if (updateError) {
      console.log('❌ Failed to update trade:', updateError);
      return;
    }
    
    console.log('✅ Admin decision recorded successfully');
    console.log('✅ Trade will be settled when it expires at:', trade.expiry_ts);
  } catch (error) {
    console.log('❌ Failed to simulate admin decision:', error);
  }
}

simulateAdminDecision();