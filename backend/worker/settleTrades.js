const cron = require('node-cron');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { computeProfit } = require('../lib/settlement');

async function settleBatch() {
  try {
    if (!supabaseAdmin) { console.warn('[settle] Supabase not configured'); return; }
    const nowIso = new Date().toISOString();

    const { data: trades, error } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('settled', false)
      .lte('expiry_ts', nowIso)
      .order('expiry_ts', { ascending: true })
      .limit(100);

    if (error) { console.error('[settle] fetch error:', error); return; }
    if (!trades?.length) return;

    for (const t of trades) {
      try {
        let outcome = 'LOSS';
        let pnl = 0;

        if (t.admin_decision === 'WIN') {
          pnl = computeProfit({ amount: t.amount, leverage: t.leverage, duration: t.duration });
          outcome = 'WIN';
        } else {
          pnl = -Number(t.amount);
          outcome = 'LOSS';
        }

        const delta = outcome === 'WIN' ? pnl : -Number(t.amount);

        const { error: balErr } = await supabaseAdmin.rpc('adjust_balance', {
          p_user_id: t.user_id, p_currency: t.currency, p_delta: delta
        });
        if (balErr) throw balErr;

        const { error: updErr } = await supabaseAdmin.from('trades').update({
          outcome, pnl,
          settled: true,
          settled_at: new Date().toISOString(),
          status: 'SETTLED',
          updated_at: new Date().toISOString()
        }).eq('id', t.id);
        if (updErr) throw updErr;
      } catch (e) {
        console.error('[settle] trade failed', t.id, e.message);
      }
    }
  } catch (e) {
    console.error('[settle] batch error', e);
  }
}

function startSettlementWorker() {
  cron.schedule('*/15 * * * * *', settleBatch, { timezone: 'UTC' });
  console.log('[settle] worker scheduled every 15s');
}
module.exports = { startSettlementWorker };
