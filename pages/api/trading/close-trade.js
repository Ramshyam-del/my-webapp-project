import { supabase } from '../../../lib/supabase';

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

    const { tradeId, exitPrice } = req.body;

    if (!tradeId || !exitPrice) {
      return res.status(400).json({ error: 'Trade ID and exit price are required' });
    }

    // Get the trade details
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .eq('status', 'OPEN')
      .single();

    if (tradeError || !trade) {
      return res.status(404).json({ error: 'Trade not found or already closed' });
    }

    // Calculate P&L for early close
    const entryPrice = parseFloat(trade.entry_price);
    const exitPriceNum = parseFloat(exitPrice);
    const amount = parseFloat(trade.amount);
    const leverage = parseFloat(trade.leverage) || 1;
    
    let pnl = 0;
    if (trade.trade_type === 'BUY UP') {
      // For BUY UP, profit when price goes up
      pnl = ((exitPriceNum - entryPrice) / entryPrice) * amount * leverage;
    } else if (trade.trade_type === 'BUY FALL') {
      // For BUY FALL, profit when price goes down
      pnl = ((entryPrice - exitPriceNum) / entryPrice) * amount * leverage;
    }

    const now = new Date();

    // Update the trade as closed
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({
        status: 'CLOSED',
        exit_price: exitPriceNum,
        pnl: pnl,
        final_pnl: pnl,
        closed_at: now.toISOString(),
        updated_at: now.toISOString(),
        trade_result: pnl >= 0 ? 'win' : 'loss',
        result_determined_at: now.toISOString()
      })
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return res.status(500).json({ error: 'Failed to close trade' });
    }

    // Update user balance - add back the original amount plus/minus P&L
    const balanceChange = amount + pnl;
    
    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({
        balance: supabase.raw(`balance + ${balanceChange}`),
        updated_at: now.toISOString()
      })
      .eq('user_id', user.id)
      .eq('currency', 'USDT');

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      // Note: Trade is already closed, but balance update failed
      // This should be handled by a reconciliation process
    }

    return res.status(200).json({
      success: true,
      message: 'Trade closed successfully',
      trade: updatedTrade,
      pnl: pnl,
      exitPrice: exitPriceNum
    });

  } catch (error) {
    console.error('Error in close trade API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}