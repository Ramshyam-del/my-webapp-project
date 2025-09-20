import { supabase } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get limit from query params (default to 10)
    const limit = parseInt(req.query.limit) || 10;

    // Fetch completed trades for the user (including auto-expired trades)
    console.log('🔍 [TRADE-HISTORY] Fetching trades for user:', user.id);
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .or('status.in.(CLOSED,completed,SETTLED,COMPLETED),and(trade_result.in.(win,loss),auto_expired.eq.true)')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    console.log('🔍 [TRADE-HISTORY] Query result:', { 
      tradesCount: trades?.length || 0, 
      error: tradesError,
      firstTrade: trades?.[0] 
    });

    if (tradesError) {
      console.error('Error fetching trade history:', tradesError);
      return res.status(500).json({ error: 'Failed to fetch trade history' });
    }

    // Format trades for frontend
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

    return res.status(200).json({
      success: true,
      trades: formattedTrades,
      count: formattedTrades.length
    });

  } catch (error) {
    console.error('Trade history API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
