const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabaseAdmin');

// Admin auth is handled by middleware

router.post('/recharge', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ ok:false, error:'Supabase not configured' });
    const { userId, currency, amount, adminId } = req.body || {};
    const amt = Number(amount);
    if (!userId || !currency || !Number.isFinite(amt) || amt <= 0) return res.status(400).json({ ok:false, error:'Invalid input' });

    const { data: pf, error: rpcErr } = await supabaseAdmin.rpc('adjust_balance', {
      p_user_id: String(userId), p_currency: String(currency), p_delta: amt
    });
    if (rpcErr) throw rpcErr;

    await supabaseAdmin.from('fund_transactions').insert([{
      user_id: String(userId), currency: String(currency), amount: amt, type: 'RECHARGE', created_by: adminId || null
    }]);

    res.json({ ok:true, portfolio: pf && pf[0] ? pf[0] : null });
  } catch (e) {
    console.error('[funds/recharge]', e);
    res.status(500).json({ ok:false, error:'Internal error' });
  }
});

router.post('/withdraw', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ ok:false, error:'Supabase not configured' });
    const { userId, currency, amount, adminId } = req.body || {};
    const amt = Number(amount);
    if (!userId || !currency || !Number.isFinite(amt) || amt <= 0) return res.status(400).json({ ok:false, error:'Invalid input' });

    const { data: pf, error: rpcErr } = await supabaseAdmin.rpc('adjust_balance', {
      p_user_id: String(userId), p_currency: String(currency), p_delta: -amt
    });
    if (rpcErr) {
      if ((rpcErr.message || '').includes('INSUFFICIENT_FUNDS')) {
        return res.status(400).json({ ok:false, error:'Insufficient balance' });
      }
      throw rpcErr;
    }

    await supabaseAdmin.from('fund_transactions').insert([{
      user_id: String(userId), currency: String(currency), amount: -amt, type: 'WITHDRAW', created_by: adminId || null
    }]);

    res.json({ ok:true, portfolio: pf && pf[0] ? pf[0] : null });
  } catch (e) {
    console.error('[funds/withdraw]', e);
    res.status(500).json({ ok:false, error:'Internal error' });
  }
});

module.exports = router;
