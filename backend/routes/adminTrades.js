const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabaseAdmin');

// Admin auth is handled by middleware
function cleanSearch(s){ return String(s||'').trim().replace(/[,]/g,' ').replace(/[%_]/g,'').replace(/\s+/g,' '); }

router.get('/', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ ok:false, error:'Supabase not configured' });
    const rawStatus = (req.query.status||'').toString().toUpperCase();
    const status = ['OPEN','SETTLED','WIN','LOSS'].includes(rawStatus) ? rawStatus : undefined; // allow legacy
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const search = cleanSearch(req.query.search);

    let q = supabaseAdmin.from('trades').select('*', { count: 'exact' });
    if (rawStatus === 'WIN') q = q.eq('outcome','WIN');
    else if (rawStatus === 'LOSS') q = q.eq('outcome','LOSS');
    else if (rawStatus === 'OPEN' || rawStatus === 'SETTLED') q = q.eq('status', rawStatus);

    if (search) q = q.or(`user_name.ilike.%${search}%,pair.ilike.%${search}%,user_id.ilike.%${search}%`);
    q = q.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await q;
    if (error) throw error;

    res.json({ ok:true, items: data||[], page, limit, total: count||0, pages: Math.max(1, Math.ceil((count||0)/limit)) });
  } catch (e) {
    console.error('[admin list]', e);
    res.status(500).json({ ok:false, error:'Internal error' });
  }
});

module.exports = router;
