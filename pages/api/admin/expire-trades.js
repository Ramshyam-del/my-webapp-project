const { supabaseAdmin } = require('../../../backend/lib/supabaseAdmin');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // This endpoint can be called by a cron job or manually
    // For security, you might want to add API key authentication here
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.CRON_API_KEY || 'your-secure-api-key';
    
    if (apiKey !== expectedApiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const now = new Date();
    
    // Find trades that have expired but haven't been processed
    const { data: expiredTrades, error: fetchError } = await supabaseAdmin
      .from('trades')
      .select('*')
      .lte('expiry_ts', now.toISOString())
      .eq('admin_action', 'pending')
      .eq('trade_result', 'pending')
      .eq('status', 'OPEN');

    if (fetchError) {
      console.error('Error fetching expired trades:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch expired trades' });
    }

    if (!expiredTrades || expiredTrades.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No expired trades to process',
        expiredCount: 0
      });
    }

    let processedCount = 0;
    const errors = [];

    // Process each expired trade
    for (const trade of expiredTrades) {
      try {
        // Update trade to loss
        const { error: updateError } = await supabaseAdmin
          .from('trades')
          .update({
            admin_action: 'loss',
            admin_action_at: now.toISOString(),
            trade_result: 'loss',
            result_determined_at: now.toISOString(),
            auto_expired: true,
            final_pnl: -trade.amount,
            status: 'completed',
            updated_at: now.toISOString()
          })
          .eq('id', trade.id);

        if (updateError) {
          console.error(`Error updating trade ${trade.id}:`, updateError);
          errors.push({ tradeId: trade.id, error: updateError.message });
          continue;
        }

        // Note: We don't update user balance here because the amount was already deducted when trade was created
        // The user loses their trade amount (which was already deducted)
        
        processedCount++;
        
        console.log(`Auto-expired trade ${trade.id} for user ${trade.user_id}`);
        
      } catch (error) {
        console.error(`Error processing trade ${trade.id}:`, error);
        errors.push({ tradeId: trade.id, error: error.message });
      }
    }

    // Log the batch operation
    try {
      await supabaseAdmin
        .from('operation_logs')
        .insert({
          admin_id: null, // System operation
          admin_email: 'system',
          action: 'auto_expire_trades',
          target_user_id: null,
          details: `Auto-expired ${processedCount} trades`,
          metadata: {
            processed_count: processedCount,
            total_found: expiredTrades.length,
            errors: errors
          },
          created_at: now.toISOString()
        });
    } catch (logError) {
      console.error('Error logging auto-expire operation:', logError);
    }

    res.status(200).json({
      success: true,
      message: `Processed ${processedCount} expired trades`,
      data: {
        expiredCount: expiredTrades.length,
        processedCount,
        errors
      }
    });

  } catch (error) {
    console.error('Expire trades API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}