const { supabaseAdmin } = require('../../../lib/supabaseAdmin');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting auto-expire trades process...');
    
    // Get current timestamp
    const now = new Date();
    console.log('Current time:', now.toISOString());

    // Find all trades that have expired but are still open/pending
    const { data: expiredTrades, error: fetchError } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('status', 'OPEN')
      .eq('trade_result', 'pending')
      .lt('expiry_ts', now.toISOString());

    if (fetchError) {
      console.error('Error fetching expired trades:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch expired trades' });
    }

    console.log(`Found ${expiredTrades?.length || 0} expired trades to process`);

    if (!expiredTrades || expiredTrades.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No expired trades found',
        processed: 0
      });
    }

    let processedCount = 0;
    const results = [];

    // Process each expired trade
    for (const trade of expiredTrades) {
      try {
        console.log(`Processing expired trade ID: ${trade.id}`);
        
        // Calculate loss amount (user loses their trade amount)
        const finalPnl = -parseFloat(trade.amount);
        
        // Update the trade to mark it as auto-expired with loss
        const { data: updatedTrade, error: updateError } = await supabaseAdmin
          .from('trades')
          .update({
            trade_result: 'loss',
            final_pnl: finalPnl,
            status: 'COMPLETED',
            auto_expired: true,
            result_determined_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', trade.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Error updating trade ${trade.id}:`, updateError);
          results.push({
            tradeId: trade.id,
            success: false,
            error: updateError.message
          });
          continue;
        }

        // Update user balance (subtract the loss)
        const { data: userData, error: userFetchError } = await supabaseAdmin
          .from('portfolios')
          .select('balance')
          .eq('user_id', trade.user_id)
          .eq('currency', 'USDT')
          .single();

        if (userFetchError) {
          console.error(`Error fetching user ${trade.user_id}:`, userFetchError);
          results.push({
            tradeId: trade.id,
            success: false,
            error: 'Failed to fetch user balance'
          });
          continue;
        }

        // Update user balance (the loss is already negative, so we add it)
        const newBalance = parseFloat(userData.balance) + finalPnl;
        
        const { error: balanceUpdateError } = await supabaseAdmin
          .from('portfolios')
          .upsert({ 
            user_id: trade.user_id,
            currency: 'USDT',
            balance: newBalance,
            updated_at: now.toISOString()
          }, {
            onConflict: 'user_id,currency'
          });

        if (balanceUpdateError) {
          console.error(`Error updating balance for user ${trade.user_id}:`, balanceUpdateError);
          results.push({
            tradeId: trade.id,
            success: false,
            error: 'Failed to update user balance'
          });
          continue;
        }

        console.log(`Successfully processed expired trade ${trade.id}: P&L = ${finalPnl}, New balance = ${newBalance}`);
        
        results.push({
          tradeId: trade.id,
          success: true,
          pnl: finalPnl,
          newBalance: newBalance
        });
        
        processedCount++;
        
      } catch (error) {
        console.error(`Error processing trade ${trade.id}:`, error);
        results.push({
          tradeId: trade.id,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`Auto-expire process completed. Processed ${processedCount}/${expiredTrades.length} trades`);

    return res.status(200).json({
      success: true,
      message: `Processed ${processedCount} expired trades`,
      processed: processedCount,
      total: expiredTrades.length,
      results: results
    });

  } catch (error) {
    console.error('Auto-expire trades error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}