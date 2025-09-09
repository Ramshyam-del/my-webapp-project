import { supabase } from '../../../lib/supabase';
const { supabaseAdmin } = require('../../../backend/lib/supabaseAdmin');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { tradeId, action } = req.body;

    // Validation
    if (!tradeId || !action) {
      return res.status(400).json({ error: 'Missing required fields: tradeId, action' });
    }

    if (!['win', 'loss'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "win" or "loss"' });
    }

    // Get the trade details
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (tradeError || !trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    // Check if trade is still active and pending admin action
    if (trade.trade_result !== 'pending') {
      return res.status(400).json({ error: 'Trade result already determined' });
    }

    // Calculate final P&L based on admin action
    let finalPnl;
    if (action === 'win') {
      // Calculate profit based on duration percentage and leverage
      const durationOptions = [
        { seconds: 60, percentage: 30 },
        { seconds: 120, percentage: 50 },
        { seconds: 180, percentage: 70 },
        { seconds: 360, percentage: 100 }
      ];
      
      const durationOption = durationOptions.find(opt => opt.seconds === trade.duration_seconds) || { percentage: 50 };
      const profitPercentage = durationOption.percentage / 100;
      const leverage = trade.leverage || 1;
      
      finalPnl = trade.amount * profitPercentage * leverage;
    } else {
      // Loss - user loses the trade amount
      finalPnl = -trade.amount;
    }

    const now = new Date();

    // Update the trade with admin decision but keep it running until natural expiry
    const { data: updatedTrade, error: updateError } = await supabaseAdmin
      .from('trades')
      .update({
        admin_action: action,
        admin_action_at: now.toISOString(),
        admin_user_id: user.id,
        // Don't set trade_result yet - let it run until expiry
        // Don't set result_determined_at yet - wait for natural expiry
        // Don't set final_pnl yet - calculate at settlement
        // Keep status as 'OPEN' - trade continues running
        updated_at: now.toISOString()
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return res.status(500).json({ error: 'Failed to update trade' });
    }

    // Don't update user balance immediately - wait for natural trade expiry
    // Balance will be updated by the settlement worker when trade expires

    // Log the admin action
    await supabaseAdmin
      .from('operation_logs')
      .insert({
        admin_id: user.id,
        admin_email: user.email,
        action: `trade_${action}`,
        target_user_id: trade.user_id,
        details: `Set trade ${tradeId} result to ${action}. P&L: ${finalPnl}`,
        metadata: {
          trade_id: tradeId,
          action: action,
          final_pnl: finalPnl,
          trade_amount: trade.amount
        },
        created_at: now.toISOString()
      });

    res.status(200).json({
      success: true,
      data: {
        trade: updatedTrade,
        action,
        message: `Admin decision recorded. Trade will continue running until expiry.`
      },
      message: `Trade marked as ${action}. Will be settled at natural expiry.`
    });

  } catch (error) {
    console.error('Admin trade action API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}