import { supabaseAdmin } from '../../../../backend/lib/supabaseAdmin';

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

    // Upsert portfolio - create if doesn't exist, update if exists
    const { data: pf, error: pfError } = await supabaseAdmin
      .from('portfolios')
      .upsert(
        { user_id: userId, currency, balance: 0 },
        { onConflict: 'user_id,currency', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (pfError) {
      console.error('Portfolio upsert error:', pfError);
      return res.status(500).json({ ok: false, error: 'Failed to update portfolio' });
    }

    // Update balance
    const newBalance = Number(pf.balance) + amt;
    const { error: updateError } = await supabaseAdmin
      .from('portfolios')
      .update({ balance: newBalance })
      .eq('user_id', userId)
      .eq('currency', currency);

    if (updateError) {
      console.error('Balance update error:', updateError);
      return res.status(500).json({ ok: false, error: 'Failed to update balance' });
    }

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
