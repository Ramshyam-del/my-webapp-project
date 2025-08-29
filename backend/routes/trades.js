const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { parseDurationToMs } = require('../lib/duration');

router.post('/', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ ok:false, error:'Supabase not configured' });
    const { userId, userName, currency, pair, leverage, duration, amount } = req.body || {};
    const amt = Number(amount);
    if (!userId || !userName || !currency || !pair || !leverage || !duration || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ ok:false, error:'Invalid input' });
    }

    // Check current balance
    const { data: pf } = await supabaseAdmin.from('portfolios')
      .select('balance').eq('user_id', userId).eq('currency', currency).maybeSingle();
    const bal = Number(pf?.balance ?? 0);
    if (bal <= 0 || bal < amt) return res.status(400).json({ ok:false, error:'Insufficient balance' });

    const now = new Date();
    const expiry = new Date(now.getTime() + parseDurationToMs(duration));

    const { data, error } = await supabaseAdmin.from('trades').insert([{
      user_id: String(userId),
      user_name: String(userName),
      currency: String(currency),
      pair: String(pair),
      leverage: Number(leverage),
      duration: String(duration),
      amount: amt,
      start_ts: now.toISOString(),
      expiry_ts: expiry.toISOString(),
      status: 'OPEN'
    }]).select().single();

    if (error) throw error;
    res.json({ ok:true, trade: data });
  } catch (e) {
    console.error('[trades/open]', e);
    res.status(500).json({ ok:false, error:'Internal error' });
  }
});

module.exports = router;
