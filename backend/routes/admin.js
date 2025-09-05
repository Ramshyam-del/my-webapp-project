const express = require('express');
const { authenticateUser, requireAdmin } = require('../middleware/requireAdmin');
const { serverSupabase } = require('../lib/supabaseServer');
const adminUsersRouter = require('./adminUsers');

const router = express.Router();

// Mount users routes
router.use('/users', adminUsersRouter);

// GET /api/admin/health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// GET /api/admin/me - Get current admin user info
router.get('/me', authenticateUser, requireAdmin, (req, res) => {
  try {
    res.json({
      ok: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status
      }
    });
  } catch (error) {
    console.error('Admin me error:', error);
    res.status(401).json({
      ok: false,
      code: 'unauthorized',
      message: 'Failed to get admin info'
    });
  }
});

// GET /api/admin/users - Get all users (admin only)
router.get('/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    if (!serverSupabase) {
      return res.json({
        ok: true,
        data: {
          items: [],
          total: 0
        }
      });
    }

    const { data: users, error } = await serverSupabase
      .from('users')
      .select('id, email, role, status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Users query error:', error.message);
      return res.json({
        ok: true,
        data: {
          items: [],
          total: 0
        }
      });
    }
    
    res.json({
      ok: true,
      data: {
        items: users || [],
        total: users?.length || 0
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.json({
      ok: true,
      data: {
        items: [],
        total: 0
      }
    });
  }
});

// PATCH /api/admin/users/:id - Update user (admin only)
router.patch('/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;
    
    if (!serverSupabase) {
      return res.status(503).json({
        ok: false,
        code: 'misconfigured',
        message: 'Database not configured'
      });
    }
    
    const updates = {};
    if (role && ['user', 'admin'].includes(role)) {
      updates.role = role;
    }
    if (status && ['active', 'suspended'].includes(status)) {
      updates.status = status;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_input',
        message: 'No valid updates provided'
      });
    }
    
    updates.updated_at = new Date().toISOString();
    
    const { data: user, error } = await serverSupabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, role, status')
      .single();
    
    if (error) {
      console.warn('Update user error:', error.message);
      return res.status(400).json({
        ok: false,
        code: 'update_failed',
        message: 'Failed to update user'
      });
    }
    
    res.json({
      ok: true,
      data: user
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(400).json({
      ok: false,
      code: 'update_failed',
      message: 'Failed to update user'
    });
  }
});

// GET /api/admin/withdrawals - Get withdrawals (admin only)
router.get('/withdrawals', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status = 'all', page = 1, pageSize = 20 } = req.query;
    
    let query = serverSupabase
      .from('withdrawals')
      .select(`
        id, 
        user_id, 
        amount, 
        status, 
        created_at,
        users!inner(email)
      `)
      .order('created_at', { ascending: false });
    
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data: withdrawals, error } = await query;
    
    if (error) {
      throw error;
    }
    
    res.json({
      ok: true,
      data: {
        items: withdrawals || [],
        total: withdrawals?.length || 0
      }
    });
  } catch (error) {
    console.error('Admin withdrawals error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to get withdrawals'
    });
  }
});

// POST /api/admin/withdrawals/:id/approve - Approve withdrawal
router.post('/withdrawals/:id/approve', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: withdrawal, error } = await serverSupabase
      .from('withdrawals')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('*')
      .single();
    
    if (error || !withdrawal) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_request',
        message: 'Withdrawal not found or not pending'
      });
    }
    
    res.json({
      ok: true,
      data: withdrawal
    });
  } catch (error) {
    console.error('Admin approve withdrawal error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to approve withdrawal'
    });
  }
});

// POST /api/admin/withdrawals/:id/reject - Reject withdrawal
router.post('/withdrawals/:id/reject', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: withdrawal, error } = await serverSupabase
      .from('withdrawals')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('*')
      .single();
    
    if (error || !withdrawal) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_request',
        message: 'Withdrawal not found or not pending'
      });
    }
    
    res.json({
      ok: true,
      data: withdrawal
    });
  } catch (error) {
    console.error('Admin reject withdrawal error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to reject withdrawal'
    });
  }
});

// GET /api/admin/trades - Get trades (admin only)
router.get('/trades', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status = 'all', page = 1, pageSize = 20, limit } = req.query;
    
    let query = serverSupabase
      .from('trading_orders')
      .select(`
        id, 
        user_id, 
        symbol, 
        side, 
        amount, 
        leverage, 
        duration, 
        status, 
        result, 
        profit_loss, 
        created_at,
        users!inner(email)
      `)
      .order('created_at', { ascending: false });
    
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const { data: trades, error } = await query;
    
    if (error) {
      throw error;
    }
    
    res.json({
      ok: true,
      data: {
        items: trades || [],
        total: trades?.length || 0
      }
    });
  } catch (error) {
    console.error('Admin trades error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to get trades'
    });
  }
});

// POST /api/admin/trade-outcome - Set trade outcome
router.post('/trade-outcome', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userEmail, outcome } = req.body;
    
    if (!userEmail || !outcome || !['win', 'loss'].includes(outcome)) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_input',
        message: 'userEmail and outcome (win/loss) required'
      });
    }
    
    // Find user by email
    const { data: user, error: userError } = await serverSupabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (userError || !user) {
      return res.status(400).json({
        ok: false,
        code: 'user_not_found',
        message: 'User not found'
      });
    }
    
    // Find latest pending trade for this user
    const { data: trade, error: tradeError } = await serverSupabase
      .from('trading_orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (tradeError || !trade) {
      return res.status(400).json({
        ok: false,
        code: 'no_pending_trade',
        message: 'No pending trade found for this user'
      });
    }
    
    // Calculate PnL
    const pnl = trade.amount * trade.leverage * (outcome === 'win' ? 0.5 : -1);
    
    // Update trade
    const { data: updatedTrade, error: updateError } = await serverSupabase
      .from('trading_orders')
      .update({
        status: 'closed',
        result: outcome,
        profit_loss: pnl,
        updated_at: new Date().toISOString()
      })
      .eq('id', trade.id)
      .select('*')
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    res.json({
      ok: true,
      data: updatedTrade
    });
  } catch (error) {
    console.error('Admin trade outcome error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to set trade outcome'
    });
  }
});

module.exports = router;
