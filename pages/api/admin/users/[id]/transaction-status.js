import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
    }

    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, code: 'MISSING_TOKEN', message: 'Missing or invalid token' })
    }
    const token = authHeader.substring(7)

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false, code: 'SERVER_MISCONFIG', message: 'Server misconfiguration' })
    }

    const server = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: authData, error: authErr } = await server.auth.getUser(token)
    if (authErr || !authData?.user) {
      return res.status(401).json({ ok: false, code: 'INVALID_TOKEN', message: 'Invalid token' })
    }

    const userId = authData.user.id
    const { data: me, error: meErr } = await server
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    if (meErr) {
      return res.status(500).json({ ok: false, code: 'PROFILE_ERROR', message: 'Failed to load profile' })
    }
    if (me?.role !== 'admin') {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Not an admin' })
    }

    const { id } = req.query
    const { status } = req.body

    if (typeof status !== 'boolean') {
      return res.status(400).json({ ok: false, code: 'INVALID_STATUS', message: 'Status must be a boolean' })
    }

    const { data: user, error: updateErr } = await server
      .from('users')
      .update({ transaction_status: status })
      .eq('id', id)
      .select('id, transaction_status')
      .single()

    if (updateErr) {
      return res.status(500).json({ ok: false, code: 'UPDATE_ERROR', message: 'Failed to update transaction status' })
    }

    return res.status(200).json({ ok: true, data: user })
  } catch (e) {
    console.error('Transaction status update error:', e)
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Internal error' })
  }
}
