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

// PATCH /api/admin/users/:id/edit - Edit user details (password, withdrawal password, wallet addresses, credit score, VIP level)
router.patch('/:id/edit', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password, withdraw_password, wallets, credit_score, vip_level } = req.body;
    
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
      .select('id, email, usdt_withdraw_address, btc_withdraw_address, eth_withdraw_address, trx_withdraw_address, xrp_withdraw_address, credit_score, vip_level')
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

    // Update credit score if provided
    if (credit_score !== undefined && credit_score !== null && credit_score !== '') {
      const creditScoreNum = parseInt(credit_score);
      if (!isNaN(creditScoreNum) && creditScoreNum >= 0 && creditScoreNum <= 1000) {
        updates.credit_score = creditScoreNum;
      }
    }

    // Update VIP level if provided
    if (vip_level && vip_level.trim()) {
      updates.vip_level = vip_level.trim();
    }

    // Only update database if there are changes
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      
      const { data: updatedUser, error: updateError } = await serverSupabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, email, usdt_withdraw_address, btc_withdraw_address, eth_withdraw_address, trx_withdraw_address, xrp_withdraw_address, credit_score, vip_level')
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
      
      // Include credit score and VIP level if they are defined
      if (updatedUser.credit_score !== undefined) responseData.credit_score = updatedUser.credit_score;
      if (updatedUser.vip_level !== undefined) responseData.vip_level = updatedUser.vip_level;
      
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

// GET /api/admin/users/kyc - Get users with KYC information
router.get('/kyc', authenticateUser, requireAdmin, async (req, res) => {
  console.log('🎯 [KYC] Route handler reached - user:', req.user?.email);
  try {
    const { status } = req.query;
    console.log('🔍 [KYC] Query status filter:', status);
    
    let query = serverSupabase
      .from('users')
      .select(`
        id, 
        email, 
        username,
        first_name,
        last_name,
        kyc_status,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
    
    // Filter by KYC status if provided
    if (status && ['pending', 'approved', 'rejected', 'not_submitted'].includes(status)) {
      query = query.eq('kyc_status', status);
    }
    
    const { data: users, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Transform data to match frontend expectations
    const transformedUsers = users.map(user => ({
      id: user.id,
      user: user.email,
      status: user.kyc_status || 'not_submitted',
      submittedAt: user.updated_at || user.created_at,
      documents: [], // We'll add document handling later if needed
      notes: user.kyc_status === 'approved'
        ? `Verified on ${new Date(user.updated_at).toLocaleDateString()}`
        : user.kyc_status === 'rejected'
        ? 'KYC verification rejected'
        : user.kyc_status === 'pending'
        ? 'KYC verification pending review'
        : 'KYC not submitted',
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name
    }));
    
    res.json({
      ok: true,
      data: transformedUsers
    });
  } catch (error) {
    console.error('GET /api/admin/users/kyc failed:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to fetch KYC data'
    });
  }
});

// PATCH /api/admin/users/:id/kyc - Update user KYC status
router.patch('/:id/kyc', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!id) {
      return res.status(400).json({
        ok: false,
        code: 'bad_request',
        message: 'User id required'
      });
    }
    
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        ok: false,
        code: 'bad_request',
        message: 'Valid status required (approved, rejected, pending)'
      });
    }
    
    const updates = {
      kyc_status: status,
      updated_at: new Date().toISOString()
    };
    
    // Note: kyc_verified_at column doesn't exist in current database schema
    // Only updating kyc_status for now
    
    // Note: admin_notes column doesn't exist in database
    // Notes functionality can be added later if needed
    
    const { data: user, error } = await serverSupabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, kyc_status')
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        status: user.kyc_status
      }
    });
  } catch (error) {
    console.error('PATCH /api/admin/users/:id/kyc failed:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to update KYC status'
    });
  }
});

module.exports = router;
