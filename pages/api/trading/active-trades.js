import { supabaseAdmin } from '../../../lib/supabaseAdmin';

console.log('🔧 [ACTIVE-TRADES] Using service role key for database access');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 [ACTIVE-TRADES] API called');
    // Get user session
    const authHeader = req.headers.authorization;
    console.log('🔍 [ACTIVE-TRADES] Auth header present:', !!authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔍 [ACTIVE-TRADES] No auth token provided');
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    console.log('🔍 [ACTIVE-TRADES] User ID:', user?.id);
    
    if (authError || !user) {
      console.log('🔍 [ACTIVE-TRADES] Auth error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch active trades for the user
    console.log('🔍 [ACTIVE-TRADES] Querying for user:', user.id);
    
    // First, test basic query
    const { data: allUserTrades, error: allTradesError } = await supabaseAdmin
      .from('trades')
      .select('id, status, trade_result')
      .eq('user_id', user.id)
      .limit(5);
    
    console.log('🔍 [ACTIVE-TRADES] All user trades test:', allUserTrades?.length || 0, allUserTrades);
    
    const { data: trades, error: tradesError } = await supabaseAdmin
      .from('trades')
      .select(`
        id,
        pair,
        trade_type,
        amount,
        entry_price,
        leverage,
        duration_seconds,
        expiry_ts,
        admin_action,
        trade_result,
        auto_expired,
        final_pnl,
        created_at,
        updated_at,
        status
      `)
      .eq('user_id', user.id)
      .eq('status', 'OPEN')
      .eq('trade_result', 'pending')
      .order('created_at', { ascending: false });
    
    console.log('🔍 [ACTIVE-TRADES] Query filters: status=OPEN, trade_result=pending, user_id=', user.id);

    if (tradesError) {
      console.error('🚨 [ACTIVE-TRADES] Supabase error:', tradesError);
      return res.status(500).json({ error: 'Failed to fetch active trades' });
    }

    console.log('🔍 [ACTIVE-TRADES] Raw trades from DB:', trades?.length || 0);
    console.log('🔍 [ACTIVE-TRADES] First trade:', trades?.[0]);
    console.log('🔍 [ACTIVE-TRADES] All trades:', JSON.stringify(trades, null, 2));

    // Calculate time remaining for each trade
    const now = new Date();
    const activeTrades = trades.map(trade => {
      const expiryTime = new Date(trade.expiry_ts);
      const timeRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      const isExpired = timeRemaining <= 0;

      return {
        id: trade.id,
        pair: trade.pair,
        type: trade.trade_type,
        amount: parseFloat(trade.amount),
        entryPrice: parseFloat(trade.entry_price),
        leverage: `${trade.leverage}x`,
        durationSeconds: trade.duration_seconds,
        timeRemaining,
        isExpired,
        adminAction: trade.admin_action,
        tradeResult: trade.trade_result,
        autoExpired: trade.auto_expired,
        finalPnl: trade.final_pnl ? parseFloat(trade.final_pnl) : null,
        createdAt: trade.created_at,
        expiresAt: trade.expiry_ts
      };
    });

    return res.status(200).json({
      success: true,
      trades: activeTrades,
      count: activeTrades.length
    });

  } catch (error) {
    console.error('Error in active trades API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}