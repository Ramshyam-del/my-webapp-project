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
        currency,
        amount,
        fee,
        net_amount,
        wallet_address,
        tx_hash,
        status,
        admin_notes,
        created_at,
        updated_at,
        processed_at,
        users!inner(email, username)
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
    const { admin_note } = req.body;
    
    // First, get the withdrawal details
    const { data: withdrawal, error: withdrawalError } = await serverSupabase
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (withdrawalError || !withdrawal) {
      return res.status(404).json({
        ok: false,
        code: 'withdrawal_not_found',
        message: 'Withdrawal not found'
      });
    }
    
    if (withdrawal.status === 'approved') {
      return res.status(400).json({
        ok: false,
        code: 'already_approved',
        message: 'Withdrawal is already approved'
      });
    }
    
    if (!['pending', 'locked'].includes(withdrawal.status)) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_status',
        message: 'Can only approve pending or locked withdrawals'
      });
    }
    
    // Check user's current balance
    const { data: portfolio, error: portfolioError } = await serverSupabase
      .from('portfolios')
      .select('balance')
      .eq('user_id', withdrawal.user_id)
      .eq('currency', withdrawal.currency)
      .single();
    
    if (portfolioError || !portfolio) {
      return res.status(400).json({
        ok: false,
        code: 'insufficient_balance',
        message: 'User portfolio not found or insufficient balance'
      });
    }
    
    const currentBalance = parseFloat(portfolio.balance);
    const withdrawalAmount = parseFloat(withdrawal.amount);
    
    if (currentBalance < withdrawalAmount) {
      return res.status(400).json({
        ok: false,
        code: 'insufficient_balance',
        message: `Insufficient balance. Available: ${currentBalance} ${withdrawal.currency}, Required: ${withdrawalAmount} ${withdrawal.currency}`
      });
    }
    
    // Update withdrawal status
    const { data: updatedWithdrawal, error: updateError } = await serverSupabase
      .from('withdrawals')
      .update({ 
        status: 'approved',
        admin_notes: admin_note || null,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error approving withdrawal:', updateError);
      return res.status(500).json({
        ok: false,
        code: 'database_error',
        message: 'Failed to approve withdrawal'
      });
    }
    
    // Deduct balance from user's portfolio
    const newBalance = currentBalance - withdrawalAmount;
    const { error: balanceUpdateError } = await serverSupabase
      .from('portfolios')
      .update({ balance: newBalance })
      .eq('user_id', withdrawal.user_id)
      .eq('currency', withdrawal.currency);
    
    if (balanceUpdateError) {
      console.error('Error updating balance:', balanceUpdateError);
      // Rollback withdrawal status
      await serverSupabase
        .from('withdrawals')
        .update({ status: withdrawal.status })
        .eq('id', id);
      
      return res.status(500).json({
        ok: false,
        code: 'balance_update_failed',
        message: 'Failed to update user balance'
      });
    }
    
    res.json({
      ok: true,
      data: updatedWithdrawal,
      message: 'Withdrawal approved successfully and balance deducted'
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
    const { admin_note } = req.body;
    
    const { data: withdrawal, error } = await serverSupabase
      .from('withdrawals')
      .update({ 
        status: 'rejected',
        admin_notes: admin_note || null,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .in('status', ['pending', 'locked'])
      .select('*')
      .single();
    
    if (error || !withdrawal) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_request',
        message: 'Withdrawal not found or cannot be rejected'
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

// POST /api/admin/withdrawals/:id/lock - Lock withdrawal for processing
router.post('/withdrawals/:id/lock', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: withdrawal, error } = await serverSupabase
      .from('withdrawals')
      .update({ 
        status: 'locked',
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
        message: 'Withdrawal not found or already processed'
      });
    }
    
    res.json({
      ok: true,
      data: withdrawal
    });
  } catch (error) {
    console.error('Admin lock withdrawal error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to lock withdrawal'
    });
  }
});

// GET /api/admin/trades - Get trades (admin only)
router.get('/trades', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status = 'all', page = 1, pageSize = 20, limit } = req.query;
    
    let query = serverSupabase
      .from('trades')
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
    const { tradeId, outcome } = req.body;
    
    if (!tradeId || !outcome || !['win', 'loss'].includes(outcome)) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_input',
        message: 'tradeId and outcome (win/loss) required'
      });
    }
    
    // Find trade by ID
    const { data: trade, error: tradeError } = await serverSupabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('trade_result', 'pending')
      .single();
    
    if (tradeError || !trade) {
      return res.status(400).json({
        ok: false,
        code: 'trade_not_found',
        message: 'Trade not found or already completed'
      });
    }
    
    // Calculate PnL
    const pnl = trade.amount * trade.leverage * (outcome === 'win' ? 0.5 : -1);
    
    // Update trade
    const { data: updatedTrade, error: updateError } = await serverSupabase
      .from('trades')
      .update({
        status: 'completed',
        trade_result: outcome,
        final_pnl: pnl,
        result_determined_at: new Date().toISOString(),
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
