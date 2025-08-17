const express = require('express');
const { authenticateUser, requireAdmin } = require('../middleware/requireAdmin');
const { serverSupabase } = require('../lib/supabaseServer');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateUser, requireAdmin);

// GET /api/admin/trades - List trades with pagination and filters
router.get('/', async (req, res) => {
  try {
    console.log('Trades endpoint called with query:', req.query);
    const { status = 'all', page = 1, pageSize = 20, limit, search } = req.query;
    
    // Validate inputs
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const limitNum = limit ? parseInt(limit) : null;
    const validStatuses = ['pending', 'open', 'closed', 'all'];
    
    if (pageNum < 1 || pageSizeNum < 1 || pageSizeNum > 100) {
      return res.status(400).json({ 
        ok: false,
        code: 'invalid_pagination', 
        message: 'Invalid pagination parameters' 
      });
    }
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        ok: false,
        code: 'invalid_status', 
        message: 'Invalid status filter' 
      });
    }

    // Check if Supabase is configured
    if (!serverSupabase) {
      console.log('Supabase not configured, returning empty response');
      return res.json({
        ok: true,
        data: {
          items: [],
          total: 0,
          page: limitNum ? 1 : pageNum,
          pageSize: limitNum || pageSizeNum
        }
      });
    }
    
    console.log('Building trades query...');
    // Build query with join to users table
    let query = serverSupabase
      .from('trades')
      .select(`
        id, 
        user_id, 
        symbol, 
        side, 
        amount, 
        leverage, 
        duration_sec, 
        status, 
        result, 
        pnl, 
        created_at,
        users!inner(email)
      `, { count: 'exact' });
    
    // Add status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Add search filter if provided
    if (search) {
      query = query.ilike('users.email', `%${search}%`);
    }
    
    // Add sorting
    query = query.order('created_at', { ascending: false });
    
    // Add pagination or limit
    if (limitNum) {
      query = query.limit(limitNum);
    } else {
      const offset = (pageNum - 1) * pageSizeNum;
      query = query.range(offset, offset + pageSizeNum - 1);
    }
    
    console.log('Executing trades query...');
    const { data: items, error, count } = await query;
    
    if (error) {
      console.warn('Trades query error:', error.message);
      // Return empty array instead of 500
      return res.json({
        ok: true,
        data: {
          items: [],
          total: 0,
          page: limitNum ? 1 : pageNum,
          pageSize: limitNum || pageSizeNum
        }
      });
    }
    
    console.log(`Trades query successful: ${items?.length || 0} items found`);
    // Transform data to flatten the join
    const transformedItems = (items || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      email: item.users?.email || 'Unknown',
      symbol: item.symbol,
      side: item.side,
      amount: item.amount,
      leverage: item.leverage,
      duration_sec: item.duration_sec,
      status: item.status,
      result: item.result,
      pnl: item.pnl,
      created_at: item.created_at
    }));
    
    const response = {
      ok: true,
      data: {
        items: transformedItems,
        total: count || 0,
        page: limitNum ? 1 : pageNum,
        pageSize: limitNum || pageSizeNum
      }
    };
    
    console.log('Sending trades response:', response);
    return res.json(response);
    
  } catch (error) {
    console.error('Trades route error:', error);
    // Return empty array instead of 500
    return res.json({
      ok: true,
      data: {
        items: [],
        total: 0,
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 20
      }
    });
  }
});

// POST /api/admin/trade-outcome - Set outcome for a user's pending trade
router.post('/trade-outcome', async (req, res) => {
  try {
    const { userEmail, outcome } = req.body;
    
    // Validate inputs
    const validOutcomes = ['win', 'loss'];
    if (!userEmail || !validOutcomes.includes(outcome)) {
      return res.status(400).json({ 
        ok: false,
        code: 'invalid_input', 
        message: 'Invalid userEmail or outcome' 
      });
    }

    if (!serverSupabase) {
      return res.status(503).json({ 
        ok: false,
        code: 'misconfigured', 
        message: 'Database not configured' 
      });
    }
    
    // First find the user by email
    const { data: user, error: userError } = await serverSupabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        return res.status(404).json({ 
          ok: false,
          code: 'user_not_found', 
          message: 'User not found' 
        });
      }
      console.warn('Database error:', userError.message);
      return res.status(400).json({ 
        ok: false,
        code: 'update_failed', 
        message: 'Failed to find user' 
      });
    }
    
    // Find the latest pending trade for this user
    const { data: pendingTrade, error: tradeError } = await serverSupabase
      .from('trades')
      .select('id, amount, leverage')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (tradeError) {
      if (tradeError.code === 'PGRST116') {
        return res.status(400).json({ 
          ok: false,
          code: 'no_pending_trade', 
          message: 'No pending trade found for this user' 
        });
      }
      console.warn('Database error:', tradeError.message);
      return res.status(400).json({ 
        ok: false,
        code: 'update_failed', 
        message: 'Failed to find pending trade' 
      });
    }
    
    // Calculate PnL based on outcome (keep existing business logic)
    const pnl = pendingTrade.amount * pendingTrade.leverage * (outcome === 'win' ? 0.5 : -1);
    
    // Update the trade
    const { data: updatedTrade, error: updateError } = await serverSupabase
      .from('trades')
      .update({ 
        status: 'closed', 
        result: outcome, 
        pnl: pnl 
      })
      .eq('id', pendingTrade.id)
      .select(`
        id, 
        user_id, 
        symbol, 
        side, 
        amount, 
        leverage, 
        duration_sec, 
        status, 
        result, 
        pnl, 
        created_at,
        users!inner(email)
      `)
      .single();
    
    if (updateError) {
      console.warn('Database error:', updateError.message);
      return res.status(400).json({ 
        ok: false,
        code: 'update_failed', 
        message: 'Failed to update trade' 
      });
    }
    
    // Transform response
    const response = {
      id: updatedTrade.id,
      user_id: updatedTrade.user_id,
      email: updatedTrade.users?.email || 'Unknown',
      symbol: updatedTrade.symbol,
      side: updatedTrade.side,
      amount: updatedTrade.amount,
      leverage: updatedTrade.leverage,
      duration_sec: updatedTrade.duration_sec,
      status: updatedTrade.status,
      result: updatedTrade.result,
      pnl: updatedTrade.pnl,
      created_at: updatedTrade.created_at
    };
    
    return res.json({ ok: true, data: response });
    
  } catch (error) {
    console.error('Trade outcome error:', error);
    return res.status(400).json({ 
      ok: false,
      code: 'update_failed', 
      message: 'Failed to update trade outcome' 
    });
  }
});

module.exports = router;
