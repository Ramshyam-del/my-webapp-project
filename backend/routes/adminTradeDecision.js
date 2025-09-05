const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { computeProfit } = require('../lib/settlement');

// Admin auth is handled by middleware

router.patch('/:id/decision', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ ok:false, error:'Supabase not configured' });
    const { id } = req.params;
    const { decision } = req.body || {};
    if (!id || !['WIN','LOSS'].includes(decision)) return res.status(400).json({ ok:false, error:'Invalid input' });

    // Fetch full trade details for validation and PnL calculation
    const { data: t, error: fErr } = await supabaseAdmin.from('trades')
      .select('*')
      .eq('id', id)
      .single();
    if (fErr || !t) return res.status(404).json({ ok:false, error:'Trade not found' });
    if (t.settled === true) return res.status(400).json({ ok:false, error:'Trade already settled' });
    
    // Check if trade has expired (optional validation)
    const now = new Date();
    const isExpired = t.expiry_ts && new Date(t.expiry_ts) < now;
    
    // Calculate PnL based on decision
    let pnl = 0;
    let delta = 0; // Balance adjustment needed
    
    if (decision === 'WIN') {
      pnl = computeProfit({ amount: t.amount, leverage: t.leverage, duration: t.duration });
      // For wins: return original amount + profit
      delta = Number(t.amount) + pnl;
    } else {
      pnl = -Number(t.amount);
      // For losses: do nothing (amount was already deducted when trade was created)
      delta = 0;
    }
    const { error: balErr } = await supabaseAdmin.rpc('adjust_balance', {
      p_user_id: t.user_id, 
      p_currency: t.currency, 
      p_delta: delta
    });
    if (balErr) throw balErr;

    // Update trade with decision, outcome, PnL, and settlement status
    const { data: updated, error: uErr } = await supabaseAdmin.from('trades')
      .update({ 
        admin_decision: decision, 
        outcome: decision, 
        pnl: pnl,
        settled: true, 
        settled_at: new Date().toISOString(), 
        status: 'SETTLED',
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    if (uErr) throw uErr;

    res.json({ ok:true, trade: updated, message: `Trade marked as ${decision} successfully` });
  } catch (e) {
    console.error('[admin decision]', e);
    res.status(500).json({ ok:false, error:'Internal error' });
  }
});

module.exports = router;
