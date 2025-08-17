const express = require('express');
const { authenticateUser, requireAdmin } = require('../middleware/requireAdmin');
const { serverSupabase } = require('../lib/supabaseServer');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateUser, requireAdmin);

// Helper function to get withdrawal frequency for a user
const getWithdrawalFrequency = async (userId) => {
  try {
    if (!serverSupabase) {
      console.warn('serverSupabase not available for frequency calculation');
      return 0;
    }
    
    const { count, error } = await serverSupabase
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error counting withdrawals for frequency:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('Error in getWithdrawalFrequency:', err);
    return 0;
  }
};

// GET /api/admin/withdrawals
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/admin/withdrawals - Starting request');
    
    const {
      order_no,
      email,
      amount_min,
      amount_max,
      created_from,
      created_to,
      status = 'all',
      page = 1,
      page_size = 10
    } = req.query;

    console.log('Query parameters:', { order_no, email, amount_min, amount_max, created_from, created_to, status, page, page_size });

    // Validate page_size
    const validPageSizes = [10, 20, 50];
    const pageSize = validPageSizes.includes(parseInt(page_size)) ? parseInt(page_size) : 10;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const from = (pageNum - 1) * pageSize;
    const to = from + pageSize - 1;

    console.log('Pagination:', { pageNum, pageSize, from, to });

    // Check if serverSupabase is available
    if (!serverSupabase) {
      console.error('serverSupabase is not available - missing environment variables or initialization error');
      return res.json({
        ok: true,
        data: {
          items: [],
          total: 0,
          page: pageNum,
          page_size: pageSize,
          total_withdraw_usdt: 0
        }
      });
    }

    // Build query
    let query = serverSupabase
      .from('withdrawals')
      .select(`
        id,
        order_no,
        user_id,
        currency,
        withdrawal_amount,
        actual_amount,
        status,
        channel,
        address,
        operator,
        created_at,
        updated_at,
        users!inner(email)
      `);

    console.log('Base query built');

    // Apply filters
    if (order_no) {
      query = query.ilike('order_no', `${order_no}%`);
      console.log('Applied order_no filter:', order_no);
    }

    if (email) {
      query = query.ilike('users.email', `%${email}%`);
      console.log('Applied email filter:', email);
    }

    if (amount_min !== undefined && amount_min !== '') {
      query = query.gte('withdrawal_amount', parseFloat(amount_min));
      console.log('Applied amount_min filter:', amount_min);
    }

    if (amount_max !== undefined && amount_max !== '') {
      query = query.lte('withdrawal_amount', parseFloat(amount_max));
      console.log('Applied amount_max filter:', amount_max);
    }

    if (created_from) {
      query = query.gte('created_at', created_from);
      console.log('Applied created_from filter:', created_from);
    }

    if (created_to) {
      query = query.lte('created_at', created_to);
      console.log('Applied created_to filter:', created_to);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
      console.log('Applied status filter:', status);
    }

    // Get total count first
    console.log('Getting total count...');
    const { count: total, error: countError } = await serverSupabase
      .from('withdrawals')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting withdrawals:', countError);
      return res.json({
        ok: true,
        data: {
          items: [],
          total: 0,
          page: pageNum,
          page_size: pageSize,
          total_withdraw_usdt: 0
        }
      });
    }

    console.log('Total count:', total);

    // Get paginated results
    console.log('Getting paginated results...');
    const { data: withdrawals, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return res.json({
        ok: true,
        data: {
          items: [],
          total: 0,
          page: pageNum,
          page_size: pageSize,
          total_withdraw_usdt: 0
        }
      });
    }

    console.log('Raw withdrawals data:', withdrawals?.length || 0, 'items');

    // Process results
    console.log('Processing results...');
    const processedItems = await Promise.all((withdrawals || []).map(async (item) => {
      try {
        // Get withdrawal frequency for this user
        const frequency = await getWithdrawalFrequency(item.user_id);
        
        return {
          id: item.id,
          order_no: item.order_no || '—',
          email: item.users?.email || '—',
          currency: item.currency || 'USDT',
          withdrawal_amount: item.withdrawal_amount || 0,
          actual_amount: item.actual_amount || item.withdrawal_amount || 0,
          status: item.status || 'pending',
          frequency: frequency,
          channel: item.channel || '—',
          address: item.address || '—',
          created_at: item.created_at,
          operator: item.operator || '—',
          updated_at: item.updated_at || item.created_at
        };
      } catch (processError) {
        console.error('Error processing withdrawal item:', processError, 'Item:', item);
        return {
          id: item.id || 'unknown',
          order_no: item.order_no || '—',
          email: item.users?.email || '—',
          currency: 'USDT',
          withdrawal_amount: 0,
          actual_amount: 0,
          status: 'pending',
          frequency: 0,
          channel: '—',
          address: '—',
          created_at: item.created_at,
          operator: '—',
          updated_at: item.updated_at || item.created_at
        };
      }
    }));

    console.log('Processed items:', processedItems.length);

    // Calculate total USDT amount for filtered results
    let totalWithdrawUsdt = 0;
    if (processedItems.length > 0) {
      totalWithdrawUsdt = processedItems
        .filter(item => item.currency === 'USDT')
        .reduce((sum, item) => sum + (parseFloat(item.withdrawal_amount) || 0), 0);
    }

    console.log('Total USDT amount:', totalWithdrawUsdt);

    const response = {
      ok: true,
      data: {
        items: processedItems,
        total: total || 0,
        page: pageNum,
        page_size: pageSize,
        total_withdraw_usdt: totalWithdrawUsdt
      }
    };

    console.log('Sending response with', processedItems.length, 'items');
    res.json(response);

  } catch (err) {
    console.error('CRITICAL ERROR in GET /api/admin/withdrawals:', err);
    console.error('Error stack:', err.stack);
    // Return safe response instead of throwing
    res.json({
      ok: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        page_size: 10,
        total_withdraw_usdt: 0
      }
    });
  }
});

