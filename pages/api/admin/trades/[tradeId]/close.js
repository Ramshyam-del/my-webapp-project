import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, code: 'method_not_allowed', message: 'Method not allowed' })
    }

    // Accept Authorization header or Supabase cookie
    let token = null
    const authHeader = req.headers.authorization || ''
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      const cookie = req.headers.cookie || ''
      const m = cookie.match(/sb-access-token=([^;]+)/)
      if (m) token = decodeURIComponent(m[1])
    }

    if (!token) {
      return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Unauthorized' })
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false, code: 'server_misconfig', message: 'Server misconfiguration' })
    }

    const server = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: authData, error: authErr } = await server.auth.getUser(token)
    if (authErr || !authData?.user) {
      return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Unauthorized' })
    }

    const adminId = authData.user.id
    let { data: profile } = await server
      .from('users')
      .select('id,email,role,status')
      .eq('id', adminId)
      .single()

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ ok: false, code: 'not_admin', message: 'Not an admin' })
    }

    const { tradeId } = req.query
    const { exitPrice } = req.body

    if (!tradeId || !exitPrice || isNaN(Number(exitPrice))) {
      return res.status(400).json({ ok: false, code: 'missing_params', message: 'Missing tradeId or valid exitPrice' })
    }

    // Get the trade details
    const { data: trade, error: tradeError } = await server
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single()

    if (tradeError || !trade) {
      return res.status(404).json({ ok: false, code: 'trade_not_found', message: 'Trade not found' })
    }

    if (trade.status === 'closed') {
      return res.status(400).json({ ok: false, code: 'trade_already_closed', message: 'Trade is already closed' })
    }

    // Calculate PnL
    const entryPrice = parseFloat(trade.entry_price)
    const exitPriceNum = parseFloat(exitPrice)
    const quantity = parseFloat(trade.quantity || 1)
    
    let pnl = 0
    if (trade.side === 'buy' || trade.side === 'long') {
      pnl = (exitPriceNum - entryPrice) * quantity
    } else if (trade.side === 'sell' || trade.side === 'short') {
      pnl = (entryPrice - exitPriceNum) * quantity
    }

    // Update the trade
    const { data: updatedTrade, error: updateError } = await server
      .from('trades')
      .update({
        status: 'closed',
        exit_price: exitPriceNum,
        pnl: pnl,
        closed_at: new Date().toISOString(),
        closed_by: adminId
      })
      .eq('id', tradeId)
      .select()
      .single()

    if (updateError) {
      console.error('Error closing trade:', updateError)
      return res.status(500).json({ ok: false, code: 'database_error', message: 'Failed to close trade' })
    }

    // Log the admin action
    await server
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'close_trade',
        target_user_id: trade.user_id,
        details: {
          trade_id: tradeId,
          symbol: trade.symbol,
          entry_price: entryPrice,
          exit_price: exitPriceNum,
          pnl: pnl,
          quantity: quantity
        },
        created_at: new Date().toISOString()
      })

    return res.status(200).json({
      ok: true,
      data: {
        trade: updatedTrade,
        message: 'Trade closed successfully'
      }
    })

  } catch (e) {
    console.error('Close trade API error:', e)
    return res.status(500).json({ ok: false, code: 'internal_error', message: 'Internal error' })
  }
}