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

    const { withdrawalId } = req.query
    const { admin_note } = req.body

    if (!withdrawalId) {
      return res.status(400).json({ ok: false, code: 'missing_params', message: 'Missing withdrawalId' })
    }

    // Get the withdrawal details from withdrawals table
    const { data: withdrawal, error: withdrawalError } = await server
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      return res.status(404).json({ ok: false, code: 'withdrawal_not_found', message: 'Withdrawal not found' })
    }

    if (withdrawal.status === 'approved') {
      return res.status(400).json({ ok: false, code: 'already_approved', message: 'Withdrawal is already approved' })
    }

    if (!['pending', 'locked'].includes(withdrawal.status)) {
      return res.status(400).json({ ok: false, code: 'invalid_status', message: 'Can only approve pending or locked withdrawals' })
    }

    // Check user's current balance
    const { data: portfolio, error: portfolioError } = await server
      .from('portfolios')
      .select('balance')
      .eq('user_id', withdrawal.user_id)
      .eq('currency', withdrawal.currency)
      .single()

    if (portfolioError || !portfolio) {
      return res.status(400).json({ 
        ok: false, 
        code: 'insufficient_balance', 
        message: 'User portfolio not found or insufficient balance' 
      })
    }

    const currentBalance = parseFloat(portfolio.balance)
    const withdrawalAmount = parseFloat(withdrawal.amount)

    if (currentBalance < withdrawalAmount) {
      return res.status(400).json({ 
        ok: false, 
        code: 'insufficient_balance', 
        message: `Insufficient balance. Available: ${currentBalance} ${withdrawal.currency}, Required: ${withdrawalAmount} ${withdrawal.currency}` 
      })
    }

    // Start transaction: Update withdrawal status and deduct balance
    const { data: updatedWithdrawal, error: updateError } = await server
      .from('withdrawals')
      .update({
        status: 'approved',
        admin_note: admin_note || null,
        processed_at: new Date().toISOString(),
        processed_by: adminId
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (updateError) {
      console.error('Error approving withdrawal:', updateError)
      return res.status(500).json({ ok: false, code: 'database_error', message: 'Failed to approve withdrawal' })
    }

    // Deduct balance from user's portfolio
    const newBalance = currentBalance - withdrawalAmount
    const { error: balanceUpdateError } = await server
      .from('portfolios')
      .update({ balance: newBalance })
      .eq('user_id', withdrawal.user_id)
      .eq('currency', withdrawal.currency)

    if (balanceUpdateError) {
      console.error('Error updating balance:', balanceUpdateError)
      // Rollback withdrawal status
      await server
        .from('withdrawals')
        .update({ status: withdrawal.status })
        .eq('id', withdrawalId)
      
      return res.status(500).json({ ok: false, code: 'balance_update_failed', message: 'Failed to update user balance' })
    }

    return res.status(200).json({
      ok: true,
      data: updatedWithdrawal,
      message: 'Withdrawal approved successfully and balance deducted'
    })

  } catch (e) {
    console.error('Approve withdrawal API error:', e)
    return res.status(500).json({ ok: false, code: 'internal_error', message: 'Internal error' })
  }
}