// POST /api/admin/withdrawals/:id/lock
router.post('/:id/lock', async (req, res) => {
  try {
    console.log('POST /api/admin/withdrawals/:id/lock - Starting request');
    
    const { id } = req.params;
    const adminEmail = req.user?.email || 'admin';

    console.log('Lock request for ID:', id, 'by admin:', adminEmail);

    // Check if serverSupabase is available
    if (!serverSupabase) {
      console.error('serverSupabase not available for lock operation');
      return res.status(500).json({
        ok: false,
        code: 'service_unavailable',
        message: 'Database service unavailable'
      });
    }

    // Check if withdrawal exists and is not already locked
    console.log('Checking if withdrawal exists...');
    const { data: existing, error: fetchError } = await serverSupabase
      .from('withdrawals')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching withdrawal for lock:', fetchError);
      return res.status(404).json({
        ok: false,
        code: 'not_found',
        message: 'Withdrawal not found'
      });
    }

    if (!existing) {
      console.error('Withdrawal not found for lock:', id);
      return res.status(404).json({
        ok: false,
        code: 'not_found',
        message: 'Withdrawal not found'
      });
    }

    console.log('Existing withdrawal status:', existing.status);

    if (existing.status === 'locked') {
      console.log('Withdrawal already locked:', id);
      return res.status(400).json({
        ok: false,
        code: 'already_locked',
        message: 'Withdrawal is already locked'
      });
    }

    // Update withdrawal
    console.log('Updating withdrawal status to locked...');
    const { data: updated, error: updateError } = await serverSupabase
      .from('withdrawals')
      .update({
        status: 'locked',
        operator: adminEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating withdrawal for lock:', updateError);
      return res.status(500).json({
        ok: false,
        code: 'internal_error',
        message: 'Failed to lock withdrawal'
      });
    }

    console.log('Withdrawal locked successfully:', updated.id);

    res.json({
      ok: true,
      data: {
        id: updated.id,
        status: updated.status,
        operator: updated.operator,
        updated_at: updated.updated_at
      }
    });

  } catch (err) {
    console.error('CRITICAL ERROR in POST /api/admin/withdrawals/:id/lock:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      ok: false,
      code: 'internal_error',
      message: 'Something went wrong'
    });
  }
});

// POST /api/admin/withdrawals/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    console.log('POST /api/admin/withdrawals/:id/reject - Starting request');
    
    const { id } = req.params;
    const adminEmail = req.user?.email || 'admin';

    console.log('Reject request for ID:', id, 'by admin:', adminEmail);

    // Check if serverSupabase is available
    if (!serverSupabase) {
      console.error('serverSupabase not available for reject operation');
      return res.status(500).json({
        ok: false,
        code: 'service_unavailable',
        message: 'Database service unavailable'
      });
    }

    // Check if withdrawal exists and is not already rejected
    console.log('Checking if withdrawal exists...');
    const { data: existing, error: fetchError } = await serverSupabase
      .from('withdrawals')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching withdrawal for reject:', fetchError);
      return res.status(404).json({
        ok: false,
        code: 'not_found',
        message: 'Withdrawal not found'
      });
    }

    if (!existing) {
      console.error('Withdrawal not found for reject:', id);
      return res.status(404).json({
        ok: false,
        code: 'not_found',
        message: 'Withdrawal not found'
      });
    }

    console.log('Existing withdrawal status:', existing.status);

    if (existing.status === 'rejected') {
      console.log('Withdrawal already rejected:', id);
      return res.status(400).json({
        ok: false,
        code: 'already_rejected',
        message: 'Withdrawal is already rejected'
      });
    }

    // Update withdrawal
    console.log('Updating withdrawal status to rejected...');
    const { data: updated, error: updateError } = await serverSupabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        operator: adminEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating withdrawal for reject:', updateError);
      return res.status(500).json({
        ok: false,
        code: 'internal_error',
        message: 'Failed to reject withdrawal'
      });
    }

    console.log('Withdrawal rejected successfully:', updated.id);

    res.json({
      ok: true,
      data: {
        id: updated.id,
        status: updated.status,
        operator: updated.operator,
        updated_at: updated.updated_at
      }
    });

  } catch (err) {
    console.error('CRITICAL ERROR in POST /api/admin/withdrawals/:id/reject:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      ok: false,
      code: 'internal_error',
      message: 'Something went wrong'
    });
  }
});

module.exports = router;
