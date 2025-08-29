const router = require('express').Router();
const { serverSupabase } = require('../lib/supabaseServer');

router.patch('/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const { exitPrice } = req.body || {};

    // Validate required fields
    if (!id) {
      return res.status(400).json({ 
        ok: false, 
        code: 'missing_id',
        error: 'Trade ID is required' 
      });
    }

    if (exitPrice == null || isNaN(Number(exitPrice))) {
      return res.status(400).json({ 
        ok: false, 
        code: 'invalid_exit_price',
        error: 'Valid exit price is required' 
      });
    }

    // Check if serverSupabase is available
    if (!serverSupabase) {
      return res.status(503).json({
        ok: false,
        code: 'service_unavailable',
        error: 'Database service unavailable'
      });
    }

    // Fetch the trade first
    const { data: trade, error: fetchErr } = await serverSupabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !trade) {
      return res.status(404).json({ 
        ok: false, 
        code: 'trade_not_found',
        error: 'Trade not found' 
      });
    }

    // Check if trade is already closed
    if (trade.status !== 'OPEN') {
      return res.status(400).json({ 
        ok: false, 
        code: 'trade_already_closed',
        error: 'Trade is already closed' 
      });
    }

    // Calculate PnL
    const entry = Number(trade.entry_price);
    const exit = Number(exitPrice);
    const lev = Number(trade.leverage);
    const amt = Number(trade.amount);

    // Calculate raw percentage change
    const raw = trade.side === 'LONG'
      ? (exit - entry) / entry
      : (entry - exit) / entry;

    // Calculate final PnL with leverage
    const pnl = raw * lev * amt;
    const status = pnl >= 0 ? 'WIN' : 'LOSS';

    // Update the trade
    const { data: updated, error: updErr } = await serverSupabase
      .from('trades')
      .update({
        exit_price: exit,
        pnl,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) {
      console.error('Trade update error:', updErr);
      throw updErr;
    }

    res.json({ 
      ok: true, 
      trade: updated,
      pnl_calculation: {
        entry_price: entry,
        exit_price: exit,
        leverage: lev,
        amount: amt,
        raw_percentage: raw,
        final_pnl: pnl,
        status: status
      }
    });
  } catch (e) {
    console.error('PATCH /api/trades/:id/close:', e);
    res.status(500).json({ 
      ok: false, 
      code: 'internal_error',
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
