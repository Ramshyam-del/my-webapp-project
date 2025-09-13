import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
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

    const userId = authData.user.id
    let { data: profile } = await server
      .from('users')
      .select('id,email,role,status')
      .eq('id', userId)
      .single()

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ ok: false, code: 'not_admin', message: 'Not an admin' })
    }

    // Get query parameters
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.page_size) || 10
    const offset = (page - 1) * pageSize

    // Fetch withdrawals from withdrawals table
    const { data: withdrawals, error: withdrawalsError, count } = await server
      .from('withdrawals')
      .select(`
        id,
        user_id,
        currency,
        amount,
        fee,
        net_amount,
        wallet_address,
        tx_hash,
        status,
        admin_notes,
        created_at,
        updated_at,
        processed_at,
        users!inner(email, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (withdrawalsError) {
      console.error('Error fetching withdrawals:', withdrawalsError)
      return res.status(500).json({ ok: false, code: 'database_error', message: 'Failed to fetch withdrawals' })
    }

    // Transform data to match frontend expectations
    const transformedWithdrawals = (withdrawals || []).map(withdrawal => ({
      id: withdrawal.id,
      order_no: withdrawal.id.slice(0, 8), // Use first 8 chars of ID as order number
      email: withdrawal.users?.email || '—',
      username: withdrawal.users?.username || '—',
      currency: withdrawal.currency,
      withdrawal_amount: withdrawal.amount,
      actual_amount: withdrawal.net_amount || (withdrawal.amount - (withdrawal.fee || 0)),
      status: withdrawal.status,
      frequency: 0, // Default frequency
      channel: withdrawal.currency, // Use currency as channel
      address: withdrawal.wallet_address,
      network: '—', // Network info not available in current schema
      created_at: withdrawal.created_at,
      operator: '—', // Default operator
      updated_at: withdrawal.updated_at,
      tx_hash: withdrawal.tx_hash,
      admin_notes: withdrawal.admin_notes,
      processed_at: withdrawal.processed_at
    }));

    return res.status(200).json({
      ok: true,
      data: {
        items: transformedWithdrawals,
        total: count || 0,
        pagination: {
          page,
          page_size: pageSize,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / pageSize)
        }
      }
    })

  } catch (e) {
    console.error('Withdrawals API error:', e)
    return res.status(500).json({ ok: false, code: 'internal_error', message: 'Internal error' })
  }
}
