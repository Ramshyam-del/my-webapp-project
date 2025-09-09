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
        let delta = 0; // Balance adjustment needed

        // Use admin_action if available, otherwise default to LOSS
        if (t.admin_action === 'win') {
          pnl = computeProfit({ amount: t.amount, leverage: t.leverage, duration: t.duration });
          outcome = 'WIN';
          // For wins: return original amount + profit
          delta = Number(t.amount) + pnl;
        } else {
          pnl = -Number(t.amount);
          outcome = 'LOSS';
          // For losses: do nothing (amount was already deducted when trade was created)
          delta = 0;
        }

        const { error: balErr } = await supabaseAdmin.rpc('adjust_balance', {
          p_user_id: t.user_id, p_currency: t.currency, p_delta: delta
        });
        if (balErr) throw balErr;

        const { error: updErr } = await supabaseAdmin.from('trades').update({
          outcome, pnl,
          settled: true,
          settled_at: new Date().toISOString(),
          status: 'SETTLED',
          trade_result: outcome.toLowerCase(), // Set final trade result
          result_determined_at: new Date().toISOString(), // Mark when result was finalized
          final_pnl: pnl, // Set final P&L
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
