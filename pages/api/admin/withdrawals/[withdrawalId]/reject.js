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
    const { reason } = req.body

    if (!withdrawalId) {
      return res.status(400).json({ ok: false, code: 'missing_params', message: 'Missing withdrawalId' })
    }

    // Get the withdrawal details
    const { data: withdrawal, error: withdrawalError } = await server
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      return res.status(404).json({ ok: false, code: 'withdrawal_not_found', message: 'Withdrawal not found' })
    }

    if (withdrawal.status === 'rejected') {
      return res.status(400).json({ ok: false, code: 'already_rejected', message: 'Withdrawal is already rejected' })
    }

    if (withdrawal.status === 'approved' || withdrawal.status === 'processing') {
      return res.status(400).json({ ok: false, code: 'invalid_status', message: 'Cannot reject approved or processing withdrawals' })
    }

    // Update the withdrawal status to rejected
    const { data: updatedWithdrawal, error: updateError } = await server
      .from('withdrawals')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: adminId,
        rejection_reason: reason || 'Rejected by admin'
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (updateError) {
      console.error('Error rejecting withdrawal:', updateError)
      return res.status(500).json({ ok: false, code: 'database_error', message: 'Failed to reject withdrawal' })
    }

    // Log the admin action
    await server
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'reject_withdrawal',
        target_user_id: withdrawal.user_id,
        details: {
          withdrawal_id: withdrawalId,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          previous_status: withdrawal.status,
          rejection_reason: reason || 'Rejected by admin'
        },
        created_at: new Date().toISOString()
      })

    return res.status(200).json({
      ok: true,
      data: updatedWithdrawal
    })

  } catch (e) {
    console.error('Reject withdrawal API error:', e)
    return res.status(500).json({ ok: false, code: 'internal_error', message: 'Internal error' })
  }
}