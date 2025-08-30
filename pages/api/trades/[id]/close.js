import { supabase } from '../../../../lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid user ID in token' });
    }

    const { id: tradeId } = req.query;
    if (!tradeId) {
      return res.status(400).json({ error: 'Trade ID is required' });
    }

    // Fetch the trade to close
    const { data: trade, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', userId)
      .eq('status', 'OPEN')
      .single();

    if (fetchError || !trade) {
      return res.status(404).json({ error: 'Trade not found or already closed' });
    }

    // Get current market price for P&L calculation
    let currentPrice;
    try {
      const priceResponse = await fetch(`${req.headers.origin}/api/trading/price/${trade.pair}`);
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        currentPrice = priceData.data.price;
      } else {
        // Fallback to entry price if price fetch fails
        currentPrice = trade.entry_price;
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
      currentPrice = trade.entry_price;
    }

    // Calculate P&L
    const entryPrice = parseFloat(trade.entry_price);
    const amount = parseFloat(trade.amount);
    const leverage = parseFloat(trade.leverage);
    
    let pnl = 0;
    if (trade.side === 'buy') {
      // For buy orders: profit when price goes up
      pnl = (currentPrice - entryPrice) * amount * leverage;
    } else {
      // For sell orders: profit when price goes down
      pnl = (entryPrice - currentPrice) * amount * leverage;
    }

    // Calculate percentage return
    const investedAmount = (entryPrice * amount) / leverage; // Margin used
    const pnlPercentage = (pnl / investedAmount) * 100;

    // Update trade status and P&L
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({
        status: 'CLOSED',
        pnl: pnl,
        pnl_percentage: pnlPercentage,
        exit_price: currentPrice,
        closed_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return res.status(500).json({ error: 'Failed to close trade' });
    }

    // Update user balance with P&L
    try {
      // First, get current user balance
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (portfolioError) {
        console.error('Error fetching portfolio:', portfolioError);
      } else {
        const currentBalance = parseFloat(portfolio.balance) || 0;
        const newBalance = currentBalance + pnl;

        // Update portfolio balance
        const { error: balanceUpdateError } = await supabase
          .from('portfolios')
          .update({ balance: newBalance })
          .eq('user_id', userId);

        if (balanceUpdateError) {
          console.error('Error updating balance:', balanceUpdateError);
        }

        // Record the transaction
        const { error: transactionError } = await supabase
          .from('fund_transactions')
          .insert({
            user_id: userId,
            type: pnl >= 0 ? 'profit' : 'loss',
            amount: Math.abs(pnl),
            description: `Trade #${tradeId} ${pnl >= 0 ? 'profit' : 'loss'}`,
            status: 'completed',
            trade_id: tradeId
          });

        if (transactionError) {
          console.error('Error recording transaction:', transactionError);
        }
      }
    } catch (error) {
      console.error('Error updating user balance:', error);
      // Don't fail the trade closure if balance update fails
    }

    return res.status(200).json({
      success: true,
      message: 'Trade closed successfully',
      data: {
        trade: updatedTrade,
        pnl: pnl,
        pnlPercentage: pnlPercentage,
        exitPrice: currentPrice
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}