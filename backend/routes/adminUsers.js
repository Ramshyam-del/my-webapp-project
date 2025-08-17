const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateUser, requireAdmin } = require('../middleware/requireAdmin');
const { serverSupabase } = require('../lib/supabaseServer');

const router = express.Router();

// GET /api/admin/users - List users with pagination and search
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { q, page = 1, pageSize = 20, sort = 'created_at', dir = 'desc' } = req.query;
    
    let query = serverSupabase
      .from('users')
      .select('id, email, role, status, created_at')
      .order(sort, { ascending: dir === 'asc' });
    
    // Add search filter if provided
    if (q) {
      query = query.ilike('email', `%${q}%`);
    }
    
    const { data: users, error } = await query;
    
    if (error) {
      throw error;
    }
    
    res.json({
      ok: true,
      data: {
        items: users || [],
        total: users?.length || 0
      }
    });
  } catch (error) {
    console.error('GET /api/admin/users failed:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to fetch users'
    });
  }
});

// PATCH /api/admin/users/:id - Update user role/status
router.patch('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;
    
    if (!id) {
      return res.status(400).json({
        ok: false,
        code: 'bad_request',
        message: 'User id required'
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
        code: 'bad_request',
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
      throw error;
    }
    
    res.json({
      ok: true,
      data: user
    });
  } catch (error) {
    console.error('PATCH /api/admin/users/:id failed:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to update user'
    });
  }
});

// PATCH /api/admin/users/:id/edit - Edit user details (password, withdrawal password, wallet addresses)
router.patch('/:id/edit', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password, withdraw_password, wallets } = req.body;
    
    if (!id) {
      return res.status(400).json({
        ok: false,
        code: 'bad_request',
        message: 'User id required'
      });
    }

    // Get current user data
    const { data: currentUser, error: fetchError } = await serverSupabase
      .from('users')
      .select('id, email, usdt_withdraw_address, btc_withdraw_address, eth_withdraw_address, trx_withdraw_address, xrp_withdraw_address')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const updates = {};

    // Update password if provided
    if (password && password.trim()) {
      try {
        // Update password via Supabase Admin API
        const { error: passwordError } = await serverSupabase.auth.admin.updateUserById(id, {
          password: password.trim()
        });
        
        if (passwordError) {
          throw passwordError;
        }
      } catch (passwordError) {
        console.error('Password update error:', passwordError);
        return res.status(400).json({
          ok: false,
          code: 'bad_request',
          message: 'Failed to update password'
        });
      }
    }

    // Update withdrawal password if provided
    if (withdraw_password && withdraw_password.trim()) {
      const hashedPassword = await bcrypt.hash(withdraw_password.trim(), 10);
      updates.withdraw_password_hash = hashedPassword;
    }

    // Update wallet addresses if provided
    if (wallets) {
      if (wallets.usdt) updates.usdt_withdraw_address = wallets.usdt.trim();
      if (wallets.btc) updates.btc_withdraw_address = wallets.btc.trim();
      if (wallets.eth) updates.eth_withdraw_address = wallets.eth.trim();
      if (wallets.trx) updates.trx_withdraw_address = wallets.trx.trim();
      if (wallets.xrp) updates.xrp_withdraw_address = wallets.xrp.trim();
    }

    // Only update database if there are changes
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      
      const { data: updatedUser, error: updateError } = await serverSupabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, email, usdt_withdraw_address, btc_withdraw_address, eth_withdraw_address, trx_withdraw_address, xrp_withdraw_address')
        .single();

      if (updateError) {
        throw updateError;
      }

      // Ensure consistent response shape with only defined fields
      const responseData = {
        id: updatedUser.id,
        email: updatedUser.email
      };
      
      // Only include wallet fields if they are defined (not undefined)
      if (updatedUser.usdt_withdraw_address !== undefined) responseData.usdt_withdraw_address = updatedUser.usdt_withdraw_address;
      if (updatedUser.btc_withdraw_address !== undefined) responseData.btc_withdraw_address = updatedUser.btc_withdraw_address;
      if (updatedUser.eth_withdraw_address !== undefined) responseData.eth_withdraw_address = updatedUser.eth_withdraw_address;
      if (updatedUser.trx_withdraw_address !== undefined) responseData.trx_withdraw_address = updatedUser.trx_withdraw_address;
      if (updatedUser.xrp_withdraw_address !== undefined) responseData.xrp_withdraw_address = updatedUser.xrp_withdraw_address;
      
      res.json({
        ok: true,
        data: responseData
      });
    } else {
      // No database updates, return current user data with only defined fields
      const responseData = {
        id: currentUser.id,
        email: currentUser.email
      };
      
      // Only include wallet fields if they are defined (not undefined)
      if (currentUser.usdt_withdraw_address !== undefined) responseData.usdt_withdraw_address = currentUser.usdt_withdraw_address;
      if (currentUser.btc_withdraw_address !== undefined) responseData.btc_withdraw_address = currentUser.btc_withdraw_address;
      if (currentUser.eth_withdraw_address !== undefined) responseData.eth_withdraw_address = currentUser.eth_withdraw_address;
      if (currentUser.trx_withdraw_address !== undefined) responseData.trx_withdraw_address = currentUser.trx_withdraw_address;
      if (currentUser.xrp_withdraw_address !== undefined) responseData.xrp_withdraw_address = currentUser.xrp_withdraw_address;
      
      res.json({
        ok: true,
        data: responseData
      });
    }
  } catch (error) {
    console.error('PATCH /api/admin/users/:id/edit failed:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to update user'
    });
  }
});

module.exports = router;
