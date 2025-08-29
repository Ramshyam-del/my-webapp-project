const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabaseAdmin');

// Admin auth is handled by middleware

router.patch('/:id/decision', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ ok:false, error:'Supabase not configured' });
    const { id } = req.params;
    const { decision } = req.body || {};
    if (!id || !['WIN','LOSS'].includes(decision)) return res.status(400).json({ ok:false, error:'Invalid input' });

    const { data: t, error: fErr } = await supabaseAdmin.from('trades').select('settled').eq('id', id).single();
    if (fErr || !t) return res.status(404).json({ ok:false, error:'Trade not found' });
    if (t.settled) return res.status(400).json({ ok:false, error:'Already settled' });

    const { data: updated, error: uErr } = await supabaseAdmin.from('trades')
      .update({ admin_decision: decision, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (uErr) throw uErr;

    res.json({ ok:true, trade: updated });
  } catch (e) {
    console.error('[admin decision]', e);
    res.status(500).json({ ok:false, error:'Internal error' });
  }
});

module.exports = router;
