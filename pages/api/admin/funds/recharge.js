import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user info
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const { userId, currency, amount, adminId, remark } = req.body || {};
    const amt = Number(amount);
    
    if (!userId || !currency || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid input' });
    }

    // Use the adjust_balance function to safely add balance
    const { data: adjustResult, error: adjustError } = await supabaseAdmin
      .rpc('adjust_balance', {
        p_user_id: userId,
        p_currency: currency,
        p_delta: amt
      });

    if (adjustError) {
      console.error('Balance adjustment error:', adjustError);
      return res.status(500).json({ ok: false, error: 'Failed to adjust balance: ' + adjustError.message });
    }

    // Get the updated balance for response
    const { data: updatedPortfolio, error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .select('balance')
      .eq('user_id', userId)
      .eq('currency', currency)
      .single();

    const newBalance = updatedPortfolio?.balance || 0;


    // Record fund transaction
    const { error: txError } = await supabaseAdmin
      .from('fund_transactions')
      .insert({
        user_id: userId,
        currency,
        amount: amt,
        type: 'recharge',
        status: 'completed',
        remark: remark || null,
        admin_id: adminId || user.id
      });

    if (txError) {
      console.error('Transaction record error:', txError);
      // Don't fail the request if transaction logging fails
    }

    // Manually trigger real-time balance update via HTTP request to backend
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:4001';
      await fetch(`${backendUrl}/api/trigger-balance-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ userId })
      });
      console.log('Balance update triggered for user:', userId);
    } catch (triggerError) {
      console.error('Failed to trigger balance update:', triggerError);
      // Don't fail the main request if trigger fails
    }

    res.status(200).json({
      ok: true,
      data: {
        userId,
        currency,
        amount: amt,
        newBalance,
        transactionId: Date.now().toString()
      }
    });

  } catch (error) {
    console.error('Recharge API error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
