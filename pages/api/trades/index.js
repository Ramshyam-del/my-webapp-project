import { supabase } from '../../../lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Parse query parameters
    const {
      page = '1',
      limit = '10',
      status = '',
      sort = 'created_at',
      order = 'desc',
      search = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Validate sort column
    const allowedSortColumns = ['created_at', 'amount', 'pnl', 'pair', 'status', 'leverage'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Build query
    let query = supabase
      .from('trades')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status.toLowerCase());
    }

    if (search) {
      query = query.or(`symbol.ilike.%${search}%,id.eq.${search}`);
    }

    // Apply sorting
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: trades, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch trades' });
    }

    // Calculate current P&L for open trades (simplified)
    const tradesWithPnL = trades.map(trade => {
      if (trade.status === 'OPEN') {
        // In a real implementation, you would fetch current market prices
        // and calculate real-time P&L. For now, we'll use stored P&L or 0
        return {
          ...trade,
          current_pnl: trade.pnl || 0
        };
      }
      return {
        ...trade,
        current_pnl: trade.pnl || 0
      };
    });

    return res.status(200).json({
      success: true,
      trades: tradesWithPnL,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum)
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}