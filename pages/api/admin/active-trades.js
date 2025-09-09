import { supabase } from '../../../lib/supabase';
const { supabaseAdmin } = require('../../../backend/lib/supabaseAdmin');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all'; // 'active', 'pending', 'completed', 'all'

    let query = supabaseAdmin
      .from('trades')
      .select(`
        *,
        user_id
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by status
    if (status === 'active') {
      query = query.eq('status', 'OPEN').eq('trade_result', 'pending');
    } else if (status === 'pending') {
      query = query.eq('admin_action', 'pending').eq('trade_result', 'pending');
    } else if (status === 'completed') {
      query = query.in('trade_result', ['win', 'loss']);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: trades, error: tradesError, count } = await query;

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return res.status(500).json({ error: 'Failed to fetch trades' });
    }

    // Calculate time remaining for active trades
    const now = new Date();
    const enrichedTrades = trades.map(trade => {
      let timeRemaining = 0;
      let isExpired = false;
      
      if (trade.expiry_ts) {
        const expiryTime = new Date(trade.expiry_ts);
        timeRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        isExpired = timeRemaining === 0;
      }

      return {
        ...trade,
        timeRemaining,
        isExpired,
        userName: trade.users?.email || 'Unknown'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        trades: enrichedTrades,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('Active trades API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}